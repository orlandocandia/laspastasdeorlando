/**
 * ============================================================
 * API — Cambiar contraseña de un usuario
 * ============================================================
 * PUT /api/cocina-movil/users/[id]/password { newPassword }
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { changeUserPassword } from '@/lib/cocina-movil/users'

export const runtime = 'nodejs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: { newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const { newPassword } = body
  if (typeof newPassword !== 'string' || !newPassword.trim()) {
    return NextResponse.json({ error: 'La nueva contraseña es obligatoria.' }, { status: 400 })
  }

  try {
    const ok = changeUserPassword(id, newPassword)
    if (!ok) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, message: 'Contraseña actualizada' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al cambiar contraseña'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
