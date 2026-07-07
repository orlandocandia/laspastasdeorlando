# 🍝 Migrar Imágenes Externas a Rutas Locales

Script de migración para corregir URLs de imágenes en la base de datos local de **Las Pastas de Orlando**.

## 📋 Problema que resuelve

El sistema local funciona, pero las imágenes de productos no se cargan porque las URLs en la base de datos apuntan a fuentes externas:

- `https://laspastasdeorlando.vercel.app/images/uploads/...` → El deploy de Vercel fue dado de baja (404).
- `https://xxxx.public.blob.vercel-storage.com/...` → Vercel Blob Storage que ya no es accesible sin token.
- Cualquier otra URL externa que el sistema local no puede cargar.

## ✅ Solución

Este script:

1. **Hace backup** automático de la DB local antes de modificar nada.
2. **Escanea todas las tablas** con campos de imagen (ProductoTerminado, Producto, CategoriaProductoTerminado, MateriaPrima, Insumo, Usuario, Persona).
3. **Convierte URLs externas a rutas locales**:
   - `https://laspastasdeorlando.vercel.app/images/foo.png` → `/images/foo.png`
   - `https://xxxx.blob.vercel-storage.com/foo.png` → descarga y guarda en `/images/productos/.../foo.png`
   - Cualquier otra URL externa → intenta descargarla y guardarla localmente.
4. **Si `BLOB_READ_WRITE_TOKEN` está configurado**: lista y descarga TODOS los blobs de Vercel Blob Storage (incluso los huérfanos que ya no están referenciados en la DB).
5. **Modo `--dry-run`**: muestra qué haría sin tocar nada.

## 🚀 Uso

### Paso 1: Pre-requisitos

Asegurate de estar en la raíz del proyecto y tener las dependencias instaladas:

```bash
cd ~/Descargas/laspastasdeorlando
bun install   # o: npm install --legacy-peer-deps
```

### Paso 2: Preview (recomendado)

Ejecutá primero en modo `--dry-run` para ver qué haría el script sin modificar nada:

```bash
node scripts/migrar-imagenes-a-local.mjs --dry-run
```

### Paso 3: Migración real

Si el preview te parece bien, ejecutá la migración real:

```bash
node scripts/migrar-imagenes-a-local.mjs
```

El script va a:
- Crear un backup automático en `prisma/dev.db.backup-YYYYMMDD-HHMMSS`.
- Descargar las imágenes que pueda de las URLs externas.
- Guardar las imágenes en `public/images/productos/<subdir>/`.
- Actualizar la DB para usar rutas `/images/...`.

### Paso 4: Reiniciar el servidor

```bash
# Si estás corriendo el sistema local:
./laspastasdeorlando-local/scripts/start-linux.sh
# o en Windows:
# .\laspastasdeorlando-local\scripts\start-windows.bat
```

Las imágenes deberían cargarse correctamente.

## 📦 Descarga masiva desde Vercel Blob Storage

Si tenés el token de Vercel Blob Storage (`BLOB_READ_WRITE_TOKEN`), podés descargar TODOS los blobs (incluso los huérfanos que ya no están en la DB):

```bash
# 1. Obtené el token de: https://vercel.com/dashboard/stores
# 2. Ejecutá el script con el token:

BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx" node scripts/migrar-imagenes-a-local.mjs
```

O para descargar SOLO los blobs sin tocar la DB:

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx" node scripts/migrar-imagenes-a-local.mjs --blob-only
```

Los blobs se guardan en `public/images/uploads/<subdir>/` respetando la estructura original.

## 🎛️ Opciones

| Flag | Descripción |
|------|-------------|
| `--dry-run` | Solo muestra qué haría, no modifica nada. |
| `--no-download` | Solo corrige las rutas de las URLs (convierte `https://...vercel.app/...` → `/...`), no descarga imágenes nuevas. |
| `--verbose` / `-v` | Log detallado con cada URL procesada. |
| `--blob-only` | Solo descarga blobs de Vercel (requiere `BLOB_READ_WRITE_TOKEN`). |
| `--force` | Para DBs remotas (Turso): confirma que ya hiciste backup. |
| `--db <path>` | Override explícito de la ruta a la DB. Tiene prioridad sobre `.env` y `DATABASE_URL`. Ejemplo: `--db file:./prisma/dev.db` o `--db libsql://mi-db.turso.io` |

## 🔧 Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./prisma/dev.db` | URL de la DB. `file:` para SQLite local, `libsql://` para Turso. |
| `TURSO_AUTH_TOKEN` | (vacío) | Token de Turso si `DATABASE_URL` es `libsql://`. |
| `DATABASE_AUTH_TOKEN` | (vacío) | Alternativa a `TURSO_AUTH_TOKEN`. |
| `BLOB_READ_WRITE_TOKEN` | (vacío) | Token de Vercel Blob Storage para descarga masiva. |

## 📂 Estructura de carpetas después de la migración

```
public/
├── images/
│   ├── productos/              ← imágenes descargadas desde URLs externas
│   │   ├── productos-terminados/
│   │   │   ├── 1-sorrentinos-de-verdura.png
│   │   │   ├── 2-ravioles-de-espinaca.jpg
│   │   │   └── ...
│   │   ├── productos/
│   │   ├── categorias/
│   │   ├── materias-primas/
│   │   ├── insumos/
│   │   ├── usuarios/
│   │   └── personas/
│   └── uploads/                ← blobs descargados de Vercel Blob Storage
│       ├── productos-terminados/
│       │   └── abc-123.png
│       └── ...
└── ...
```

## 🗃️ Tablas procesadas

| Tabla | Columnas de imagen |
|-------|-------------------|
| `ProductoTerminado` | `imagen` |
| `Producto` | `imagen` |
| `CategoriaProductoTerminado` | `imagen`, `imagen_integral`, `imagen_sin_gluten` |
| `MateriaPrima` | `imagen` |
| `Insumo` | `imagen` |
| `Usuario` | `imagen` |
| `Persona` | `imagen` |

## 🛟 Solución de problemas

### "No se pudo conectar a la DB"

- Verificá que `prisma/dev.db` exista: `ls -la prisma/dev.db`.
- Si usas Turso, verificá que `DATABASE_URL` empiece con `libsql://` y que `TURSO_AUTH_TOKEN` esté configurado.

### "El archivo DB no encontrado"

El script busca `prisma/dev.db` por defecto. Si tu DB está en otra ubicación, seteá `DATABASE_URL`:

```bash
DATABASE_URL="file:/ruta/a/tu/db.db" node scripts/migrar-imagenes-a-local.mjs
```

### "Falló descarga: HTTP 404"

La URL externa ya no existe (el deploy de Vercel fue dado de baja). El script va a:
- Convertir la URL de todos modos (de `https://...vercel.app/foo` → `/foo`) para que cuando subas una imagen nueva, la ruta ya esté correcta.
- Reportar las descargas fallidas al final.

Para esos productos, vas a tener que subir las imágenes manualmente desde el panel de administración del sistema.

### "BLOB_READ_WRITE_TOKEN no está configurado"

Si querés descargar TODOS los blobs de Vercel Blob Storage (incluyendo los huérfanos), necesitás el token. Obtenelo en: https://vercel.com/dashboard/stores

Si no tenés acceso al token, el script igualmente va a:
- Migrar las URLs de la DB que apuntan a Vercel (intentando descargar cada una).
- Dejar las URLs que no se puedan descargar tal como están.

### "¿Cómo recupero las imágenes que no se pudieron descargar?"

Si las imágenes ya no existen en ningún lado (Vercel dado de baja, Blob Store inaccesible), vas a tener que subir las fotos manualmente:

1. Entrá al panel de administración del sistema local.
2. Para cada producto sin imagen, subí la foto correspondiente.
3. El sistema va a guardar la imagen en `public/images/uploads/productos-terminados/` y actualizar la DB con la ruta local.

## 📝 Notas

- **Siempre hace backup** antes de modificar la DB local. Si algo sale mal, podés restaurar el backup.
- **Es idempotente**: podés ejecutarlo las veces que quieras. Si una URL ya fue migrada a ruta local, no la vuelve a tocar.
- **Respeta los datos existentes**: no elimina filas, no toca otros campos, solo actualiza las columnas de imagen.
- **No modifica archivos locales existentes**: si una imagen ya está en `public/`, no la sobreescribe.

## 🧪 Tests

El script incluye tests automatizados:

```bash
# Test de migración de URLs (sin descarga real):
node scripts/test-migracion-imagenes.mjs

# Test de descarga real de imágenes:
node scripts/test-migracion-download.mjs
```

Ambos tests crean DBs temporales, ejecutan el script, y verifican que todo funcione correctamente.
