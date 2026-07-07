# 🆘 Guía de Recuperación del Sistema

**Las Pastas de Orlando** — Procedimiento paso a paso para restaurar el sistema (base de datos + archivos) desde un backup.

> **📖 Documentación relacionada**
> - Backup automático: [`scripts/README-backup-turso.md`](scripts/README-backup-turso.md)
> - Migración de imágenes: [`scripts/README-migracion-imagenes.md`](scripts/README-migracion-imagenes.md)
> - Documentación técnica: [`documentacion-laspastasdeorlando.md`](documentacion-laspastasdeorlando.md)

---

## 📋 Tabla de contenidos

1. [Resumen rápido](#-resumen-rápido)
2. [Tipos de desastre](#-tipos-de-desastre)
3. [Prerrequisitos](#-prerrequisitos-qué-necesés-tener-antes-de-un-desastre)
4. [Escenario A — Restaurar solo la DB de Turso](#-escenario-a--restaurar-solo-la-db-de-turso)
5. [Escenario B — Restaurar el sistema local desde cero](#-escenario-b--restaurar-el-sistema-local-desde-cero)
6. [Escenario C — Restaurar el deploy de Vercel desde cero](#-escenario-c--restaurar-el-deploy-de-vercel-desde-cero)
7. [Escenario D — Recuperación total (todo perdido)](#-escenario-d--recuperación-total-todo-perdido)
8. [Verificación post-restauración](#-verificación-post-restauración)
9. [Comandos por sistema operativo](#-comandos-por-sistema-operativo)
10. [Solución de problemas](#-solución-de-problemas)
11. [Checklist de recuperación](#-checklist-de-recuperación)

---

## ⚡ Resumen rápido

Si el sistema se cayó y necesitás restaurarlo **ya**, sin leer toda la guía:

```bash
# 1. Bajá el código más reciente
git clone https://github.com/orlandocandia/laspastasdeorlando.git
cd laspastasdeorlando

# 2. Instalá dependencias
bun install   # o: npm install --legacy-peer-deps

# 3. Restaurá la DB desde el backup más reciente en Vercel Blob
#    (requiere secrets en .env: TURSO_AUTH_TOKEN y BLOB_READ_WRITE_TOKEN)
node scripts/backup-turso.mjs restore --to file:./prisma/dev.db --verbose

# 4. Restaurá las imágenes de productos
node scripts/migrar-imagenes-a-local.mjs

# 5. Arrancá el sistema
bun run dev
# Abrí http://localhost:3000
```

**Si tenés tiempo, leé el resto de esta guía.** Cada escenario tiene sus particularidades.

---

## 🎯 Tipos de desastre

| Escenario | Qué se perdió | Tiempo estimado de recuperación |
|-----------|---------------|--------------------------------|
| **A** | Solo datos de Turso (borrado accidental, migración fallida) | 5-10 min |
| **B** | Sistema local (PC formateada, disco roto) | 30-45 min |
| **C** | Deploy de Vercel (deploy roto, configuración perdida) | 30-60 min |
| **D** | Todo (Turso + Vercel + imágenes + código) | 1-2 horas |

**Regla de oro:** los backups en Vercel Blob Storage son tu red de seguridad. Siempre verificá que existan antes de empezar a restaurar.

---

## 📦 Prerrequisitos (qué necesitás tener antes de un desastre)

Antes de que ocurra un desastre, asegurate de tener **estos 4 elementos** guardados en un lugar seguro (no en el mismo servidor que el sistema):

### 1. Acceso al repositorio GitHub

- URL: https://github.com/orlandocandia/laspastasdeorlando
- Tu cuenta de GitHub con acceso de escritura
- Un Personal Access Token (PAT) con scope `repo` (por si necesitás clonar desde terminal)

### 2. Credenciales de Turso

- **Database URL**: `libsql://xxxxxx.turso.io`
- **Auth Token**: JWT que empieza con `eyJ...`
- Dónde conseguirlos: https://turso.tech/app → tu database → "Settings"

### 3. Token de Vercel Blob Storage

- **Read & Write Token**: empieza con `vercel_blob_rw_...`
- Dónde conseguirlo: https://vercel.com/dashboard/stores → tu Blob Store → "Tokens"

### 4. Variables de entorno (.env)

Copia de tu archivo `.env` (o `.env.local`) con todas las variables configuradas:

```bash
DATABASE_URL=libsql://xxxxxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
NEXTAUTH_SECRET=tu-clave-secreta
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
# ... (ver .env.example para la lista completa)
```

> **💡 Recomendación:** guardá estos 4 elementos en un gestor de contraseñas (1Password, Bitwarden, KeePass) o en un documento encriptado. **Nunca** los commitees al repo.

---

## 🟢 Escenario A — Restaurar solo la DB de Turso

**Cuándo usarlo:** el sistema funciona, pero los datos de Turso se corrompieron o se borraron accidentalmente. El código y las imágenes están intactos.

### A.1 Listar backups disponibles

```bash
# Linux / Windows (Git Bash / PowerShell)
cd /ruta/al/proyecto
node scripts/backup-turso.mjs list
```

Salida esperada:

```
📋 Listando backups en Vercel Blob Storage...

  Total: 7 backup(s)
  ─────────────────────────────────────────────────────────────────────
  #  | Fecha             | Tamaño    | Archivo
  ─────────────────────────────────────────────────────────────────────
   1 | 2026-01-15 06:00:12 |  28.3 KB | laspastasdeorlando-20260115-060012.sql.gz
   2 | 2026-01-14 06:00:08 |  28.1 KB | laspastasdeorlando-20260114-060008.sql.gz
   ...
```

Anotá la fecha del backup que vas a restaurar (formato `YYYYMMDD`).

### A.2 Restaurar en la DB de Turso (misma DB)

> **⚠️ ADVERTENCIA:** esto **sobrescribe** todos los datos actuales de la DB de Turso. Si hay datos nuevos desde el último backup, se van a perder.

```bash
# Setear variables de entorno (en .env o exportadas en la shell)
export DATABASE_URL="libsql://xxxxxx.turso.io"
export TURSO_AUTH_TOKEN="eyJ..."
export BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Restaurar el backup más reciente
node scripts/backup-turso.mjs restore --to "$DATABASE_URL" --verbose

# O restaurar un backup específico por fecha
node scripts/backup-turso.mjs restore --to "$DATABASE_URL" --date 20260115 --verbose
```

**Windows (PowerShell):**

```powershell
$env:DATABASE_URL = "libsql://xxxxxx.turso.io"
$env:TURSO_AUTH_TOKEN = "eyJ..."
$env:BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_..."

node scripts/backup-turso.mjs restore --to $env:DATABASE_URL --verbose
```

### A.3 Restaurar en una DB de Turso NUEVA (recomendado)

Más seguro: crear una DB nueva, restaurar ahí, y luego repuntar la app a la nueva DB.

```bash
# 1. Crear nueva DB en Turso (requiere turso CLI)
turso db create laspastasdeorlando-restaurada

# 2. Obtener URL y token de la nueva DB
turso db show laspastasdeorlando-restaurada --url
turso db tokens create laspastasdeorlando-restaurada

# 3. Restaurar el backup más reciente en la nueva DB
node scripts/backup-turso.mjs restore --to "libsql://laspastasdeorlando-restaurada-xxxxxx.turso.io" --verbose

# 4. Actualizar DATABASE_URL en .env (o en Vercel) para apuntar a la nueva DB
# 5. Reiniciar la app
```

### A.4 Restaurar en SQLite local (para testing)

```bash
# El archivo ./prisma/dev.db se va a sobrescribir
node scripts/backup-turso.mjs restore --to file:./prisma/dev.db --verbose
```

---

## 🟡 Escenario B — Restaurar el sistema local desde cero

**Cuándo usarlo:** tu PC se formateó, el disco se rompió, o querés instalar el sistema en una PC nueva. El deploy de Vercel y la DB de Turso siguen funcionando.

### B.1 Instalar prerrequisitos

**Linux (Fedora):**

```bash
# Node.js 20+
sudo dnf install -y nodejs
node --version  # debe ser >= 20

# Bun (gestor de paquetes)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version

# Git
sudo dnf install -y git
git --version
```

**Windows:**

```powershell
# Instalar Node.js 20+ desde https://nodejs.org
node --version  # debe ser >= 20

# Instalar Bun
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version

# Instalar Git desde https://git-scm.com
git --version
```

### B.2 Clonar el repositorio

```bash
# Linux / Windows
cd ~/Descargas  # o el directorio que prefieras
git clone https://github.com/orlandocandia/laspastasdeorlando.git
cd laspastasdeorlando
```

### B.3 Instalar dependencias

```bash
# Opción 1: Bun (recomendado, más rápido)
bun install

# Opción 2: npm (si no tenés Bun)
npm install --legacy-peer-deps
```

### B.4 Configurar variables de entorno

```bash
# Copiar template
cp .env.example .env

# Editar .env con tus credenciales reales
nano .env  # Linux
# o en Windows: notepad .env
```

Variables mínimas a configurar:

```bash
DATABASE_URL=libsql://xxxxxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
NEXTAUTH_SECRET=generar-con-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generar NEXTAUTH_SECRET:

```bash
# Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### B.5 Restaurar la DB local desde un backup

Si querés trabajar con una copia local de los datos (modo offline):

```bash
# Restaurar el backup más reciente a SQLite local
node scripts/backup-turso.mjs restore --to file:./prisma/dev.db --verbose

# Cambiar DATABASE_URL en .env para apuntar al SQLite local
# DATABASE_URL=file:./prisma/dev.db
```

### B.6 Restaurar las imágenes de productos

```bash
# Migrar URLs externas a rutas locales y descargar imágenes
node scripts/migrar-imagenes-a-local.mjs --verbose
```

Ver [`scripts/README-migracion-imagenes.md`](scripts/README-migracion-imagenes.md) para más detalle.

### B.7 Generar cliente Prisma y arrancar

```bash
# Generar Prisma Client
bun run db:generate

# Crear tablas faltantes (si es DB nueva)
bun run db:push

# Arrancar en modo desarrollo
bun run dev
```

Abrir http://localhost:3000 en el navegador.

---

## 🟠 Escenario C — Restaurar el deploy de Vercel desde cero

**Cuándo usarlo:** el deploy de Vercel se rompió, se borró el proyecto, o la configuración se perdió. La DB de Turso y los backups siguen intactos.

### C.1 Verificar acceso a GitHub

1. Andá a https://github.com/orlandocandia/laspastasdeorlando
2. Verificá que el repo existe y tenés acceso de escritura.
3. Si el repo se borró, ver [Escenario D](#-escenario-d--recuperación-total-todo-perdido).

### C.2 Reconectar Vercel con GitHub

1. Andá a https://vercel.com/dashboard
2. Click en **"Add New..."** → **"Project"**
3. Click en **"Import Git Repository"**
4. Buscá `orlandocandia/laspastasdeorlando` y click en **"Import"**
5. Framework Preset: **Next.js** (se autodetecta)
6. Root Directory: `./` (default)
7. Build Command: `next build` (se autodetecta)
8. Install Command: `npm install --legacy-peer-deps` (importante: el `--legacy-peer-deps`)

### C.3 Configurar variables de entorno en Vercel

En la misma pantalla de import, expandir **"Environment Variables"** y agregar:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | `libsql://xxxxxx.turso.io` | Production, Preview, Development |
| `TURSO_AUTH_TOKEN` | `eyJ...` | Production, Preview, Development |
| `DATABASE_AUTH_TOKEN` | `eyJ...` (mismo que TURSO_AUTH_TOKEN) | Production, Preview, Development |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_...` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | (generar con `openssl rand -base64 32`) | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://tu-deploy.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://tu-deploy.vercel.app` | Production |
| `SMTP_HOST` | `smtp.gmail.com` | Production |
| `SMTP_PORT` | `587` | Production |
| `SMTP_USER` | `tu-email@gmail.com` | Production |
| `SMTP_PASS` | `tu-app-password` | Production |
| `SMTP_SECURE` | `false` | Production |
| `SMTP_FROM` | `"Pastas Orlando <tu-email@gmail.com>"` | Production |
| `ADMIN_EMAIL` | `tu-email@gmail.com` | Production |
| `ADMIN_WHATSAPP` | `543754419324` | Production |

> **💡 Tip:** si ya tenés configurado el Blob Store en Vercel, podés linkearlo desde "Storage" en lugar de poner el token manualmente.

### C.4 Deploy

1. Click en **"Deploy"**
2. Esperar 2-5 minutos a que termine el build.
3. Si falla, ver [Solución de problemas](#-solución-de-problemas).

### C.5 Verificar

1. Abrir la URL del deploy (ej: `https://laspastasdeorlando.vercel.app`)
2. Verificar que la landing carga con productos.
3. Verificar que el login de admin funciona: `/admin/login`
4. Ver [Verificación post-restauración](#-verificación-post-restauración).

### C.6 Restaurar las imágenes a Vercel Blob Storage (si se perdieron)

Si las imágenes en Vercel Blob Storage se borraron, pero tenés las URLs en la DB de Turso:

```bash
# Desde una PC con el repo clonado y configurado
# Esto descarga las imágenes desde donde apunten las URLs en la DB
# y las sube a Vercel Blob Storage automáticamente (modo online)
# Ver scripts/README-migracion-imagenes.md
```

---

## 🔴 Escenario D — Recuperación total (todo perdido)

**Cuándo usarlo:** se perdió todo — Turso, Vercel, imágenes, y posiblemente el repo GitHub. El único recurso son los backups en Vercel Blob Storage.

> **🚨 Esto es lo peor que puede pasar. Tomate 30 minutos para leer esta sección completa antes de empezar.**

### D.1 Verificar qué tenés

Antes de empezar, verificá:

- [ ] ¿El repo GitHub existe? → https://github.com/orlandocandia/laspastasdeorlando
- [ ] ¿Tenés acceso a la cuenta de Vercel? → https://vercel.com/dashboard
- [ ] ¿Tenés acceso a la cuenta de Turso? → https://turso.tech/app
- [ ] ¿Tenés el token de Vercel Blob Storage? (sin esto no podés descargar los backups)
- [ ] ¿Tenés las credenciales guardadas en algún lugar seguro?

Si respondiste **NO** a "token de Vercel Blob Storage", los backups **no se pueden descargar** y los datos están perdidos. Contactá a soporte de Vercel inmediatamente.

### D.2 Restaurar el repositorio GitHub (si se borró)

Si el repo GitHub se borró pero tenés una copia local:

```bash
# Crear repo nuevo en GitHub
# Andá a https://github.com/new
# Nombre: laspastasdeorlando
# Privado
# NO inicializar con README

# Desde tu copia local
cd /ruta/a/tu/copia/local
git remote set-url origin https://github.com/orlandocandia/laspastasdeorlando.git
git push -u origin main
```

Si no tenés copia local, **no hay forma de recuperar el código** salvo que tengas un fork o un clone en otra PC.

### D.3 Restaurar la DB de Turso (si se borró)

```bash
# 1. Crear nueva DB en Turso (vía CLI o dashboard)
turso db create laspastasdeorlando
turso db show laspastasdeorlando --url
turso db tokens create laspastasdeorlando

# 2. Desde el repo (ya clonado)
cd laspastasdeorlando
bun install

# 3. Configurar .env con la nueva URL y token de Turso
#    más el BLOB_READ_WRITE_TOKEN para descargar el backup

# 4. Restaurar el backup más reciente en la nueva DB
node scripts/backup-turso.mjs restore \
  --to "libsql://laspastasdeorlando-xxxxxx.turso.io" \
  --verbose

# 5. Verificar que los datos se restauraron
node -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const r = await db.execute('SELECT COUNT(*) as n FROM ProductoTerminado');
console.log('Productos restaurados:', r.rows[0].n);
"
```

### D.4 Restaurar el deploy de Vercel

Seguir los pasos del [Escenario C](#-escenario-c--restaurar-el-deploy-de-vercel-desde-cero).

### D.5 Restaurar las imágenes

Las imágenes están en 3 lugares posibles:

1. **Vercel Blob Storage** (si no se borró) — ya están accesibles vía las URLs en la DB.
2. **Carpeta `public/images/` del repo** — las imágenes base (logo, hero, familias) están commiteadas en el repo.
3. **Backups locales** — si hiciste backups manuales de la carpeta `public/images/uploads/`.

Si Vercel Blob Storage se borró pero tenés las imágenes localmente:

```bash
# Subir imágenes locales a Vercel Blob Storage
# (requiere script personalizado, o subirlas manualmente desde el dashboard)
```

Si no tenés las imágenes en ningún lado, vas a tener que subirlas manualmente desde el panel admin del sistema, producto por producto.

### D.6 Verificación final

Ejecutar el [checklist de recuperación](#-checklist-de-recuperación) completo.

---

## ✅ Verificación post-restauración

Después de cualquier escenario de recuperación, ejecutar estas verificaciones:

### 1. Verificar que la app arranca

```bash
bun run dev
# Abrir http://localhost:3000
```

La landing page debe cargar con:
- [ ] Logo de Pastas Orlando visible
- [ ] Sección "Nuestras Pastas" con productos (con imágenes)
- [ ] Sección "Nuestras Categorías" con familias
- [ ] Footer con datos de contacto

### 2. Verificar login de admin

1. Andá a http://localhost:3000/admin/login
2. Ingresá con tu email y contraseña de admin
3. Verificá que el dashboard carga con:
   - [ ] Sidebar con todas las secciones (Productos, Ventas, Compras, etc.)
   - [ ] Indicadores de stock en el dashboard principal
   - [ ] Notificaciones recientes

### 3. Verificar datos críticos

```bash
# Contar registros en tablas críticas
node -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const tables = ['ProductoTerminado', 'Usuario', 'Venta', 'PedidoCliente', 'MateriaPrima', 'Insumo'];
for (const t of tables) {
  try {
    const r = await db.execute('SELECT COUNT(*) as n FROM ' + t);
    console.log(t + ': ' + r.rows[0].n + ' registros');
  } catch (e) {
    console.log(t + ': ERROR - ' + e.message.split('\n')[0]);
  }
}
"
```

Salida esperada (los números exactos dependen de tu DB):

```
ProductoTerminado: 87 registros
Usuario: 3 registros
Venta: 156 registros
PedidoCliente: 42 registros
MateriaPrima: 27 registros
Insumo: 12 registros
```

### 4. Verificar imágenes

```bash
# Verificar que las URLs de imágenes en la DB apuntan a rutas válidas
node -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const r = await db.execute('SELECT id, nombre, imagen FROM ProductoTerminado WHERE imagen IS NOT NULL LIMIT 5');
for (const row of r.rows) {
  console.log('#' + row.id + ' ' + row.nombre + ': ' + row.imagen);
}
"
```

Las URLs deben empezar con:
- `/images/...` — imagen local (servida por Next.js)
- `https://xxxx.public.blob.vercel-storage.com/...` — imagen en Vercel Blob

Si ves URLs que empiezan con `https://laspastasdeorlando.vercel.app/...`, ejecutá:

```bash
node scripts/migrar-imagenes-a-local.mjs --verbose
```

### 5. Verificar que un backup nuevo funciona

```bash
# Hacer un backup de prueba (en modo dry-run para no subir nada)
node scripts/backup-turso.mjs --dry-run --verbose
```

Debe mostrar:

```
✅ Dump generado: XXX KB en X.Xs (XXX filas)
[DRY-RUN] No se sube ni elimina nada.
```

---

## 💻 Comandos por sistema operativo

### Linux (Fedora / Ubuntu / Debian)

#### Instalar Node.js 20+

```bash
# Fedora
sudo dnf install -y nodejs
node --version  # v20.x.x o mayor

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Instalar Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

#### Instalar Git

```bash
# Fedora
sudo dnf install -y git

# Ubuntu/Debian
sudo apt-get install -y git
```

#### Instalar sqlite3 CLI (opcional, para restore manual)

```bash
# Fedora
sudo dnf install -y sqlite

# Ubuntu/Debian
sudo apt-get install -y sqlite3
```

#### Instalar turso CLI (para gestión de DBs Turso)

```bash
curl -sSfL https://get.tur.so/install.sh | bash
source ~/.bashrc
turso version
```

### Windows

#### Instalar Node.js 20+

1. Descargar instalador desde https://nodejs.org (versión LTS 20+)
2. Ejecutar el `.msi` con opciones por defecto
3. Verificar:

```powershell
node --version  # v20.x.x o mayor
npm --version
```

#### Instalar Bun

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
```

#### Instalar Git

1. Descargar desde https://git-scm.com/download/win
2. Ejecutar el instalador con opciones por defecto
3. Verificar:

```powershell
git --version
```

#### Instalar sqlite3 CLI (opcional)

1. Descargar desde https://www.sqlite.org/download.html → "sqlite-tools-win32-x64-XXXX.zip"
2. Descomprimir en `C:\sqlite3`
3. Agregar `C:\sqlite3` al PATH:
   - Settings → System → About → Advanced system settings → Environment Variables
   - En "Path" → Edit → New → `C:\sqlite3` → OK

#### Comandos equivalentes Linux → Windows

| Linux | Windows (PowerShell) | Windows (CMD) |
|-------|---------------------|---------------|
| `ls` | `dir` | `dir` |
| `cat file` | `Get-Content file` | `type file` |
| `cp src dst` | `Copy-Item src dst` | `copy src dst` |
| `mv src dst` | `Move-Item src dst` | `move src dst` |
| `rm file` | `Remove-Item file` | `del file` |
| `rm -rf dir` | `Remove-Item -Recurse -Force dir` | `rmdir /s /q dir` |
| `mkdir -p path` | `New-Item -ItemType Directory -Force -Path path` | `mkdir path` |
| `cd path` | `cd path` | `cd path` |
| `pwd` | `pwd` / `Get-Location` | `cd` (sin args) |
| `export VAR=value` | `$env:VAR = "value"` | `set VAR=value` |
| `echo $VAR` | `$env:VAR` | `echo %VAR%` |
| `which cmd` | `Get-Command cmd` | `where cmd` |
| `chmod +x file` | (no necesario) | (no necesario) |

---

## 🛟 Solución de problemas

### "Cannot find module '@libsql/client'"

Falta instalar dependencias:

```bash
bun install
# o
npm install --legacy-peer-deps
```

### "BLOB_READ_WRITE_TOKEN no configurado"

Falta el token de Vercel Blob Storage. Ver [Prerrequisitos](#-prerrequisitos-qué-necesés-tener-antes-de-un-desastre).

### "Could not connect to database" / "authentication failed"

- Verificá que `DATABASE_URL` empiece con `libsql://` (no `https://`).
- Verificá que `TURSO_AUTH_TOKEN` sea un JWT válido (empieza con `eyJ`).
- Si la URL tiene `?authToken=...` embebido, sacalo y usá la variable separada.
- Probá la conexión directa con `turso db shell <tu-db>`.

### "No hay backups para descargar"

```bash
node scripts/backup-turso.mjs list
```

Si devuelve "no hay backups", significa que nunca se ejecutó el backup automático, o que Vercel Blob Storage está vacío. Verificá:

1. Que el workflow de GitHub Actions esté activo: https://github.com/orlandocandia/laspastasdeorlando/actions
2. Que los secrets `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN` estén configurados.
3. Hacé un backup manual: `node scripts/backup-turso.mjs --verbose`

### "El restore falla con 'syntax error' en una línea"

El backup puede tener un caracter especial que el splitter no maneja. Workaround:

```bash
# 1. Descargar el backup manualmente
node scripts/backup-turso.mjs download --date YYYYMMDD

# 2. Descomprimir
gunzip laspastasdeorlando-YYYYMMDD-HHMMSS.sql.gz

# 3. Aplicar con sqlite3 CLI (si es SQLite local)
sqlite3 ./prisma/dev.db < laspastasdeorlando-YYYYMMDD-HHMMSS.sql

# 4. O aplicar a Turso con el CLI de Turso
turso db shell <tu-db-name> < laspastasdeorlando-YYYYMMDD-HHMMSS.sql
```

### "Las imágenes no se ven después de restaurar"

```bash
# Ejecutar el script de migración de imágenes
node scripts/migrar-imagenes-a-local.mjs --verbose
```

Ver [`scripts/README-migracion-imagenes.md`](scripts/README-migracion-imagenes.md).

### "El deploy de Vercel falla con 'out of memory'"

El build de Vercel puede quedarse sin memoria si hay demasiadas API routes. Soluciones:

1. Verificar que `next.config.ts` **NO** tenga `output: 'standalone'` (debe ser condicional con `BUILD_STANDALONE=1`).
2. Si el problema persiste, hacer un deploy desde cero (Escenario C).

### "Perdí el NEXTAUTH_SECRET y nadie puede loguearse"

El `NEXTAUTH_SECRET` se usa para firmar las sesiones. Si se pierde, todas las sesiones existentes se invalidan, pero los usuarios siguen existiendo en la DB.

Solución:

1. Generar un nuevo secret: `openssl rand -base64 32`
2. Actualizarlo en `.env` (local) o en Vercel → Settings → Environment Variables.
3. Reiniciar la app.
4. Los usuarios van a tener que loguearse de nuevo (las sesiones viejas expiraron).
5. Los passwords **NO** se pierden (están hasheados en la DB, no firmados con NEXTAUTH_SECRET).

### "Perdí el 2FA / no puedo acceder a mi cuenta de admin"

Si tenés 2FA habilitado y perdiste el acceso al authenticador:

```bash
# Desde la DB, deshabilitar 2FA para tu usuario
node -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
await db.execute('UPDATE Usuario2FA SET activo = 0 WHERE id_usuario = (SELECT id FROM Usuario WHERE email = \"tu-email@pastasorlando.com\")');
console.log('2FA deshabilitado');
"
```

Después volvé a configurar 2FA desde el panel admin.

---

## 📝 Checklist de recuperación

Usá este checklist después de cualquier recuperación para asegurar que todo funciona:

### Datos

- [ ] La app arranca sin errores (`bun run dev`)
- [ ] La landing page carga con productos e imágenes
- [ ] El login de admin funciona
- [ ] El dashboard muestra datos (no está vacío)
- [ ] Se pueden crear ventas/pedidos nuevos
- [ ] Se pueden ver ventas/pedidos históricos
- [ ] Los productos tienen sus imágenes cargadas
- [ ] Las categorías y familias están completas

### Sistema

- [ ] El backup automático diario está activo (verificar en GitHub Actions)
- [ ] Los secrets de GitHub están configurados (TURSO_*, BLOB_*)
- [ ] El workflow de backup corrió al menos una vez con éxito
- [ ] Hay al menos 1 backup en Vercel Blob Storage (`node scripts/backup-turso.mjs list`)
- [ ] Las variables de entorno están configuradas en Vercel (si aplica)
- [ ] El dominio custom funciona (si aplica)

### Seguridad

- [ ] NEXTAUTH_SECRET está configurado y es único
- [ ] Las contraseñas de admin son fuertes
- [ ] 2FA está habilitado para cuentas admin
- [ ] Los tokens (Turso, Vercel Blob) NO están commiteados al repo
- [ ] `.env` está en `.gitignore`

### Documentación

- [ ] Este archivo `RECUPERACION.md` está accesible
- [ ] Las credenciales actualizadas están guardadas en un lugar seguro (gestor de contraseñas)
- [ ] Al menos una persona más conoce el procedimiento de recuperación

---

## 📞 Contacto de emergencia

Si nada de esto funciona y necesitás ayuda urgente:

1. **Revisá los logs del último run de backup:** https://github.com/orlandocandia/laspastasdeorlando/actions
2. **Revisá el estado de Turso:** https://turso.tech/app → tu database → "Health"
3. **Revisá el estado de Vercel:** https://vercel.com/dashboard → tu proyecto → "Deployments"
4. **Abrí un issue:** https://github.com/orlandocandia/laspastasdeorlando/issues/new
5. **Contactá al desarrollador:** Orlando Candia — orlando.candia@gmail.com

---

## 📅 Historial de revisiones

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-07 | 1.0 | Versión inicial. Cubre escenarios A, B, C, D. |

---

> **🍝 Pastas Orlando © 2026** — Este documento es la red de seguridad del negocio. Mantenelo actualizado y asegurate de que al menos 2 personas sepan dónde encontrarlo.
