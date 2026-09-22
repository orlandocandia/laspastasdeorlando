import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/cocina-movil/auth-middleware'
import { getGlobalActivity } from '@/lib/cocina-movil/superadmin'

export const runtime = 'nodejs'

/**
 * GET /api/cocina-movil/superadmin/activity
 * Returns the global activity log across all admins (owners).
 * Requires superadmin authorization.
 */
export async function GET(request: Request) {
  const auth = requireSuperAdmin(request)
  if (!auth.authorized) return auth.response!
  const activity = getGlobalActivity()
  return NextResponse.json({ activity })
}
