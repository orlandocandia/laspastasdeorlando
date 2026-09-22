import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/cocina-movil/auth-middleware'
import { getRankings } from '@/lib/cocina-movil/superadmin'

export const runtime = 'nodejs'

/**
 * GET /api/cocina-movil/superadmin/ranking
 * Returns rankings of admins (owners) by sales, productions and recipes.
 * Requires superadmin authorization.
 */
export async function GET(request: Request) {
  const auth = requireSuperAdmin(request)
  if (!auth.authorized) return auth.response!
  const rankings = getRankings()
  return NextResponse.json(rankings)
}
