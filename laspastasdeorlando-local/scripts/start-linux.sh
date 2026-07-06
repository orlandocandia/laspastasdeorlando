#!/bin/bash
# start-linux.sh — Inicia laspastasdeorlando en modo local (SQLite)

# Resolver rutas relativas a la ubicacion del script (funciona desde cualquier CWD)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PKG_DIR"

echo "============================================"
echo "  Iniciando laspastasdeorlando (Local)"
echo "============================================"
echo
echo " 📦 Usando base de datos local (SQLite)"
echo

# --- Verificar que Node.js esta instalado ---
if ! command -v node >/dev/null 2>&1; then
    echo "============================================"
    echo "  ❌ ERROR: Node.js no esta instalado"
    echo "============================================"
    echo
    echo "  Por favor instale Node.js desde https://nodejs.org/"
    echo "  y vuelva a ejecutar este script."
    echo
    read -p "  Presione Enter para salir..."
    exit 1
fi

echo " ✅ Node.js detectado: $(node --version)"

# --- Verificar que server.js existe ---
if [ ! -f "server.js" ]; then
    echo "============================================"
    echo "  ❌ ERROR: No se encontro server.js en $PKG_DIR"
    echo "============================================"
    echo
    echo "  Asegurese de que el paquete este correctamente"
    echo "  instalado (falta el archivo server.js en la raiz)."
    echo
    read -p "  Presione Enter para salir..."
    exit 1
fi

echo " ✅ server.js encontrado"
echo

# --- Asegurar que la carpeta data exista ---
mkdir -p data
echo " ✅ Carpeta data lista"
echo

echo "============================================"
echo "  🔄 Iniciando servidor en http://localhost:3000"
echo "  (Presione Ctrl+C para detener)"
echo "============================================"
echo

node server.js

echo
echo "============================================"
echo "  El servidor se detuvo."
echo "============================================"
read -p "  Presione Enter para salir..."
