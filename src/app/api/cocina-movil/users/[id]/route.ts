/**
 * ============================================================
 * API — Usuario individual de la Cocina Móvil
 * ============================================================
 * GET    /api/cocina-movil/users/[id]
 * PUT    /api/cocina-movil/users/[id]
 * DELETE /api/cocina-movil/users/[id]
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { getUserById, updateUser, deleteUser, type CmRole, type CmGender, type CmMaritalStatus } from '@/lib/cocina-movil/users'

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
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  // String fields
  for (const key of ['firstName', 'lastName', 'email', 'dni', 'avatar', 'address', 'country', 'province', 'department', 'municipality', 'location']) {
    if (body[key] !== undefined) {
      updates[key] = typeof body[key] === 'string' ? body[key] : null
    }
  }
  // birthDate (number)
  if (body.birthDate !== undefined) {
    updates.birthDate = typeof body.birthDate === 'number' ? body.birthDate : null
  }
  // gender
  if (body.gender !== undefined) {
    updates.gender = (['masculino', 'femenino', 'otro'].includes(body.gender as string) ? body.gender : null) as CmGender
  }
  // maritalStatus
  if (body.maritalStatus !== undefined) {
    updates.maritalStatus = (['soltero', 'casado', 'divorciado', 'viudo'].includes(body.maritalStatus as string) ? body.maritalStatus : null) as CmMaritalStatus
  }
  // role
  if (body.role !== undefined) {
    const validRoles: CmRole[] = ['admin', 'cocinero', 'supervisor']
    if (validRoles.includes(body.role as CmRole)) {
      updates.role = body.role as CmRole
    }
  }

  try {
    const user = updateUser(id, updates as Parameters<typeof updateUser>[1])
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
