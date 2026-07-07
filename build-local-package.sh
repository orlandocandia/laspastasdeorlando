#!/bin/bash
# =============================================================================
# build-local-package.sh
# =============================================================================
# Reconstruye el paquete standalone "laspastasdeorlando-local" desde el codigo
# fuente del repositorio. Genera el build de Next.js con output: 'standalone',
# copia los assets publicos, la base de datos local, y crea los tarballs de
# distribucion (.tar.gz para Linux y .zip para Windows).
#
# Uso:
#   ./build-local-package.sh
#
# Requisitos:
#   - Node.js 18+ o Bun 1.0+
#   - Dependencias instaladas (bun install o npm install)
#
# Salida:
#   - laspastasdeorlando-local/         (carpeta del paquete lista para usar)
#   - laspastasdeorlando-local.tar.gz   (tarball para Linux)
#   - laspastasdeorlando-local.zip      (zip para Windows)
# =============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$ROOT_DIR/laspastasdeorlando-local"
STANDALONE_DIR="$ROOT_DIR/.next/standalone"

cd "$ROOT_DIR"

echo "=============================================="
echo "  Build del paquete local laspastasdeorlando"
echo "=============================================="
echo ""

# --- 1. Verificar dependencias ---
echo "[1/7] Verificando entorno..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instale desde https://nodejs.org/"
    exit 1
fi
echo "   ✅ Node.js: $(node --version)"

if [ ! -d "node_modules" ]; then
    echo "   📦 Instalando dependencias..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
fi
echo "   ✅ Dependencias presentes"
echo ""

# --- 2. Generar cliente Prisma ---
echo "[2/7] Generando cliente Prisma..."
DATABASE_URL=file:./dev.db DATABASE_URL_FILE=file:./dev.db npx prisma generate
echo "   ✅ Cliente Prisma generado"
echo ""

# --- 3. Build standalone de Next.js ---
echo "[3/7] Compilando Next.js (standalone)... esto puede tardar 3-5 minutos"
# BUILD_STANDALONE=1 activa output:'standalone' en next.config.ts (solo para paquete local)
BUILD_STANDALONE=1 DATABASE_URL=file:./dev.db npx next build
if [ ! -d "$STANDALONE_DIR" ]; then
    echo "❌ El build no generó .next/standalone/. Verifique next.config.ts."
    exit 1
fi
echo "   ✅ Build standalone generado"
echo ""

# --- 4. Limpiar paquete anterior y copiar archivos fuente del template ---
echo "[4/7] Preparando carpeta del paquete..."
TEMPLATE_DIR="$ROOT_DIR/local-package-template"
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "❌ No se encontró local-package-template/. Es necesario para construir el paquete."
    exit 1
fi
# Limpiar paquete anterior completamente
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR/scripts" "$PKG_DIR/data"
# Copiar archivos fuente del template (README, .env templates, scripts)
cp "$TEMPLATE_DIR/README.md" "$PKG_DIR/"
cp "$TEMPLATE_DIR/.env.local" "$PKG_DIR/"
cp "$TEMPLATE_DIR/.env.online" "$PKG_DIR/"
cp "$TEMPLATE_DIR/scripts/"* "$PKG_DIR/scripts/"
touch "$PKG_DIR/data/.gitkeep"
chmod +x "$PKG_DIR/scripts/"*.sh
echo "   ✅ Archivos fuente copiados desde local-package-template/"
echo ""

# --- 5. Copiar artefactos del build standalone ---
echo "[5/7] Copiando build standalone al paquete..."
cp -r "$STANDALONE_DIR/.next" "$PKG_DIR/"
cp -r "$STANDALONE_DIR/node_modules" "$PKG_DIR/"
cp "$STANDALONE_DIR/server.js" "$PKG_DIR/"
cp "$STANDALONE_DIR/package.json" "$PKG_DIR/"
cp -r "$STANDALONE_DIR/prisma" "$PKG_DIR/"
echo "   ✅ Build copiado"

# Copiar assets públicos
cp -r "$ROOT_DIR/public" "$PKG_DIR/public"
echo "   ✅ Assets públicos copiados"

# Copiar código fuente (respaldo de emergencia: permite reconstruir o correr en modo dev)
if [ -d "$ROOT_DIR/src" ]; then
    cp -r "$ROOT_DIR/src" "$PKG_DIR/src"
    echo "   ✅ Código fuente copiado (src/)"
else
    echo "   ⚠️  No se encontró src/. El paquete no incluirá el código fuente."
fi

# Copiar config files clave para modo dev (prisma schema, next.config, tsconfig, etc.)
for f in prisma/schema.prisma next.config.ts tsconfig.json components.json eslint.config.mjs; do
    if [ -f "$ROOT_DIR/$f" ]; then
        mkdir -p "$PKG_DIR/$(dirname "$f")"
        cp "$ROOT_DIR/$f" "$PKG_DIR/$f"
    fi
done
echo "   ✅ Archivos de configuración copiados"

# Copiar base de datos local (con datos seed si existe)
if [ -f "$ROOT_DIR/prisma/dev.db" ]; then
    cp "$ROOT_DIR/prisma/dev.db" "$PKG_DIR/dev.db"
    echo "   ✅ Base de datos local copiada (con datos seed)"
else
    echo "   ⚠️  No se encontró prisma/dev.db. Cree la base con: bun run db:push"
fi

# Crear .env por defecto (modo local)
if [ -f "$PKG_DIR/.env.local" ]; then
    cp "$PKG_DIR/.env.local" "$PKG_DIR/.env"
    echo "   ✅ .env creado (modo local por defecto)"
fi

# Asegurar permisos de scripts
chmod +x "$PKG_DIR/scripts/"*.sh 2>/dev/null || true
echo ""

# --- 6. Verificar estructura ---
echo "[6/7] Verificando estructura del paquete..."
for f in server.js package.json .env .env.local .env.online README.md dev.db; do
    if [ ! -f "$PKG_DIR/$f" ]; then
        echo "   ❌ Falta: $f"
        exit 1
    fi
done
for d in .next node_modules public src scripts data prisma; do
    if [ ! -d "$PKG_DIR/$d" ]; then
        echo "   ❌ Falta carpeta: $d"
        exit 1
    fi
done
echo "   ✅ Estructura completa"
echo ""

# --- 7. Crear tarballs de distribución ---
echo "[7/7] Creando tarballs de distribución..."
cd "$ROOT_DIR"

echo "   📦 Creando laspastasdeorlando-local.tar.gz (Linux)..."
tar -czf laspastasdeorlando-local.tar.gz laspastasdeorlando-local/

if command -v zip &> /dev/null; then
    echo "   📦 Creando laspastasdeorlando-local.zip (Windows)..."
    cd "$PKG_DIR" && zip -rq "$ROOT_DIR/laspastasdeorlando-local.zip" . && cd "$ROOT_DIR"
else
    echo "   ⚠️  zip no está instalado, saltando .zip"
fi

echo ""
echo "=============================================="
echo "  ✅ Build completado"
echo "=============================================="
echo ""
echo "  Paquete:     laspastasdeorlando-local/"
echo "  Tamaño:      $(du -sh "$PKG_DIR" | cut -f1)"
echo ""
echo "  Tarball:     laspastasdeorlando-local.tar.gz ($(du -sh laspastasdeorlando-local.tar.gz | cut -f1))"
if [ -f laspastasdeorlando-local.zip ]; then
    echo "  Zip:         laspastasdeorlando-local.zip ($(du -sh laspastasdeorlando-local.zip | cut -f1))"
fi
echo ""
echo "  Para usar en Linux:"
echo "    cd laspastasdeorlando-local"
echo "    ./scripts/start-linux.sh"
echo ""
echo "  Para usar en Windows:"
echo "    Descomprimir laspastasdeorlando-local.zip"
echo "    Ejecutar scripts\\install-windows.bat  (solo la primera vez)"
echo "    Ejecutar scripts\\start-windows.bat"
echo ""
