import { NextResponse } from 'next/server'
import { listClients, createClient, type CmClientInput } from '@/lib/cocina-movil/clients'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const statusParam = url.searchParams.get('isActive') || 'all'
  const isActive = statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'
  const sortBy = (url.searchParams.get('sortBy') as 'fullName' | 'createdAt') || 'fullName'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const result = listClients({ search, isActive, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.firstName !== 'string' || !body.firstName.trim()) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 })
  if (typeof body.lastName !== 'string' || !body.lastName.trim()) return NextResponse.json({ error: 'El apellido es obligatorio.' }, { status: 400 })
  const input: CmClientInput = {
    firstName: body.firstName,
    lastName: body.lastName,
    dni: typeof body.dni === 'string' ? body.dni : null,
    phone: typeof body.phone === 'string' ? body.phone : null,
    email: typeof body.email === 'string' ? body.email : null,
    address: typeof body.address === 'string' ? body.address : null,
    city: typeof body.city === 'string' ? body.city : null,
    birthDate: typeof body.birthDate === 'number' ? body.birthDate : null,
    notes: typeof body.notes === 'string' ? body.notes : null,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
  }
  try {
    const client = createClient(input)
    return NextResponse.json({ client }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear cliente' }, { status: 400 })
  }
}
