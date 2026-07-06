#!/bin/bash
# sync-to-turso.sh — Sincroniza los datos locales de SQLite hacia Turso (nube)
# Requiere: estar en modo ONLINE (.env con DATABASE_URL=libsql://...)
#           Ejecute ./switch-mode.sh online primero si es necesario.

# Resolver rutas relativas a la ubicacion del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PKG_DIR"

echo "============================================"
echo "  ☁️  Sincronizando SQLite → Turso"
echo "============================================"
echo

# --- Paso 1: Verificar que Node.js este disponible ---
if ! command -v node >/dev/null 2>&1; then
    echo "  ❌ ERROR: Node.js no esta instalado."
    echo "  Instale Node.js y vuelva a intentarlo."
    exit 1
fi
echo "  ✅ Paso 1: Node.js detectado ($(node --version))"
echo

# --- Paso 2: Verificar que dev.db exista ---
if [ ! -f "dev.db" ]; then
    echo "  ❌ ERROR: No se encontro dev.db en $PKG_DIR"
    echo "  La base de datos local no existe. Ejecute el sistema al menos una vez en modo local."
    exit 1
fi
echo "  ✅ Paso 2: Base de datos local encontrada (dev.db)"
echo

# --- Paso 3: Verificar que .env exista y este en modo ONLINE ---
if [ ! -f ".env" ]; then
    echo "  ❌ ERROR: No se encontro .env"
    echo "  Ejecute ./switch-mode.sh online primero."
    exit 1
fi

if ! grep -q "^DATABASE_URL=libsql://" .env && ! grep -q "^DATABASE_URL=http" .env; then
    echo "  ❌ ERROR: Debe estar en modo ONLINE para sincronizar."
    echo "  Ejecute ./switch-mode.sh online primero."
    exit 1
fi
echo "  ✅ Paso 3: .env en modo ONLINE (Turso)"
echo

# --- Paso 4: Crear backup con timestamp de dev.db ---
mkdir -p data
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="data/backup-${TS}.db"
cp dev.db "$BACKUP"
if [ $? -ne 0 ]; then
    echo "  ❌ ERROR: No se pudo crear el backup en $BACKUP"
    exit 1
fi
echo "  ✅ Paso 4: Backup creado: $BACKUP"
echo

# --- Paso 5: Ejecutar la sincronizacion con Node.js (logica inline) ---
echo "  🔄 Paso 5: Sincronizando tablas..."
echo "  --------------------------------------------"

node << 'EOF'
const { createClient } = require('@libsql/client');
const fs = require('fs');

// --- Leer .env ---
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
let tursoUrl = '';
let authToken = '';
for (const line of lines) {
  const m = line.match(/^DATABASE_URL=(.+)$/);
  if (m) tursoUrl = m[1].trim().replace(/^["']|["']$/g, '');
  const t = line.match(/^(?:DATABASE_AUTH_TOKEN|TURSO_AUTH_TOKEN)=(.+)$/);
  if (t) authToken = t[1].trim().replace(/^["']|["']$/g, '');
}
// Extraer authToken del query string de la URL si esta ahi
try {
  const u = new URL(tursoUrl);
  if (u.searchParams.get('authToken')) authToken = u.searchParams.get('authToken');
  tursoUrl = tursoUrl.split('?')[0];
} catch(e) {}

if (!tursoUrl.startsWith('libsql://') && !tursoUrl.startsWith('http')) {
  console.error('❌ ERROR: DATABASE_URL no es una URL de Turso (libsql://). Ejecute switch-mode.sh online primero.');
  process.exit(1);
}

const local = createClient({ url: 'file:./dev.db' });
const remote = createClient({ url: tursoUrl, authToken: authToken || undefined });

async function getTables(client) {
  const r = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' AND name NOT LIKE '__drizzle_%'");
  return r.rows.map(row => row.name).filter(Boolean).sort();
}

async function tableColumns(client, table) {
  const r = await client.execute(`PRAGMA table_info("${table}")`);
  return r.rows.map(row => row.name);
}

(async () => {
  const tables = await getTables(local);
  console.log(`  📋 Tablas encontradas: ${tables.length}`);
  console.log('  --------------------------------------------');
  let synced = 0;
  for (const table of tables) {
    try {
      const cols = await tableColumns(local, table);
      if (cols.length === 0) {
        console.log(`  ⏭️  ${table}: sin columnas, omitida`);
        continue;
      }
      const data = await local.execute(`SELECT * FROM "${table}"`);
      // Limpiar tabla remota
      try {
        await remote.execute(`DELETE FROM "${table}"`);
      } catch(e) {
        /* la tabla puede no existir aun en remoto */
      }
      // Insertar por lotes
      const placeholders = cols.map(() => '?').join(', ');
      const colList = cols.map(c => `"${c}"`).join(', ');
      const stmt = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`;
      const batchArgs = data.rows.map(row => cols.map(c => row[c]));
      if (batchArgs.length > 0) {
        await remote.batch(batchArgs.map(args => ({ sql: stmt, args })));
      }
      console.log(`  ✅ ${table}: ${data.rows.length} filas`);
      synced++;
    } catch (e) {
      console.error(`  ❌ ${table}: ${e.message}`);
    }
  }
  console.log('  --------------------------------------------');
  console.log(`\n  ✅ Sincronización completada: ${synced}/${tables.length} tablas.`);

  // --- Paso 6: Verificacion ---
  console.log('\n  ✅ Verificando...');
  try {
    const v = await remote.execute("SELECT COUNT(*) as c FROM ProductoTerminado");
    console.log(`  📦 ProductoTerminado: ${v.rows[0].c} filas en Turso.`);
  } catch(e) {
    console.log('  ℹ️  Verificación: no se pudo contar ProductoTerminado (puede no existir la tabla).');
  }
})().catch(e => {
  console.error('  ❌ FATAL:', e.message || e);
  process.exit(1);
});
EOF

NODE_EXIT=$?
echo
if [ $NODE_EXIT -ne 0 ]; then
    echo "============================================"
    echo "  ❌ La sincronización fallo (codigo $NODE_EXIT)"
    echo "  Se mantiene el backup: $BACKUP"
    echo "============================================"
    exit $NODE_EXIT
fi

echo "============================================"
echo "  ✅ Sincronización completada con exito"
echo "  Backup disponible en: $BACKUP"
echo "============================================"
