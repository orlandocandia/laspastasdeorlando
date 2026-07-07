#!/usr/bin/env node
'use strict';
// sync-db.js — Sincronizacion bidireccional entre SQLite local y Turso (nube)
//
// Uso:
//   node sync-db.js push        # Local SQLite -> Turso (sobrescribe la nube)
//   node sync-db.js pull        # Turso -> Local SQLite (sobrescribe el local)
//   node sync-db.js             # Muestra esta ayuda
//   node sync-db.js --help      # Muestra esta ayuda
//   node sync-db.js -h          # Muestra esta ayuda
//
// Requiere:
//   - Node.js instalado
//   - dev.db en el directorio actual
//   - .env en el directorio actual con DATABASE_URL=libsql://... (modo ONLINE)
//   - @libsql/client disponible en node_modules (incluido en el paquete)
//
// El wrapper (sync-db.sh / sync-db.bat) se encarga de:
//   - Resolver la ruta del paquete
//   - Verificar prerrequisitos
//   - Crear backup antes de sincronizar
//   - Pedir confirmacion para pull (sobrescribe datos locales)

const fs = require('fs');

// ---------------------------------------------------------------------------
// Banner y ayuda
// ---------------------------------------------------------------------------

const BANNER = [
  '============================================',
  '  🔄 Sincronización bidireccional Local ↔ Turso',
  '============================================'
].join('\n');

function printHelp() {
  console.log(BANNER);
  console.log('');
  console.log('Uso:');
  console.log('  node sync-db.js push          # Local SQLite → Turso (sobrescribe la nube)');
  console.log('  node sync-db.js pull          # Turso → Local SQLite (sobrescribe el local)');
  console.log('  node sync-db.js --help        # Mostrar esta ayuda');
  console.log('  node sync-db.js -h            # Mostrar esta ayuda');
  console.log('');
  console.log('Requisitos previos:');
  console.log('  - Estar en modo ONLINE (.env con DATABASE_URL=libsql://...)');
  console.log('    Ejecutá ./switch-mode.sh online (o switch-mode.bat online) primero.');
  console.log('  - Que dev.db exista en el directorio actual.');
  console.log('  - Que @libsql/client esté disponible en node_modules.');
  console.log('');
  console.log('Notas:');
  console.log('  - Para pull, usá el wrapper sync-db.sh / sync-db.bat que pide confirmación');
  console.log('    interactiva antes de sobrescribir tus datos locales.');
  console.log('  - Siempre se crea un backup automático de dev.db antes de sobrescribir.');
  console.log('  - Las tablas internas (sqlite_%, _prisma_%, __drizzle_%, libsql_wasm_func_table)');
  console.log('    se ignoran automáticamente.');
  console.log('');
}

// ---------------------------------------------------------------------------
// Helpers de .env
// ---------------------------------------------------------------------------

// Lee el archivo .env del directorio actual y devuelve un objeto con las
// variables relevantes. Lanza Error si falta DATABASE_URL.
function readEnv() {
  let envText;
  try {
    envText = fs.readFileSync('.env', 'utf8');
  } catch (e) {
    throw new Error('No se pudo leer .env en el directorio actual. ¿Ejecutaste el wrapper desde la raíz del paquete?');
  }

  let databaseUrl = '';
  let authToken = '';

  for (const raw of envText.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const m = line.match(/^DATABASE_URL=(.+)$/);
    if (m) {
      databaseUrl = m[1].trim().replace(/^["']|["']$/g, '');
    }
    const t = line.match(/^(?:DATABASE_AUTH_TOKEN|TURSO_AUTH_TOKEN)=(.+)$/);
    if (t) {
      authToken = t[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  // Si la URL trae ?authToken=... adentro, lo extraemos y lo sacamos de la URL.
  try {
    const u = new URL(databaseUrl);
    if (u.searchParams.get('authToken')) {
      authToken = u.searchParams.get('authToken');
    }
    databaseUrl = databaseUrl.split('?')[0];
  } catch (e) {
    // Si la URL no parsea (p.ej. file:), ignoramos el query string manualmente.
    if (databaseUrl.includes('?')) {
      const qIdx = databaseUrl.indexOf('?');
      const qs = databaseUrl.slice(qIdx + 1);
      const m = qs.match(/(?:^|&)authToken=([^&]+)/);
      if (m) authToken = decodeURIComponent(m[1]);
      databaseUrl = databaseUrl.slice(0, qIdx);
    }
  }

  if (!databaseUrl) {
    throw new Error('Falta DATABASE_URL en .env. Ejecutá ./switch-mode.sh online primero.');
  }

  return { databaseUrl, authToken };
}

// ---------------------------------------------------------------------------
// Helpers de DB
// ---------------------------------------------------------------------------

// Obtiene la lista de tablas de usuario (excluye las internas de SQLite/Prisma/Drizzle/libsql).
async function getUserTables(client) {
  const r = await client.execute(
    "SELECT name FROM sqlite_master " +
    "WHERE type='table' " +
    "AND name NOT LIKE 'sqlite_%' " +
    "AND name NOT LIKE '_prisma_%' " +
    "AND name NOT LIKE '__drizzle_%' " +
    "AND name != 'libsql_wasm_func_table' " +
    "ORDER BY name"
  );
  return r.rows.map(row => row.name).filter(Boolean);
}

// Obtiene las columnas de una tabla via PRAGMA table_info.
async function getTableColumns(client, table) {
  const r = await client.execute(`PRAGMA table_info("${table}")`);
  return r.rows.map(row => row.name).filter(Boolean);
}

// Devuelve el CREATE statement original de una tabla en SOURCE (para replicar schema).
async function getCreateSql(client, table) {
  const r = await client.execute(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  );
  if (r.rows.length === 0) return null;
  return r.rows[0].sql;
}

// Devuelve los CREATE statements de índices asociados a una tabla en SOURCE.
async function getIndexCreateSqls(client, table) {
  const r = await client.execute(
    `SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL`,
    [table]
  );
  return r.rows.map(row => row.sql).filter(Boolean);
}

// Verifica si una tabla existe en el TARGET.
async function tableExists(client, table) {
  const r = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [table]
  );
  return r.rows.length > 0;
}

// ---------------------------------------------------------------------------
// Sincronización de schema (solo para pull: asegura que el local tenga las tablas)
// ---------------------------------------------------------------------------

async function ensureSchema(sourceClient, targetClient, tables) {
  let creadas = 0;
  let indicesCreados = 0;

  for (const table of tables) {
    try {
      const existe = await tableExists(targetClient, table);
      if (existe) continue;

      // 1) Crear la tabla con el schema original del SOURCE
      const createSql = await getCreateSql(sourceClient, table);
      if (createSql) {
        await targetClient.execute(createSql);
        creadas++;
      }

      // 2) Recrear los índices asociados
      const indexSqls = await getIndexCreateSqls(sourceClient, table);
      for (const idxSql of indexSqls) {
        try {
          await targetClient.execute(idxSql);
          indicesCreados++;
        } catch (e) {
          // Un índice puede fallar si ya existe con otro nombre o si la columna
          // referenciada no aplica. Lo reportamos pero seguimos.
          console.warn(`  ⚠️  Índice de "${table}" no creado: ${e.message}`);
        }
      }
    } catch (e) {
      console.warn(`  ⚠️  No se pudo crear schema de "${table}": ${e.message}`);
    }
  }

  if (creadas > 0) {
    console.log(`  🏗️  Schema: ${creadas} tabla(s) creada(s) en destino, ${indicesCreados} índice(s).`);
  }
}

// ---------------------------------------------------------------------------
// Sincronización de datos de una tabla (con chunking de a 100 filas)
// ---------------------------------------------------------------------------

const BATCH_CHUNK = 100;

async function syncTable(sourceClient, targetClient, table) {
  const cols = await getTableColumns(sourceClient, table);
  if (cols.length === 0) {
    console.log(`  ⏭️  ${table}: sin columnas, omitida`);
    return { ok: true, skipped: true, count: 0 };
  }

  // Leer todos los datos del SOURCE
  const data = await sourceClient.execute(`SELECT * FROM "${table}"`);

  // Limpiar la tabla en TARGET (puede no existir si ensureSchema falló)
  try {
    await targetClient.execute(`DELETE FROM "${table}"`);
  } catch (e) {
    // Si no existe, lo reportamos como error de la tabla pero seguimos con las demás
    throw new Error(`no se pudo limpiar (¿falta tabla?): ${e.message}`);
  }

  // Insertar por lotes de BATCH_CHUNK filas
  if (data.rows.length > 0) {
    const placeholders = cols.map(() => '?').join(', ');
    const colList = cols.map(c => `"${c}"`).join(', ');
    const stmt = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`;

    for (let i = 0; i < data.rows.length; i += BATCH_CHUNK) {
      const slice = data.rows.slice(i, i + BATCH_CHUNK);
      const statements = slice.map(row => ({
        sql: stmt,
        args: cols.map(c => row[c])
      }));
      await targetClient.batch(statements);
    }
  }

  console.log(`  ✅ ${table}: ${data.rows.length} filas`);
  return { ok: true, skipped: false, count: data.rows.length };
}

// ---------------------------------------------------------------------------
// Verificación post-sync (cuenta filas en ProductoTerminado del TARGET)
// ---------------------------------------------------------------------------

async function verifyTarget(targetClient, targetLabel) {
  try {
    const v = await targetClient.execute('SELECT COUNT(*) as c FROM ProductoTerminado');
    const count = v.rows.length > 0 ? v.rows[0].c : 0;
    console.log(`📦 ProductoTerminado: ${count} filas en ${targetLabel}.`);
  } catch (e) {
    console.log(`⚠️  Verificación: no se pudo contar ProductoTerminado en ${targetLabel} (¿no existe la tabla?).`);
  }
}

// ---------------------------------------------------------------------------
// runSync — Orquestación reutilizable de la sincronización.
// Recibe los clientes SOURCE y TARGET ya conectados, y la dirección (para
// decidir si se ejecuta ensureSchema en el target). Devuelve un objeto con
// el resumen. Lanza Error solo en fallos fatales (no en fallos por-tabla).
// Exportado para que los tests puedan ejercitar la lógica sin .env ni Turso.
// ---------------------------------------------------------------------------

async function runSync(source, target, direction) {
  if (direction !== 'push' && direction !== 'pull') {
    throw new Error(`Dirección inválida "${direction}". Usá "push" o "pull".`);
  }

  const sourceLabel = direction === 'push' ? 'local' : 'Turso';
  const targetLabel = direction === 'push' ? 'Turso' : 'local';

  // --- Desactivar FK enforcement en TARGET durante la sincronización ---
  // Estamos reemplazando TODOS los datos tabla por tabla (DELETE + INSERT).
  // Si hay foreign keys, el DELETE de una tabla padre fallaría porque la tabla
  // hija aún la referencia. Desactivamos FKs temporalmente y las reactivamos
  // al final. Si el target no soporta este PRAGMA (p.ej. algunos backends
  // remotos), lo ignoramos silenciosamente.
  let fkDisabled = false;
  try {
    await target.execute('PRAGMA foreign_keys = OFF');
    fkDisabled = true;
  } catch (e) {
    // Algunos backends pueden rechazar este PRAGMA; no es fatal.
  }

  try {
    // --- Listar tablas del SOURCE ---
    const tables = await getUserTables(source);
    console.log(`  📋 Tablas encontradas en origen (${sourceLabel}): ${tables.length}`);
    console.log('  --------------------------------------------');

    // --- En pull, asegurar schema en TARGET antes de sincronizar datos ---
    if (direction === 'pull') {
      console.log('  🏗️  Verificando schema en destino (pull)...');
      try {
        await ensureSchema(source, target, tables);
      } catch (e) {
        console.warn(`  ⚠️  Error parcial al sincronizar schema: ${e.message}`);
        console.warn('     Continuando con la sincronización de datos de todas formas.');
      }
      console.log('  --------------------------------------------');
    }

    // --- Sincronizar datos tabla por tabla ---
    let synced = 0;
    let skipped = 0;
    let failed = 0;
    let totalRows = 0;
    const failedTables = [];

    for (const table of tables) {
      try {
        const res = await syncTable(source, target, table);
        if (res.skipped) {
          skipped++;
        } else {
          synced++;
          totalRows += res.count;
        }
      } catch (e) {
        failed++;
        failedTables.push(table);
        console.error(`  ❌ ${table}: ${e.message}`);
      }
    }

    console.log('  --------------------------------------------');
    console.log(`  📊 Resumen: ${synced} sincronizadas, ${skipped} omitidas, ${failed} fallidas, ${totalRows} filas totales.`);

    if (failed > 0) {
      console.log(`\n⚠️  Sincronización ${direction} completada con ${failed} error(es): ${synced}/${tables.length} tablas OK.`);
    } else {
      console.log(`\n✅ Sincronización ${direction} completada: ${synced}/${tables.length} tablas.`);
    }

    // --- Verificación post-sync (cuenta ProductoTerminado en TARGET) ---
    await verifyTarget(target, targetLabel);

    return { synced, skipped, failed, totalRows, total: tables.length, failedTables };
  } finally {
    // --- Reactivar FK enforcement si lo desactivamos ---
    if (fkDisabled) {
      try {
        await target.execute('PRAGMA foreign_keys = ON');
      } catch (e) {
        // No es fatal si no se puede reactivar (p.ej. backend remoto).
      }
    }
  }
}

// ---------------------------------------------------------------------------
// main — Entry point del CLI. Lee .env, conecta a local + Turso, llama a runSync.
// ---------------------------------------------------------------------------

async function main() {
  const direction = process.argv[2];

  // Sin argumento, o --help / -h -> mostrar ayuda y salir 0
  if (!direction || direction === '--help' || direction === '-h') {
    printHelp();
    return 0;
  }

  if (direction !== 'push' && direction !== 'pull') {
    console.error(`❌ FATAL: Dirección inválida "${direction}". Usá "push" o "pull".`);
    console.error('   Ejecutá `node sync-db.js --help` para ver el uso.');
    return 1;
  }

  console.log(BANNER);
  console.log('');
  console.log(`  Dirección: ${direction === 'push' ? 'Local SQLite → Turso' : 'Turso → Local SQLite'}`);
  console.log('');

  // --- 1) Leer y validar .env ---
  let databaseUrl, authToken;
  try {
    ({ databaseUrl, authToken } = readEnv());
  } catch (e) {
    console.error(`❌ FATAL: ${e.message}`);
    return 1;
  }

  if (!databaseUrl.startsWith('libsql://') && !databaseUrl.startsWith('http')) {
    console.error('❌ FATAL: DATABASE_URL no es una URL de Turso (libsql:// o http).');
    console.error('   Ejecutá ./switch-mode.sh online (o switch-mode.bat online) primero.');
    return 1;
  }

  console.log(`  ✅ .env leído (modo ONLINE detectado)`);
  console.log(`  🔗 URL: ${databaseUrl}`);
  console.log('');

  // --- 2) Cargar @libsql/client desde node_modules del paquete ---
  let createClient;
  try {
    // require relativo al archivo actual para que Node resuelva node_modules
    // del paquete (no del CWD). En CommonJS, require usa __dirname.
    ({ createClient } = require('@libsql/client'));
  } catch (e) {
    console.error('❌ FATAL: No se pudo cargar @libsql/client.');
    console.error('   ¿Ejecutaste install-windows.bat (en Windows) o está node_modules/ completo?');
    console.error(`   Detalle: ${e.message}`);
    return 1;
  }

  // --- 3) Conectar a local y remoto ---
  let local, remote;
  try {
    local = createClient({ url: 'file:./dev.db' });
  } catch (e) {
    console.error(`❌ FATAL: No se pudo abrir dev.db local: ${e.message}`);
    return 1;
  }
  try {
    remote = createClient({ url: databaseUrl, authToken: authToken || undefined });
  } catch (e) {
    console.error(`❌ FATAL: No se pudo conectar a Turso: ${e.message}`);
    return 1;
  }

  // --- 4) Definir SOURCE y TARGET según dirección ---
  const source = direction === 'push' ? local : remote;
  const target = direction === 'push' ? remote : local;

  console.log(`  ✅ Conexión establecida`);
  console.log('');

  // --- 5-9) Sincronizar ---
  await runSync(source, target, direction);

  // Exit 0 aunque alguna tabla falle (el resumen ya lo informa). Exit 1 solo
  // en errores fatales (conexión, .env, etc.) que ya retornamos arriba.
  return 0;
}

// --- Exportar para tests ---
module.exports = {
  runSync,
  getUserTables,
  getTableColumns,
  syncTable,
  ensureSchema,
  verifyTarget,
  readEnv,
};

// --- Ejecutar main solo si se invoca directamente (no cuando se require desde tests) ---
if (require.main === module) {
  main().then(code => {
    process.exit(code);
  }).catch(e => {
    console.error(`❌ FATAL: ${e && e.stack ? e.stack : (e && e.message ? e.message : e)}`);
    process.exit(1);
  });
}
