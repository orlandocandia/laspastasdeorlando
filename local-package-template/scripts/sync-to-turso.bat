@echo off
chcp 65001 >nul
REM sync-to-turso.bat — Alias backward-compat para `sync-db.bat push`
REM (Local SQLite -^> Turso, sobrescribe la nube)
REM
REM Mantenido por compatibilidad con versiones anteriores.
REM Preferi usar: scripts\sync-db.bat push
REM
REM El nuevo script sync-db.bat soporta push (local -^> Turso) y pull (Turso -^> local).
REM Cualquier argumento extra (p.ej. --yes) se reenvia tal cual a sync-db.bat.

"%~dp0sync-db.bat" push %*
exit /b %errorlevel%
