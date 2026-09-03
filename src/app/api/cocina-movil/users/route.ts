/**
 * ============================================================
 * API — Usuarios de la Cocina Móvil
 * ============================================================
 * GET  /api/cocina-movil/users?search=&role=&isActive=&page=&pageSize=
 * POST /api/cocina-movil/users { name, email, password, role, avatar? }
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { listUsers, createUser, type CmRole } from '@/lib/cocina-movil/users'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const roleParam = url.searchParams.get('role') || 'all'
  const statusParam = url.searchParams.get('isActive') || 'all'
  const sortBy = (url.searchParams.get('sortBy') as 'name' | 'email' | 'createdAt' | 'lastLoginAt') || 'name'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))

  const role: CmRole | 'all' = (['admin', 'cocinero', 'supervisor'].includes(roleParam) ? roleParam : 'all') as CmRole | 'all'
  const isActive: boolean | 'all' =
    statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'

  const result = listUsers({ search, role, isActive, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown; role?: unknown; avatar?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido. Se esperaba JSON.' }, { status: 400 })
  }

  const { name, email, password, role, avatar } = body
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'name, email y password son obligatorios.' }, { status: 400 })
  }

  const validRoles: CmRole[] = ['admin', 'cocinero', 'supervisor']
  const userRole: CmRole = validRoles.includes(role as CmRole) ? (role as CmRole) : 'cocinero'

  try {
    const user = createUser({
      name,
      email,
      password,
      role: userRole,
      avatar: typeof avatar === 'string' ? avatar : null,
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear usuario'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
