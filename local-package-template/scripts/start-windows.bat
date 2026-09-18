@echo off
chcp 65001 >nul
title Iniciando laspastasdeorlando (Local)

echo ============================================
echo   Iniciando laspastasdeorlando (Local)
echo ============================================
echo.
echo  📦 Usando base de datos local (SQLite)
echo.

REM --- Verificar que Node.js esta instalado ---
where node >nul 2>nul
if errorlevel 1 (
    echo ============================================
    echo   ❌ ERROR: Node.js no esta instalado
    echo ============================================
    echo.
    echo  Por favor instale Node.js desde https://nodejs.org/
    echo  y vuelva a ejecutar este script.
    echo.
    pause
    exit /b 1
)

echo  ✅ Node.js detectado
node --version

REM --- Verificar que server.js existe en el directorio padre ---
if not exist "..\server.js" (
    echo ============================================
    echo   ❌ ERROR: No se encontro ..\server.js
    echo ============================================
    echo.
    echo  Asegurese de que el paquete este correctamente
    echo  instalado (falta el archivo server.js en la raiz).
    echo.
    pause
    exit /b 1
)

echo  ✅ server.js encontrado
echo.

REM --- Verificar dependencias nativas de Windows (solo primera vez) ---
if not exist "..\node_modules\@libsql\win32-x64" (
    echo ============================================
    echo   ⚠️  Faltan dependencias nativas para Windows
    echo ============================================
    echo.
    echo  Es la primera vez que ejecuta el sistema en Windows.
    echo  Debe instalar las dependencias nativas primero.
    echo.
    echo  Ejecute:  scripts\install-windows.bat
    echo.
    pause
    exit /b 1
)
echo  ✅ Dependencias nativas presentes

REM --- Asegurar que la carpeta data exista ---
if not exist "..\data" mkdir "..\data"
echo  ✅ Carpeta data lista
echo.

REM --- Cambiar al directorio raiz del paquete ---
cd ..

echo ============================================
echo   🔄 Iniciando servidor en http://localhost:3000
echo   (Presione Ctrl+C para detener)
echo ============================================
echo.

node server.js

echo.
echo ============================================
echo   El servidor se detuvo.
echo ============================================
pause
