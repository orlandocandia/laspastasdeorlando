#!/bin/bash
# backup-local.sh — Crea una copia de seguridad de la base de datos local (dev.db)
# Genera un backup binario .db con timestamp y, si esta disponible, un dump SQL.

# Resolver rutas relativas a la ubicacion del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PKG_DIR"

echo "============================================"
echo "  📦 Backup de la base de datos local"
echo "============================================"
echo

# --- Verificar que dev.db exista ---
if [ ! -f "dev.db" ]; then
    echo "  ❌ ERROR: No se encontro dev.db en $PKG_DIR"
    echo "  La base de datos local no existe. Ejecute el sistema al menos una vez."
    exit 1
fi
echo "  ✅ Base de datos local encontrada (dev.db)"
echo

# --- Asegurar que la carpeta data exista ---
mkdir -p data
echo "  ✅ Carpeta de destino: data"
echo

# --- Crear backup binario con timestamp ---
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="data/backup-${TS}.db"

cp dev.db "$BACKUP"
if [ $? -ne 0 ]; then
    echo "  ❌ ERROR: No se pudo crear el backup binario."
    exit 1
fi

SIZE=$(du -h "$BACKUP" | cut -f1)
echo "  ✅ Backup binario creado:"
echo "     📄 $BACKUP"
echo "     📏 Tamaño: $SIZE"
echo

# --- Intentar dump SQL si sqlite3 CLI esta disponible ---
if command -v sqlite3 >/dev/null 2>&1; then
    DUMP="data/backup-${TS}.sql"
    if sqlite3 dev.db ".dump" > "$DUMP" 2>/dev/null; then
        DUMP_SIZE=$(du -h "$DUMP" | cut -f1)
        echo "  ✅ Dump SQL creado (opcional):"
        echo "     📄 $DUMP"
        echo "     📏 Tamaño: $DUMP_SIZE"
    else
        echo "  ⚠️  No se pudo generar el dump SQL (continuando sin el)."
    fi
else
    echo "  ℹ️  sqlite3 CLI no esta instalado: se omitio el dump SQL."
    echo "     El backup binario .db es suficiente para restaurar."
fi

echo
echo "============================================"
echo "  ✅ Backup completado con exito"
echo "============================================"
echo
echo "  Archivo de respaldo principal:"
echo "  $BACKUP"
echo
