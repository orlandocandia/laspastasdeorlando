import { NextResponse } from 'next/server'
import { getBudgetById, setBudgetStatus } from '@/lib/cocina-movil/budgets'
import { createClientOrder } from '@/lib/cocina-movil/client-orders'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  const { id } = await params

  const budget = getBudgetById(id)
  if (!budget) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  if (budget.status === 'aprobado' && budget.clientOrderId) {
    return NextResponse.json({ error: 'El presupuesto ya fue convertido en pedido' }, { status: 400 })
  }

  // Create client order from budget items
  const order = createClientOrder({
    clientName: budget.clientName,
    orderDate: Date.now(),
    observations: `Generado desde presupuesto de ${budget.clientName || 'cliente'}`,
    items: budget.items.map((it) => ({
      recipeId: it.recipeId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    budgetId: budget.id,
    budgetNumber: budget.budgetNumber || budget.id,
  })

  // Mark budget as approved + link order
  setBudgetStatus(budget.id, 'aprobado')

  return NextResponse.json({ order, budgetId: budget.id }, { status: 201 })
}
