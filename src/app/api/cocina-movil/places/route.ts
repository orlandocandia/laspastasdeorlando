import { NextResponse } from 'next/server'
import { listPlaces, createPlace, type CmPlaceInput } from '@/lib/cocina-movil/places'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const statusParam = url.searchParams.get('isActive') || 'all'
  const sortBy = (url.searchParams.get('sortBy') as 'name' | 'createdAt' | 'rentCost') || 'name'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))

  const isActive: boolean | 'all' =
    statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'

  const result = listPlaces({ search, isActive, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  if (typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 })
  }

  const input: CmPlaceInput = {
    name: body.name,
    description: typeof body.description === 'string' ? body.description : null,
    contactName: typeof body.contactName === 'string' ? body.contactName : null,
    contactPhone: typeof body.contactPhone === 'string' ? body.contactPhone : null,
    contactEmail: typeof body.contactEmail === 'string' ? body.contactEmail : null,
    address: typeof body.address === 'string' ? body.address : null,
    country: typeof body.country === 'string' ? body.country : null,
    province: typeof body.province === 'string' ? body.province : null,
    department: typeof body.department === 'string' ? body.department : null,
    municipality: typeof body.municipality === 'string' ? body.municipality : null,
    location: typeof body.location === 'string' ? body.location : null,
    image: typeof body.image === 'string' ? body.image : null,
    isOwned: typeof body.isOwned === 'boolean' ? body.isOwned : true,
    rentCost: typeof body.rentCost === 'number' ? body.rentCost : null,
    utilityCost: typeof body.utilityCost === 'number' ? body.utilityCost : null,
    otherFixedCosts: typeof body.otherFixedCosts === 'number' ? body.otherFixedCosts : null,
  }

  try {
    const place = createPlace(input)
    return NextResponse.json({ place }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear lugar' }, { status: 400 })
  }
}
