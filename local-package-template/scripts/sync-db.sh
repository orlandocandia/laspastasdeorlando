#!/bin/bash
# sync-db.sh — Sincronización bidireccional entre SQLite local y Turso (nube)
#
# Uso:
#   ./scripts/sync-db.sh push          # Local → Turso (sobrescribe la nube)
#   ./scripts/sync-db.sh pull          # Turso → Local (sobrescribe el local, pide confirmación)
#   ./scripts/sync-db.sh pull --yes    # Turso → Local sin pedir confirmación
#   ./scripts/sync-db.sh --help        # Mostrar esta ayuda
#
# Requiere:
#   - Node.js instalado
#   - dev.db en la raíz del paquete
#   - .env en modo ONLINE (DATABASE_URL=libsql://... o http://...)
#     Ejecutá ./switch-mode.sh online primero si no lo está.
#
# Antes de sobrescribir (push o pull) se crea un backup automático en data/.
# El backup NO se borra aunque la sincronización falle, por seguridad.
#
# Make executable: chmod +x scripts/sync-db.sh

# ---------------------------------------------------------------------------
# Resolver rutas relativas a la ubicación del script
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PKG_DIR" || { echo "❌ No se pudo acceder a $PKG_DIR"; exit 1; }

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
print_banner() {
    echo "============================================"
    echo "  🔄 Sincronización bidireccional Local ↔ Turso"
    echo "============================================"
    echo
}

print_help() {
    print_banner
    cat << 'HELP'
Uso:
  ./scripts/sync-db.sh push          # Local → Turso (sobrescribe la nube)
  ./scripts/sync-db.sh pull          # Turso → Local (sobrescribe el local, pide confirmación)
  ./scripts/sync-db.sh pull --yes    # Turso → Local sin pedir confirmación
  ./scripts/sync-db.sh --help        # Mostrar esta ayuda

Requisitos previos:
  - Estar en modo ONLINE (.env con DATABASE_URL=libsql://... o http://...)
    Ejecutá ./switch-mode.sh online primero.
  - Que dev.db exista en la raíz del paquete.
  - Node.js instalado.

Notas:
  - Antes de sincronizar se hace un backup automático de dev.db en data/.
  - El backup NO se borra aunque la sincronización falle.
  - En pull, los datos locales se sobrescriben completamente (DELETE + INSERT).
  - Las tablas internas (sqlite_%, _prisma_%, __drizzle_%) se ignoran.
HELP
    echo
}

# ---------------------------------------------------------------------------
# Ayuda si se pide explícitamente
# ---------------------------------------------------------------------------
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    print_help
    exit 0
fi

# ---------------------------------------------------------------------------
# Leer dirección (push | pull)
# ---------------------------------------------------------------------------
DIRECTION="$1"

if [ -z "$DIRECTION" ]; then
    echo "❌ ERROR: Falta indicar la dirección (push o pull)."
    echo
    print_help
    exit 1
fi

if [ "$DIRECTION" != "push" ] && [ "$DIRECTION" != "pull" ]; then
    echo "❌ ERROR: Dirección inválida \"$DIRECTION\". Usá \"push\" o \"pull\"."
    echo
    print_help
    exit 1
fi

SKIP_CONFIRM="$2"

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
print_banner
echo "  Dirección: $DIRECTION"
if [ "$DIRECTION" = "push" ]; then
    echo "  (Local SQLite → Turso, sobrescribe la nube)"
else
    echo "  (Turso → Local SQLite, sobrescribe el local)"
fi
echo

# ---------------------------------------------------------------------------
# Paso 1: Verificar que Node.js esté disponible
# ---------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
    echo "  ❌ ERROR: Node.js no está instalado."
    echo "  Instalá Node.js y volvé a intentarlo."
    exit 1
fi
echo "  ✅ Paso 1: Node.js detectado ($(node --version))"
echo

# ---------------------------------------------------------------------------
# Paso 2: Verificar que dev.db exista
# ---------------------------------------------------------------------------
if [ ! -f "dev.db" ]; then
    echo "  ❌ ERROR: No se encontró dev.db en $PKG_DIR"
    echo "  La base de datos local no existe. Ejecutá el sistema al menos una vez en modo local."
    exit 1
fi
echo "  ✅ Paso 2: Base de datos local encontrada (dev.db)"
echo

# ---------------------------------------------------------------------------
# Paso 3: Verificar que .env exista y esté en modo ONLINE
# ---------------------------------------------------------------------------
if [ ! -f ".env" ]; then
    echo "  ❌ ERROR: No se encontró .env"
    echo "  Ejecutá ./switch-mode.sh online primero."
    exit 1
fi

if ! grep -q "^DATABASE_URL=libsql://" .env && ! grep -q "^DATABASE_URL=http" .env; then
    echo "  ❌ ERROR: .env no está en modo ONLINE."
    echo "  DATABASE_URL debe empezar con libsql:// o http:// para sincronizar."
    echo "  Ejecutá ./switch-mode.sh online primero."
    exit 1
fi
echo "  ✅ Paso 3: .env en modo ONLINE (Turso)"
echo

# ---------------------------------------------------------------------------
# Paso 4: Si es pull, confirmar antes de sobrescribir datos locales
# ---------------------------------------------------------------------------
if [ "$DIRECTION" = "pull" ]; then
    if [ "$SKIP_CONFIRM" != "--yes" ] && [ "$SKIP_CONFIRM" != "-y" ]; then
        echo "  ⚠️  ADVERTENCIA: pull va a SOBREESCRIBIR tu dev.db local"
        echo "  con los datos que estén en Turso. Los datos locales actuales"
        echo "  se van a borrar (antes se hace un backup automático)."
        echo
        # Si no hay TTY (stdin cerrado o redirigido), no podemos pedir confirmación
        if [ ! -t 0 ]; then
            echo "  ❌ ERROR: no se detectó terminal interactiva para confirmar."
            echo "     Usá: ./scripts/sync-db.sh pull --yes   (para omitir confirmación)"
            exit 1
        fi
        printf "  ¿Confirmás que querés sobrescribir el local con Turso? (escribí 'si' para confirmar): "
        read -r CONFIRM
        echo
        if [ "$CONFIRM" != "si" ]; then
            echo "  ⏭️  Operación cancelada por el usuario."
            exit 0
        fi
        echo "  ✅ Confirmación recibida. Continuando..."
        echo
    else
        echo "  ℹ️  Modo --yes: omitiendo confirmación interactiva."
        echo
    fi
fi

# ---------------------------------------------------------------------------
# Paso 5: Crear backup con timestamp de dev.db
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Paso 6: Ejecutar sincronización con Node.js (sync-db.js)
# ---------------------------------------------------------------------------
echo "  🔄 Paso 5: Sincronizando tablas..."
echo "  --------------------------------------------"

node "$SCRIPT_DIR/sync-db.js" "$DIRECTION"
NODE_EXIT=$?

echo "  --------------------------------------------"
echo

# ---------------------------------------------------------------------------
# Paso 7: Reportar resultado
# ---------------------------------------------------------------------------
if [ $NODE_EXIT -ne 0 ]; then
    echo "============================================"
    echo "  ❌ La sincronización falló (código $NODE_EXIT)"
    echo "  Se mantiene el backup: $BACKUP"
    echo "============================================"
    exit $NODE_EXIT
fi

echo "============================================"
echo "  ✅ Sincronización completada con éxito"
echo "  Backup disponible en: $BACKUP"
echo "============================================"
