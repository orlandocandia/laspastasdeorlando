import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/cocina-movil/auth-middleware'
import { getAdminActivity } from '@/lib/cocina-movil/superadmin'

export const runtime = 'nodejs'

/**
 * GET /api/cocina-movil/superadmin/admins/[id]/activity
 * Returns the activity log for a single admin (owner).
 * Requires superadmin authorization.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireSuperAdmin(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params
  const activity = getAdminActivity(id)
  return NextResponse.json({ activity })
}
