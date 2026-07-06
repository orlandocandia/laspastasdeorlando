@echo off
chcp 65001 >nul
title Instalando dependencias nativas para Windows

echo ============================================
echo   Instalacion de dependencias para Windows
echo   Las Pastas de Orlando (Local)
echo ============================================
echo.

REM --- Verificar que Node.js esta instalado ---
where node >nul 2>nul
if errorlevel 1 (
    echo   ❌ ERROR: Node.js no esta instalado
    echo.
    echo   Por favor instale Node.js 18+ desde https://nodejs.org/
    echo   y vuelva a ejecutar este script.
    echo.
    pause
    exit /b 1
)

echo   ✅ Node.js detectado:
node --version
echo.

REM --- Cambiar al directorio raiz del paquete ---
cd /d %~dp0\..

echo   Este script instala las dependencias nativas necesarias
echo   para que el sistema funcione en Windows. Solo necesita
echo   ejecutarse UNA VEZ al instalar el paquete.
echo.
echo   Procesando... (puede tardar 1-3 minutos)
echo.

REM --- Instalar @libsql/win32-x64 (native binary para libsql en Windows) ---
echo   [1/3] Instalando @libsql/win32-x64...
call npm install @libsql/win32-x64 --no-save --no-package-lock --silent 2>nul
if errorlevel 1 (
    echo   ⚠️  No se pudo instalar @libsql/win32-x64, reintentando...
    call npm install @libsql/win32-x64 --no-save --no-package-lock
    if errorlevel 1 (
        echo   ❌ ERROR: Fallo la instalacion de @libsql/win32-x64
        echo   Verifique su conexion a internet y vuelva a intentarlo.
        pause
        exit /b 1
    )
)
echo   ✅ @libsql/win32-x64 instalado

REM --- Instalar prisma CLI si no esta presente ---
echo   [2/3] Verificando Prisma CLI...
if not exist "node_modules\.bin\prisma" (
    call npm install prisma@6.11.1 --no-save --no-package-lock --silent 2>nul
    if errorlevel 1 (
        call npm install prisma@6.11.1 --no-save --no-package-lock
    )
)
echo   ✅ Prisma CLI listo

REM --- Generar el cliente Prisma para Windows (descarga query engine Windows) ---
echo   [3/3] Generando cliente Prisma para Windows...
set DATABASE_URL=file:./dev.db
set DATABASE_URL_FILE=file:./dev.db
call node_modules\.bin\prisma generate
if errorlevel 1 (
    echo   ❌ ERROR: Fallo prisma generate
    echo   Asegurese de que el archivo prisma/schema.prisma existe.
    pause
    exit /b 1
)
echo   ✅ Cliente Prisma generado

echo.
echo ============================================
echo   ✅ Instalacion completada
echo ============================================
echo.
echo   Las dependencias nativas para Windows estan listas.
echo   Ahora puede ejecutar:  scripts\start-windows.bat
echo.
pause
