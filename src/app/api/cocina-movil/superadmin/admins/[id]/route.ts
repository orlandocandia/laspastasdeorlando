import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/cocina-movil/auth-middleware'
import { getAdminDetail, getAdminStats } from '@/lib/cocina-movil/superadmin'

export const runtime = 'nodejs'

/**
 * GET /api/cocina-movil/superadmin/admins/[id]
 * Returns the detail and stats for a single admin (owner).
 * Requires superadmin authorization.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireSuperAdmin(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const detail = getAdminDetail(id)
  if (!detail) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })
  const stats = getAdminStats(id)
  return NextResponse.json({ admin: detail, stats })
}
