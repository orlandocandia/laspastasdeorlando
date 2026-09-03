/**
 * ============================================================
 * API — Usuario individual de la Cocina Móvil
 * ============================================================
 * PUT    /api/cocina-movil/users/[id] { name?, email?, role?, avatar? }
 * DELETE /api/cocina-movil/users/[id]
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { getUserById, updateUser, deleteUser, type CmRole } from '@/lib/cocina-movil/users'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = getUserById(id)
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }
  return NextResponse.json({ user })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: { name?: unknown; email?: unknown; role?: unknown; avatar?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const updates: {
    name?: string
    email?: string
    role?: CmRole
    avatar?: string | null
  } = {}

  if (typeof body.name === 'string') updates.name = body.name
  if (typeof body.email === 'string') updates.email = body.email
  if (typeof body.role === 'string') {
    const validRoles: CmRole[] = ['admin', 'cocinero', 'supervisor']
    if (validRoles.includes(body.role as CmRole)) {
      updates.role = body.role as CmRole
    }
  }
  if (body.avatar !== undefined) {
    updates.avatar = typeof body.avatar === 'string' ? body.avatar : null
  }

  try {
    const user = updateUser(id, updates)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ user })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar usuario'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const ok = deleteUser(id)
    if (!ok) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, message: 'Usuario eliminado' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar usuario'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
