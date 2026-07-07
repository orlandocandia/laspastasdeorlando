#!/bin/bash
# switch-mode.sh — Cambia entre modo LOCAL (SQLite) y ONLINE (Turso)
# Uso: ./switch-mode.sh [local|online]

# Resolver rutas relativas a la ubicacion del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PKG_DIR"

MODE="$1"

echo "============================================"
echo "  Cambio de modo — laspastasdeorlando"
echo "============================================"
echo

if [ "$MODE" = "local" ]; then
    SRC=".env.local"
    DST=".env"
    if [ ! -f "$SRC" ]; then
        echo "  ❌ ERROR: No se encontro $SRC"
        echo "  Cree el archivo .env.local con DATABASE_URL=file:./dev.db"
        echo
        exit 1
    fi
    cp "$SRC" "$DST"
    echo "  ✅ Cambiado a modo LOCAL (SQLite)"
    echo
    echo "  Base de datos: dev.db (archivo local)"
    echo "  Archivo .env actualizado."
    echo
    exit 0
fi

if [ "$MODE" = "online" ]; then
    SRC=".env.online"
    DST=".env"
    if [ ! -f "$SRC" ]; then
        echo "  ❌ ERROR: No se encontro $SRC"
        echo "  Cree el archivo .env.online con:"
        echo "    DATABASE_URL=libsql://<su-base>.turso.io"
        echo "    DATABASE_AUTH_TOKEN=<token>"
        echo
        exit 1
    fi
    cp "$SRC" "$DST"
    echo "  ✅ Cambiado a modo ONLINE (Turso)"
    echo
    echo "  Base de datos: Turso (nube)"
    echo "  Archivo .env actualizado."
    echo
    exit 0
fi

# --- Modo no valido o ausente ---
echo "  ❌ Modo no valido."
echo
echo "  Uso: ./switch-mode.sh [local|online]"
echo
echo "    local  → Usa SQLite local (archivo dev.db)"
echo "    online → Usa Turso en la nube (requiere .env.online)"
echo
exit 1
