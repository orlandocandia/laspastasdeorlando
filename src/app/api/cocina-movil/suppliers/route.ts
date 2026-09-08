import { NextResponse } from 'next/server'
import { listSuppliers, createSupplier, type CmSupplierInput } from '@/lib/cocina-movil/suppliers'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const statusParam = url.searchParams.get('isActive') || 'all'
  const sortBy = (url.searchParams.get('sortBy') as 'name' | 'createdAt') || 'name'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const isActive = statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'
  const result = listSuppliers({ search, isActive, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.name !== 'string' || !body.name.trim()) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 })
  const input: CmSupplierInput = {
    name: body.name,
    contactName: typeof body.contactName === 'string' ? body.contactName : null,
    phone: typeof body.phone === 'string' ? body.phone : null,
    email: typeof body.email === 'string' ? body.email : null,
    address: typeof body.address === 'string' ? body.address : null,
    country: typeof body.country === 'string' ? body.country : null,
    province: typeof body.province === 'string' ? body.province : null,
    department: typeof body.department === 'string' ? body.department : null,
    municipality: typeof body.municipality === 'string' ? body.municipality : null,
    location: typeof body.location === 'string' ? body.location : null,
    image: typeof body.image === 'string' ? body.image : null,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
  }
  try {
    const sup = createSupplier(input)
    return NextResponse.json({ supplier: sup }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear' }, { status: 400 })
  }
}
