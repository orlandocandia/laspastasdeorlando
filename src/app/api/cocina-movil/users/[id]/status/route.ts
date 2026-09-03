/**
 * ============================================================
 * API — Activar/Desactivar usuario
 * ============================================================
 * PUT /api/cocina-movil/users/[id]/status { isActive: boolean }
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { setUserStatus } from '@/lib/cocina-movil/users'

export const runtime = 'nodejs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: { isActive?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const { isActive } = body
  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive debe ser true o false.' }, { status: 400 })
  }

  const user = setUserStatus(id, isActive)
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }
  return NextResponse.json({ user })
}
