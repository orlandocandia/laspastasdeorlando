@echo off
chcp 65001 >nul
title Cambio de modo — laspastasdeorlando

echo ============================================
echo   Cambio de modo — laspastasdeorlando
echo ============================================
echo.

if "%1"=="local" goto :local
if "%1"=="online" goto :online

echo   ❌ Modo no valido.
echo.
echo   Uso: switch-mode.bat [local^|online]
echo.
echo     local  → Usa SQLite local (archivo dev.db)
echo     online → Usa Turso en la nube (requiere .env.online)
echo.
pause
exit /b 1

:local
if not exist "..\.env.local" (
    echo   ❌ ERROR: No se encontro ..\.env.local
    echo   Cree el archivo .env.local con DATABASE_URL=file:./dev.db
    echo.
    pause
    exit /b 1
)
copy /Y "..\.env.local" "..\.env" >nul
echo   ✅ Cambiado a modo LOCAL (SQLite)
echo.
echo   Base de datos: dev.db (archivo local)
echo   Archivo .env actualizado.
echo.
pause
exit /b 0

:online
if not exist "..\.env.online" (
    echo   ❌ ERROR: No se encontro ..\.env.online
    echo   Cree el archivo .env.online con:
    echo     DATABASE_URL=libsql://^<su-base^>.turso.io
    echo     DATABASE_AUTH_TOKEN=^<token^>
    echo.
    pause
    exit /b 1
)
copy /Y "..\.env.online" "..\.env" >nul
echo   ✅ Cambiado a modo ONLINE (Turso)
echo.
echo   Base de datos: Turso (nube)
echo   Archivo .env actualizado.
echo.
pause
exit /b 0
