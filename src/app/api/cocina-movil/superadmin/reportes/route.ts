import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/cocina-movil/auth-middleware'
import { getGlobalReport } from '@/lib/cocina-movil/superadmin'

export const runtime = 'nodejs'

/**
 * GET /api/cocina-movil/superadmin/reportes
 * Returns the global report with all admins and aggregate totals.
 * Requires superadmin authorization.
 */
export async function GET(request: Request) {
  const auth = requireSuperAdmin(request)
  if (!auth.authorized) return auth.response!
  const report = getGlobalReport()
  return NextResponse.json(report)
}
