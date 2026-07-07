# 💾 Backup Automático de Turso → Vercel Blob Storage

Sistema de backup automático diario para la base de datos de **Las Pastas de Orlando**.

## 📋 Cómo funciona

```
┌──────────────┐    .sql dump    ┌──────────────┐    .sql.gz    ┌──────────────────────┐
│  Turso DB    │ ──────────────▶ │  Script Node │ ────────────▶ │ Vercel Blob Storage  │
│ (libsql)     │                 │  backup.mjs  │               │ backups/*.sql.gz     │
└──────────────┘                 └──────────────┘               └──────────────────────┘
                                        │                               │
                                        │ list + delete antiguos ◀──────┤
                                        ▼
                                 mantiene últimos 30
```

**Cada día a las 03:00 AM (Buenos Aires)**, GitHub Actions ejecuta automáticamente:

1. Conecta a la DB de Turso.
2. Dumpea TODAS las tablas (schema + datos + índices + triggers) a un archivo `.sql`.
3. Comprime con gzip → archivo `.sql.gz` (típicamente 70-80% más chico).
4. Sube a Vercel Blob Storage en `backups/laspastasdeorlando-YYYYMMDD-HHMMSS.sql.gz`.
5. Lista los backups existentes y elimina los más antiguos (mantiene los últimos 30).
6. Si falla, crea un Issue en GitHub automáticamente para notificar.

## 🚀 Configuración inicial (una sola vez)

### Paso 1: Obtener las credenciales

Necesitás 3 valores:

| Secret | Dónde conseguirlo |
|--------|-------------------|
| `TURSO_DATABASE_URL` | Turso dashboard → tu database → "URL" (ej: `libsql://mi-db.turso.io`) |
| `TURSO_AUTH_TOKEN` | Turso dashboard → tu database → "Tokens" → crear token de lectura/escritura |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → Storage → tu Blob Store → "Tokens" → crear token Read & Write |

### Paso 2: Configurar los secrets en GitHub

1. Andá a: https://github.com/orlandocandia/laspastasdeorlando/settings/secrets/actions
2. Click en **"New repository secret"**
3. Agregá los 3 secrets:

   - Name: `TURSO_DATABASE_URL` → Value: `libsql://mi-db.turso.io`
   - Name: `TURSO_AUTH_TOKEN` → Value: `eyJhbGciOi...` (tu token JWT de Turso)
   - Name: `BLOB_READ_WRITE_TOKEN` → Value: `vercel_blob_rw_xxxxx...`

### Paso 3: Verificar que el workflow está activo

1. Andá a: https://github.com/orlandocandia/laspastasdeorlando/actions
2. En la lista de workflows de la izquierda, deberías ver **"Backup Turso Diario"**.
3. Click en ese workflow → debería estar habilitado (con un botón "Enable workflow" si es la primera vez).

### Paso 4: Probar el backup manualmente

En la misma página de Actions:

1. Click en **"Run workflow"** (botón a la derecha).
2. Elegí la rama `main`.
3. Click en **"Run workflow"** verde.
4. Esperá 1-2 minutos y refrescá la página para ver el run.
5. Abrí el run → deberías ver los logs del backup.

Si todo salió bien, vas a ver algo como:

```
✅ Dump generado: 110.4 KB en 0.0s (590 filas)
📦 Subiendo a Vercel Blob: backups/laspastasdeorlando-20260115-060000.sql.gz (28.3 KB comprimido)...
✅ Subido: https://xxxx.public.blob.vercel-storage.com/backups/laspastasdeorlando-20260115-060000.sql.gz
🧹 Verificando retención (keep=30)...
  Total backups en Blob: 1
  ✅ No hay backups para eliminar (hay 1, límite 30)
```

## 📆 Programación

El backup corre automáticamente **todos los días a las 06:00 UTC (03:00 AM hora de Buenos Aires)**.

- La hora fue elegida porque:
  - Es de noche en Argentina (menos tráfico en el sistema).
  - GitHub Actions tiene menos carga a esas horas (runs más rápidos).
- Para cambiar la hora, editá el cron en `.github/workflows/backup-turso-diario.yml`:
  ```yaml
  schedule:
    - cron: '0 6 * * *'  # min hora dia-mes mes dia-semana (UTC)
  ```
  Ejemplos:
  - `'0 6 * * *'` → 06:00 UTC = 03:00 AM Buenos Aires (default)
  - `'0 9 * * *'` → 09:00 UTC = 06:00 AM Buenos Aires
  - `'0 0 * * *'` → 00:00 UTC = 21:00 Buenos Aires (día anterior)
  - `'0 */6 * * *'` → cada 6 horas (4 backups por día)

## 🎛️ Comandos disponibles

Todos los comandos se ejecutan desde la raíz del proyecto.

### Backup (ejecutar manualmente)

```bash
# Backup completo: dump + compress + upload a Blob + cleanup
node scripts/backup-turso.mjs

# Backup pero NO subir a Blob (solo genera .sql.gz local)
node scripts/backup-turso.mjs --no-upload

# Backup con copia local adicional
node scripts/backup-turso.mjs --local ./backups/mi-backup.sql.gz

# Dry-run (no modifica nada, solo muestra qué haría)
node scripts/backup-turso.mjs --dry-run

# Cambiar número de backups a mantener (default 30)
node scripts/backup-turso.mjs --keep 60

# Backup apuntando a una DB específica (override)
node scripts/backup-turso.mjs --db libsql://otra-db.turso.io

# Log detallado
node scripts/backup-turso.mjs --verbose
```

### Listar backups en Vercel Blob

```bash
node scripts/backup-turso.mjs list
```

Salida:
```
📋 Listando backups en Vercel Blob Storage...

  Total: 7 backup(s)
  ─────────────────────────────────────────────────────────────────────────────────────
  #  | Fecha             | Tamaño    | Archivo
  ─────────────────────────────────────────────────────────────────────────────────────
   1 | 2026-01-15 06:00:12 |  28.3 KB | laspastasdeorlando-20260115-060012.sql.gz
   2 | 2026-01-14 06:00:08 |  28.1 KB | laspastasdeorlando-20260114-060008.sql.gz
   ...
  ─────────────────────────────────────────────────────────────────────────────────────
  Más reciente: https://xxxx.public.blob.vercel-storage.com/backups/laspastasdeorlando-20260115-060012.sql.gz
  Más antiguo:  https://xxxx.public.blob.vercel-storage.com/backups/laspastasdeorlando-20260109-060011.sql.gz
```

### Descargar un backup

```bash
# Descargar el backup más reciente
node scripts/backup-turso.mjs download

# Descargar un backup específico por fecha (YYYYMMDD)
node scripts/backup-turso.mjs download --date 20260115
```

El archivo `.sql.gz` se guarda en la raíz del proyecto.

### Restaurar un backup

```bash
# Restaurar el backup más reciente en una DB SQLite local
node scripts/backup-turso.mjs restore --to file:./prisma/dev.db

# Restaurar un backup específico
node scripts/backup-turso.mjs restore --to file:./prisma/dev.db --date 20260115

# Restaurar en otra DB de Turso (¡cuidado! sobrescribe)
node scripts/backup-turso.mjs restore --to libsql://mi-db-restauracion.turso.io
```

**⚠️ ADVERTENCIA**: El restore **SOBREESCRIBE** la DB destino. El script hace `DROP TABLE IF EXISTS` antes de cada `CREATE TABLE`. Usá una DB vacía o una que estés dispuesto a perder.

### Restauración manual (alternativa)

Si preferís no usar el script de restore, podés hacerlo manualmente:

```bash
# 1. Descargar el backup
node scripts/backup-turso.mjs download

# 2. Descomprimir
gunzip laspastasdeorlando-YYYYMMDD-HHMMSS.sql.gz

# 3. Aplicar con sqlite3 CLI (requiere sqlite3 instalado)
sqlite3 ./prisma/dev.db < laspastasdeorlando-YYYYMMDD-HHMMSS.sql

# O aplicar a Turso con el CLI de Turso (requiere turso CLI instalado)
turso db shell mi-db < laspastasdeorlando-YYYYMMDD-HHMMSS.sql
```

## 🔧 Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` o `TURSO_DATABASE_URL` | (requerido) | URL de la DB origen. `libsql://...` para Turso, `file:...` para SQLite local. |
| `TURSO_AUTH_TOKEN` o `DATABASE_AUTH_TOKEN` | (vacío) | Token de Turso (requerido si DATABASE_URL es `libsql://`). |
| `BLOB_READ_WRITE_TOKEN` | (requerido) | Token de Vercel Blob Storage. Obtenelo en https://vercel.com/dashboard/stores |
| `BACKUP_RETENTION_COUNT` | `30` | Cantidad de backups a mantener. Override con `--keep N`. |

## 📊 Monitoreo

### Ver runs de GitHub Actions

- URL: https://github.com/orlandocandia/laspastasdeorlando/actions
- El workflow "Backup Turso Diario" debería correr todos los días.
- Si un run falla, se crea automáticamente un Issue con el label `backup` y `failed`.

### Ver backups en Vercel Blob

- URL: https://vercel.com/dashboard/stores → tu Blob Store → "Files"
- Filtrá por prefijo `backups/`.
- Cada archivo tiene: nombre, tamaño, fecha de upload, URL pública.

### Verificar desde local

```bash
# Listar backups
node scripts/backup-turso.mjs list

# Ver tamaño total de todos los backups
node scripts/backup-turso.mjs list | tail -5
```

## 🛟 Solución de problemas

### "BLOB_READ_WRITE_TOKEN no configurado"

Falta configurar el secret de Vercel Blob en GitHub Actions:
1. Andá a https://github.com/orlandocandia/laspastasdeorlando/settings/secrets/actions
2. Agregá el secret `BLOB_READ_WRITE_TOKEN` con tu token de Vercel Blob.

### "Cannot read properties of undefined (reading 'url')"

Probablemente el token de Vercel Blob es inválido o expiró. Generá uno nuevo en https://vercel.com/dashboard/stores.

### "TURSO_AUTH_TOKEN no configurado" o "Could not connect to database"

- Verificá que `TURSO_DATABASE_URL` empiece con `libsql://` (no `https://`).
- Verificá que `TURSO_AUTH_TOKEN` sea un JWT válido (empieza con `eyJ...`).
- Si la URL tiene `?authToken=...` embebido, sacalo y usá la variable separada.

### "El workflow no corre automáticamente"

GitHub Actions deshabilita los schedules en repos públicos después de 60 días de inactividad. Para re-activarlo:
1. Andá a https://github.com/orlandocandia/laspastasdeorlando/actions
2. Click en "Backup Turso Diario"
3. Click en "Enable workflow"
4. Hacé un commit cualquiera en el repo (o ejecutá el workflow manualmente una vez).

### "El backup tarda mucho / timeout"

El workflow tiene un timeout de 15 minutos. Si tu DB es muy grande:
1. Aumentá `timeout-minutes` en `.github/workflows/backup-turso-diario.yml`.
2. Considerá hacer backups semanales en vez de diarios (cambiar cron a `0 6 * * 1`).

### "Se llenó el Blob Storage"

Vercel Blob Storage en el plan Hobby tiene 1 GB gratis. Cada backup comprimido de una DB pequeña es ~30 KB, así que 30 backups = ~1 MB. No debería ser problema.

Si tu DB crece mucho, podés:
- Reducir `BACKUP_RETENTION_COUNT` (ej: `--keep 14`).
- Hacer backups menos frecuentes (ej: cada 2 días).
- Upgradear a Vercel Pro (250 GB incluidos).

### "¿Cómo descargo un backup desde el dashboard de Vercel?"

1. Andá a https://vercel.com/dashboard/stores
2. Click en tu Blob Store
3. Click en "Files"
4. Buscá el archivo `backups/laspastasdeorlando-YYYYMMDD-HHMMSS.sql.gz`
5. Click en el archivo → "Download"

## 🔒 Seguridad

- Los tokens (`TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`) se almacenan como **GitHub Secrets** y nunca aparecen en los logs.
- Los backups en Vercel Blob son **públicamente accesibles por URL** (es la configuración del script). Si tu DB contiene datos sensibles, considerá:
  - Usar `access: 'private'` en `scripts/backup-turso.mjs` (línea `access: 'public'`). Los archivos privados requieren un token para descargar.
  - O encriptar el .sql con GPG antes de subirlo.
- El workflow solo tiene permisos `contents: read` y `issues: write` (no puede modificar código).

## 📦 Estructura de archivos

```
.
├── .github/
│   └── workflows/
│       └── backup-turso-diario.yml    # Workflow de GitHub Actions (cron diario)
├── scripts/
│   ├── backup-turso.mjs               # Script principal (backup, list, download, restore)
│   ├── test-backup-turso.mjs          # Test automatizado
│   └── README-backup-turso.md         # Esta documentación
└── ...
```

## 🧪 Tests

El script incluye un test automatizado que verifica:

- Generación correcta del dump SQL (todas las tablas, índices, triggers).
- Escape correcto de strings (comillas simples y dobles).
- Manejo de NULL y BLOB.
- Re-importabilidad del SQL generado.
- Splitter de statements que respeta BEGIN...END (triggers).

Para correr el test:

```bash
node scripts/test-backup-turso.mjs
```

Salida esperada:

```
🧪 TEST DEL SCRIPT DE BACKUP DE TURSO

1️⃣  Creando DB fuente con datos sintéticos...
  ✅ DB fuente creada con 3 tablas, 1 índice, 1 trigger, 6 filas
...
✅ TODOS LOS TESTS PASARON
```

## ❓ Preguntas frecuentes

### ¿Puedo hacer backup más de una vez al día?

Sí. Cambiá el cron a `'0 */6 * * *'` (cada 6 horas) o `'0 */12 * * *'` (cada 12 horas). El nombre del archivo incluye hora-minutos-segundos, así que no hay colisiones.

### ¿Puedo excluir tablas del backup?

Actualmente no. El script dumpea TODAS las tablas. Si necesitás excluir tablas (ej: logs, sesiones), abrí un issue.

### ¿Qué pasa si Vercel Blob Storage se cae durante el upload?

El script falla, el workflow falla, se crea un Issue automático. Al día siguiente, el próximo run intentará de nuevo. No hay pérdida de datos porque la DB original está intacta.

### ¿Puedo restaurar un backup en una DB nueva de Turso?

Sí:

```bash
# 1. Crear nueva DB en Turso
turso db create mi-db-restauracion

# 2. Obtener URL y token de la nueva DB
turso db show mi-db-restauracion --url
turso db tokens create mi-db-restauracion

# 3. Restaurar el backup más reciente en la nueva DB
DATABASE_URL=libsql://mi-db-restauracion.turso.io \
TURSO_AUTH_TOKEN=eyJ... \
node scripts/backup-turso.mjs restore --to libsql://mi-db-restauracion.turso.io
```

### ¿Los backups funcionan si uso SQLite local en vez de Turso?

Sí. El script funciona con cualquier DB accesible vía `@libsql/client`, incluyendo:
- Turso (libsql://...)
- SQLite local (file:...)
- libSQL server self-hosted

### ¿Cómo veo el contenido de un backup sin restaurarlo?

```bash
# Descargar el backup
node scripts/backup-turso.mjs download

# Descomprimir y ver las primeras 50 líneas
gunzip -c laspastasdeorlando-*.sql.gz | head -50

# Buscar una tabla específica
gunzip -c laspastasdeorlando-*.sql.gz | grep -A 5 "CREATE TABLE \"ProductoTerminado\""

# Contar filas en una tabla
gunzip -c laspastasdeorlando-*.sql.gz | grep "INSERT INTO \"ProductoTerminado\"" | wc -l
```

## 📞 Soporte

Si algo no funciona:

1. Revisá los logs del último run en https://github.com/orlandocandia/laspastasdeorlando/actions
2. Corré el backup localmente con `--verbose` para ver más detalle:
   ```bash
   node scripts/backup-turso.mjs --verbose
   ```
3. Verificá que los 3 secrets estén configurados correctamente.
4. Si el problema persiste, abrí un issue en https://github.com/orlandocandia/laspastasdeorlando/issues
