@echo off
chcp 65001 >nul
setlocal disabledelayedexpansion
title Sincronizacion bidireccional Local - Turso

REM ============================================
REM sync-db.bat — Sincronizacion bidireccional SQLite Local <-> Turso
REM
REM Uso:
REM   scripts\sync-db.bat push          REM Local -> Turso (sobrescribe la nube)
REM   scripts\sync-db.bat pull          REM Turso -> Local (sobrescribe el local, pide confirmacion)
REM   scripts\sync-db.bat pull --yes    REM Turso -> Local sin pedir confirmacion
REM   scripts\sync-db.bat --help        REM Mostrar esta ayuda
REM ============================================

REM --- Capturar ruta absoluta de la raiz del paquete ---
pushd ..
set "PKG_ROOT=%CD%"
popd
set "SCRIPT_DIR=%~dp0"
REM Quitar la barra final de %SCRIPT_DIR% para que se vea mas prolijo
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM --- Banner ---
echo ============================================
echo   Sincronizacion bidireccional Local ^<^-^> Turso
echo ============================================
echo.

REM --- Ayuda ---
if /i "%~1"=="--help" goto :print_help
if /i "%~1"=="-h" goto :print_help
if /i "%~1"=="/?" goto :print_help

REM --- Leer direccion (push | pull) ---
set "DIRECTION=%~1"

if "%DIRECTION%"=="" (
    echo   ERROR: Falta indicar la direccion (push o pull^).
    echo.
    goto :print_help_and_exit_1
)

if /i not "%DIRECTION%"=="push" if /i not "%DIRECTION%"=="pull" (
    echo   ERROR: Direccion invalida "%DIRECTION%". Usa "push" o "pull".
    echo.
    goto :print_help_and_exit_1
)

set "SKIP_CONFIRM=%~2"

if /i "%DIRECTION%"=="push" (
    echo   Direccion: push
    echo   (Local SQLite -^> Turso, sobrescribe la nube^)
) else (
    echo   Direccion: pull
    echo   (Turso -^> Local SQLite, sobrescribe el local^)
)
echo.

REM --- Paso 1: Verificar que Node.js este instalado ---
where node >nul 2>nul
if errorlevel 1 (
    echo   ERROR: Node.js no esta instalado.
    echo   Instala Node.js y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
)
echo   Paso 1: Node.js detectado
node --version
echo.

REM --- Paso 2: Verificar que dev.db exista ---
if not exist "%PKG_ROOT%\dev.db" (
    echo   ERROR: No se encontro dev.db en %PKG_ROOT%
    echo   La base de datos local no existe. Ejecuta el sistema al menos una vez en modo local.
    echo.
    pause
    exit /b 1
)
echo   Paso 2: Base de datos local encontrada (dev.db^)
echo.

REM --- Paso 3: Verificar que .env exista y este en modo ONLINE ---
if not exist "%PKG_ROOT%\.env" (
    echo   ERROR: No se encontro .env
    echo   Ejecuta switch-mode.bat online primero.
    echo.
    pause
    exit /b 1
)

findstr /I /R "^DATABASE_URL=libsql:// ^DATABASE_URL=http" "%PKG_ROOT%\.env" >nul
if errorlevel 1 (
    echo   ERROR: .env no esta en modo ONLINE.
    echo   DATABASE_URL debe empezar con libsql:// o http:// para sincronizar.
    echo   Ejecuta switch-mode.bat online primero.
    echo.
    pause
    exit /b 1
)
echo   Paso 3: .env en modo ONLINE (Turso^)
echo.

REM --- Paso 4: Si es pull, pedir confirmacion antes de sobrescribir ---
REM (Se usa goto en lugar de if anidado porque con disabledelayedexpansion
REM  las variables seteadas dentro de un bloque if no se ven al %var% del
REM  mismo bloque: se expanden a parse-time, antes de que set /p corra.)
if /i not "%DIRECTION%"=="pull" goto :skip_pull_confirm
if /i "%SKIP_CONFIRM%"=="--yes" goto :skip_pull_confirm_yes
if /i "%SKIP_CONFIRM%"=="-y" goto :skip_pull_confirm_yes

echo   ADVERTENCIA: pull va a SOBREESCRIBIR tu dev.db local
echo   con los datos que esten en Turso. Los datos locales actuales
echo   se van a borrar (antes se hace un backup automatico^).
echo.
set "CONFIRM="
set /p "CONFIRM=  Confirmas que queres sobrescribir el local con Turso? (escribi 'si' para confirmar): "
echo.
if /i not "%CONFIRM%"=="si" (
    echo   Operacion cancelada por el usuario.
    echo.
    pause
    exit /b 0
)
echo   Confirmacion recibida. Continuando...
echo.
goto :skip_pull_confirm

:skip_pull_confirm_yes
echo   Modo --yes: omitiendo confirmacion interactiva.
echo.

:skip_pull_confirm

REM --- Paso 5: Crear backup con timestamp ---
if not exist "%PKG_ROOT%\data" mkdir "%PKG_ROOT%\data"
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "TS=%%i"
set "BACKUP=%PKG_ROOT%\data\backup-%TS%.db"
copy /Y "%PKG_ROOT%\dev.db" "%BACKUP%" >nul
if errorlevel 1 (
    echo   ERROR: No se pudo crear el backup en %BACKUP%
    echo.
    pause
    exit /b 1
)
echo   Paso 4: Backup creado:
echo   %BACKUP%
echo.

REM --- Paso 6: Ejecutar sincronizacion con Node.js ---
echo   Paso 5: Sincronizando tablas...
echo   --------------------------------------------
cd /d "%PKG_ROOT%"
node "%SCRIPT_DIR%\sync-db.js" %DIRECTION%
set "NODE_EXIT=%errorlevel%"
echo   --------------------------------------------
echo.

REM --- Paso 7: Reportar resultado ---
if "%NODE_EXIT%"=="0" (
    echo ============================================
    echo   Sincronizacion completada con exito
    echo   Backup disponible en:
    echo   %BACKUP%
    echo ============================================
) else (
    echo ============================================
    echo   La sincronizacion fallo (codigo %NODE_EXIT%^)
    echo   Se mantiene el backup: %BACKUP%
    echo ============================================
)
echo.
pause
exit /b %NODE_EXIT%

:print_help
echo Uso:
echo   scripts\sync-db.bat push           Local -^> Turso (sobrescribe la nube^)
echo   scripts\sync-db.bat pull           Turso -^> Local (sobrescribe el local, pide confirmacion^)
echo   scripts\sync-db.bat pull --yes     Turso -^> Local sin pedir confirmacion
echo   scripts\sync-db.bat --help         Mostrar esta ayuda
echo.
echo Requisitos previos:
echo   - Estar en modo ONLINE (.env con DATABASE_URL=libsql://... o http://...)
echo     Ejecuta switch-mode.bat online primero.
echo   - Que dev.db exista en la raiz del paquete.
echo   - Node.js instalado.
echo.
echo Notas:
echo   - Antes de sincronizar se hace un backup automatico de dev.db en data\.
echo   - El backup NO se borra aunque la sincronizacion falle.
echo   - En pull, los datos locales se sobrescriben completamente (DELETE + INSERT^).
echo.
pause
exit /b 0

:print_help_and_exit_1
echo Uso:
echo   scripts\sync-db.bat push           Local -^> Turso (sobrescribe la nube^)
echo   scripts\sync-db.bat pull           Turso -^> Local (sobrescribe el local, pide confirmacion^)
echo   scripts\sync-db.bat pull --yes     Turso -^> Local sin pedir confirmacion
echo   scripts\sync-db.bat --help         Mostrar esta ayuda
echo.
pause
exit /b 1
