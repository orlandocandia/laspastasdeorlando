#!/bin/bash
# sync-to-turso.sh — Alias backward-compat para `sync-db.sh push`
# (Local SQLite → Turso, sobrescribe la nube)
#
# Mantenido por compatibilidad con versiones anteriores.
# Preferí usar: ./scripts/sync-db.sh push
#
# El nuevo script sync-db.sh soporta push (local → Turso) y pull (Turso → local).
# Cualquier argumento extra (p.ej. --yes) se reenvía tal cual a sync-db.sh.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/sync-db.sh" push "$@"
