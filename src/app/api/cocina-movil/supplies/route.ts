import { NextResponse } from 'next/server'
import { listSupplies, createSupply, type CmSupplyCategory, type CmSupplyUnit, type CmPurchaseUnitType, type CmMeasureUnit, type CmUsageUnit, type CmSupplyInput } from '@/lib/cocina-movil/supplies'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const catParam = url.searchParams.get('category') || 'all'
  const statusParam = url.searchParams.get('isActive') || 'all'
  const sortBy = (url.searchParams.get('sortBy') as 'name' | 'purchasePrice' | 'createdAt') || 'name'
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10)))
  const validCats: CmSupplyCategory[] = ['envases','limpieza','descartables','otros']
  const category = validCats.includes(catParam as CmSupplyCategory) ? catParam as CmSupplyCategory : 'all'
  const isActive = statusParam === 'true' ? true : statusParam === 'false' ? false : 'all'
  const result = listSupplies({ search, category, isActive, sortBy, sortOrder, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  if (typeof body.name !== 'string' || !body.name.trim()) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 })
  const validUnits: CmSupplyUnit[] = ['u','m','kg','paquete','caja','rollo']
  const validCats: CmSupplyCategory[] = ['envases','limpieza','descartables','otros']
  const validPTypes: CmPurchaseUnitType[] = ['unidad', 'caja', 'paquete', 'rollo', 'kg_suelto', 'metro_suelto']
  const validMUnits: CmMeasureUnit[] = ['u', 'm', 'kg', 'cm', 'g']
  const validUUnits: CmUsageUnit[] = ['u', 'g', 'cm']
  const input: CmSupplyInput = {
    name: body.name,
    description: typeof body.description === 'string' ? body.description : null,
    category: validCats.includes(body.category as CmSupplyCategory) ? body.category as CmSupplyCategory : null,
    purchaseUnit: validUnits.includes(body.purchaseUnit as CmSupplyUnit) ? body.purchaseUnit as CmSupplyUnit : 'u',
    purchasePrice: typeof body.purchasePrice === 'number' ? body.purchasePrice : 0,
    purchaseUnitType: validPTypes.includes(body.purchaseUnitType as CmPurchaseUnitType) ? body.purchaseUnitType as CmPurchaseUnitType : null,
    unitsPurchased: typeof body.unitsPurchased === 'number' ? body.unitsPurchased : null,
    measurePerUnit: typeof body.measurePerUnit === 'number' ? body.measurePerUnit : null,
    measureUnit: validMUnits.includes(body.measureUnit as CmMeasureUnit) ? body.measureUnit as CmMeasureUnit : null,
    totalPrice: typeof body.totalPrice === 'number' ? body.totalPrice : null,
    usageUnit: validUUnits.includes(body.usageUnit as CmUsageUnit) ? body.usageUnit as CmUsageUnit : null,
    equivalenceValue: typeof body.equivalenceValue === 'number' ? body.equivalenceValue : null,
    equivalenceUnit: validUUnits.includes(body.equivalenceUnit as CmUsageUnit) ? body.equivalenceUnit as CmUsageUnit : null,
    image: typeof body.image === 'string' ? body.image : null,
    supplierId: typeof body.supplierId === 'string' ? body.supplierId : null,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
  }
  try {
    const sup = createSupply(input)
    return NextResponse.json({ supply: sup }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear' }, { status: 400 })
  }
}
