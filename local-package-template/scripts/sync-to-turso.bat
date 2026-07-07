@echo off
chcp 65001 >nul
setlocal disabledelayedexpansion
title Sincronizando SQLite a Turso

echo ============================================
echo   Sincronizando SQLite -^> Turso
echo ============================================
echo.

REM --- Paso 1: Verificar que Node.js este instalado ---
where node >nul 2>nul
if errorlevel 1 (
    echo   ❌ ERROR: Node.js no esta instalado.
    echo   Instale Node.js y vuelva a intentarlo.
    echo.
    pause
    exit /b 1
)
echo   ✅ Paso 1: Node.js detectado
node --version
echo.

REM --- Capturar ruta absoluta de la raiz del paquete ---
pushd ..
set "PKG_ROOT=%CD%"
popd

REM --- Paso 2: Verificar que dev.db exista ---
if not exist "%PKG_ROOT%\dev.db" (
    echo   ❌ ERROR: No se encontro dev.db
    echo   La base de datos local no existe. Ejecute el sistema al menos una vez en modo local.
    echo.
    pause
    exit /b 1
)
echo   ✅ Paso 2: Base de datos local encontrada (dev.db)
echo.

REM --- Paso 3: Verificar que .env exista y este en modo ONLINE ---
if not exist "%PKG_ROOT%\.env" (
    echo   ❌ ERROR: No se encontro .env
    echo   Ejecute switch-mode.bat online primero.
    echo.
    pause
    exit /b 1
)
findstr /I "libsql:// http" "%PKG_ROOT%\.env" >nul
if errorlevel 1 (
    echo   ❌ ERROR: Debe estar en modo ONLINE para sincronizar.
    echo   Ejecute switch-mode.bat online primero.
    echo.
    pause
    exit /b 1
)
echo   ✅ Paso 3: .env en modo ONLINE (Turso)
echo.

REM --- Paso 4: Crear backup con timestamp ---
if not exist "%PKG_ROOT%\data" mkdir "%PKG_ROOT%\data"
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "TS=%%i"
set "BACKUP=%PKG_ROOT%\data\backup-%TS%.db"
copy /Y "%PKG_ROOT%\dev.db" "%BACKUP%" >nul
if errorlevel 1 (
    echo   ❌ ERROR: No se pudo crear el backup en %BACKUP%
    echo.
    pause
    exit /b 1
)
echo   ✅ Paso 4: Backup creado:
echo   %BACKUP%
echo.

REM --- Paso 5: Escribir el script Node.js en archivo temporal ---
echo   🔄 Paso 5: Sincronizando tablas...
echo   --------------------------------------------
del "%TEMP%\sync-turso.js" >nul 2>nul

> "%TEMP%\sync-turso.js" echo const { createClient } = require('@libsql/client');
>> "%TEMP%\sync-turso.js" echo const fs = require('fs');
>> "%TEMP%\sync-turso.js" echo const env = fs.readFileSync('.env', 'utf8');
>> "%TEMP%\sync-turso.js" echo const lines = env.split('\n');
>> "%TEMP%\sync-turso.js" echo let tursoUrl = '';
>> "%TEMP%\sync-turso.js" echo let authToken = '';
>> "%TEMP%\sync-turso.js" echo for (const line of lines) {
>> "%TEMP%\sync-turso.js" echo const m = line.match(/^^DATABASE_URL=(.+)$/);
>> "%TEMP%\sync-turso.js" echo if (m) tursoUrl = m[1].trim().replace(/^^["']^|["']$/g, '');
>> "%TEMP%\sync-turso.js" echo const t = line.match(/^^(?:DATABASE_AUTH_TOKEN^|TURSO_AUTH_TOKEN)=(.+)$/);
>> "%TEMP%\sync-turso.js" echo if (t) authToken = t[1].trim().replace(/^^["']^|["']$/g, '');
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo try {
>> "%TEMP%\sync-turso.js" echo const u = new URL(tursoUrl);
>> "%TEMP%\sync-turso.js" echo if (u.searchParams.get('authToken')) authToken = u.searchParams.get('authToken');
>> "%TEMP%\sync-turso.js" echo tursoUrl = tursoUrl.split('?')[0];
>> "%TEMP%\sync-turso.js" echo } catch(e) {}
>> "%TEMP%\sync-turso.js" echo if (!tursoUrl.startsWith('libsql://') ^&^& !tursoUrl.startsWith('http')) {
>> "%TEMP%\sync-turso.js" echo console.error('❌ ERROR: DATABASE_URL no es una URL de Turso (libsql://). Ejecute switch-mode.bat online primero.');
>> "%TEMP%\sync-turso.js" echo process.exit(1);
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo const local = createClient({ url: 'file:./dev.db' });
>> "%TEMP%\sync-turso.js" echo const remote = createClient({ url: tursoUrl, authToken: authToken ^|^| undefined });
>> "%TEMP%\sync-turso.js" echo async function getTables(client) {
>> "%TEMP%\sync-turso.js" echo const r = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%%' AND name NOT LIKE '_prisma_%%' AND name NOT LIKE '__drizzle_%%'");
>> "%TEMP%\sync-turso.js" echo return r.rows.map(row =^> row.name).filter(Boolean).sort();
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo async function tableColumns(client, table) {
>> "%TEMP%\sync-turso.js" echo const r = await client.execute(`PRAGMA table_info("${table}")`);
>> "%TEMP%\sync-turso.js" echo return r.rows.map(row =^> row.name);
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo (async () =^> {
>> "%TEMP%\sync-turso.js" echo const tables = await getTables(local);
>> "%TEMP%\sync-turso.js" echo console.log(`  📋 Tablas encontradas: ${tables.length}`);
>> "%TEMP%\sync-turso.js" echo console.log('  --------------------------------------------');
>> "%TEMP%\sync-turso.js" echo let synced = 0;
>> "%TEMP%\sync-turso.js" echo for (const table of tables) {
>> "%TEMP%\sync-turso.js" echo try {
>> "%TEMP%\sync-turso.js" echo const cols = await tableColumns(local, table);
>> "%TEMP%\sync-turso.js" echo if (cols.length === 0) {
>> "%TEMP%\sync-turso.js" echo console.log(`  ⏭️  ${table}: sin columnas, omitida`);
>> "%TEMP%\sync-turso.js" echo continue;
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo const data = await local.execute(`SELECT * FROM "${table}"`);
>> "%TEMP%\sync-turso.js" echo try {
>> "%TEMP%\sync-turso.js" echo await remote.execute(`DELETE FROM "${table}"`);
>> "%TEMP%\sync-turso.js" echo } catch(e) {
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo const placeholders = cols.map(() =^> '?').join(', ');
>> "%TEMP%\sync-turso.js" echo const colList = cols.map(c =^> `"${c}"`).join(', ');
>> "%TEMP%\sync-turso.js" echo const stmt = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`;
>> "%TEMP%\sync-turso.js" echo const batchArgs = data.rows.map(row =^> cols.map(c =^> row[c]));
>> "%TEMP%\sync-turso.js" echo if (batchArgs.length ^> 0) {
>> "%TEMP%\sync-turso.js" echo await remote.batch(batchArgs.map(args =^> ({ sql: stmt, args })));
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo console.log(`  ✅ ${table}: ${data.rows.length} filas`);
>> "%TEMP%\sync-turso.js" echo synced++;
>> "%TEMP%\sync-turso.js" echo } catch (e) {
>> "%TEMP%\sync-turso.js" echo console.error(`  ❌ ${table}: ${e.message}`);
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo console.log('  --------------------------------------------');
>> "%TEMP%\sync-turso.js" echo console.log(`\n  ✅ Sincronización completada: ${synced}/${tables.length} tablas.`);
>> "%TEMP%\sync-turso.js" echo console.log('\n  ✅ Verificando...');
>> "%TEMP%\sync-turso.js" echo try {
>> "%TEMP%\sync-turso.js" echo const v = await remote.execute("SELECT COUNT(*) as c FROM ProductoTerminado");
>> "%TEMP%\sync-turso.js" echo console.log(`  📦 ProductoTerminado: ${v.rows[0].c} filas en Turso.`);
>> "%TEMP%\sync-turso.js" echo } catch(e) {
>> "%TEMP%\sync-turso.js" echo console.log('  ℹ️  Verificación: no se pudo contar ProductoTerminado (puede no existir la tabla).');
>> "%TEMP%\sync-turso.js" echo }
>> "%TEMP%\sync-turso.js" echo })().catch(e =^> {
>> "%TEMP%\sync-turso.js" echo console.error('  ❌ FATAL:', e.message ^|^| e);
>> "%TEMP%\sync-turso.js" echo process.exit(1);
>> "%TEMP%\sync-turso.js" echo });

REM --- Ejecutar Node desde la raiz del paquete (para que ./dev.db y ./.env resuelvan) ---
cd /d "%PKG_ROOT%"
node "%TEMP%\sync-turso.js"
set "NODE_EXIT=%errorlevel%"
del "%TEMP%\sync-turso.js" >nul 2>nul

echo.
echo   --------------------------------------------
if "%NODE_EXIT%"=="0" (
    echo ============================================
    echo   ✅ Sincronizacion completada con exito
    echo   Backup disponible en:
    echo   %BACKUP%
    echo ============================================
) else (
    echo ============================================
    echo   ❌ La sincronizacion fallo (codigo %NODE_EXIT%)
    echo   Se mantiene el backup: %BACKUP%
    echo ============================================
)
echo.
pause
exit /b %NODE_EXIT%
