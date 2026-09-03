/**
 * ============================================================
 * API — Debug de autenticación de la Cocina Móvil
 * ============================================================
 * GET /api/cocina-movil/auth/debug
 *
 * Endpoint temporal de depuración para verificar:
 *  - Que el código desplegado tiene los usuarios correctos
 *  - Qué usuarios están configurados (sin contraseñas)
 *  - El entorno (NODE_ENV, runtime)
 *
 * ⚠️ ELIMINAR en producción real una vez resuelto el issue.
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { getDemoUsersDebug } from '@/lib/cocina-movil/auth'

export const runtime = 'nodejs'

export async function GET() {
  const users = getDemoUsersDebug()

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    runtime: 'nodejs',
    module: 'cocina-movil/auth',
    version: 'stateless-tokens-v1',
    demoUsers: users,
    demoUserCount: users.length,
    note: 'Endpoint temporal de debug. Eliminar en producción.',
  })
}
