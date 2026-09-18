/**
 * ============================================================
 * API — SuperAdmin Dashboard (global KPIs + per-owner breakdown)
 * ============================================================
 * GET /api/cocina-movil/superadmin/dashboard
 *
 * Returns:
 *  - globalKpis: aggregated totals across ALL owners (always global)
 *  - owners: list of admin users (id, name) for the owner selector in modules
 *  - perOwner: per-owner breakdown (sales, recipes, places, productions, etc.)
 *
 * The dashboard always shows global data. Per-owner filtering happens in
 * each module page (Clientes, Recetas, Ventas, etc.) via their own selectors.
 *
 * Only SuperAdmin can access this endpoint.
 * ============================================================
 */
import { NextResponse } from 'next/server'
import { listUsers } from '@/lib/cocina-movil/users'
import { listPlaces } from '@/lib/cocina-movil/places'
import { listIngredients } from '@/lib/cocina-movil/ingredients'
import { listSupplies } from '@/lib/cocina-movil/supplies'
import { listSuppliers } from '@/lib/cocina-movil/suppliers'
import { listRecipes } from '@/lib/cocina-movil/recipes'
import { listProductions } from '@/lib/cocina-movil/productions'
import { listBudgets } from '@/lib/cocina-movil/budgets'
import { listSales } from '@/lib/cocina-movil/sales'
import { listPurchases } from '@/lib/cocina-movil/purchases'
import { listClients } from '@/lib/cocina-movil/clients'
import { requireSuperAdmin } from '@/lib/cocina-movil/auth-middleware'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = requireSuperAdmin(request)
  if (!auth.authorized) return auth.response!

  // Dashboard always shows global totals across all owners.
  // (Per-owner filtering happens in each module page, not here.)
  const [
    usersData, placesData, ingredientsData, suppliesData, suppliersData,
    recipesData, productionsData, budgetsData, salesData, purchasesData,
    clientsData,
  ] = await Promise.all([
    Promise.resolve(listUsers({ pageSize: 1000 })),
    Promise.resolve(listPlaces({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listIngredients({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listSupplies({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listSuppliers({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listRecipes({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listProductions({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listBudgets({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listSales({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listPurchases({ pageSize: 1000, ownerId: 'all' })),
    Promise.resolve(listClients({ pageSize: 1000, ownerId: 'all' })),
  ])

  const users = usersData.users
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin')

  const places = placesData.places
  const ingredients = ingredientsData.ingredients
  const supplies = suppliesData.supplies
  const suppliers = suppliersData.suppliers
  const recipes = recipesData.recipes
  const productions = productionsData.productions
  const budgets = budgetsData.budgets
  const sales = salesData.sales
  const purchases = purchasesData.purchases
  const clients = clientsData.clients

  const globalKpis = {
    totalAdmins: adminUsers.length,
    activeAdmins: adminUsers.filter((u) => u.isActive).length,
    totalPlaces: places.length,
    totalIngredients: ingredients.length,
    totalSupplies: supplies.length,
    totalSuppliers: suppliers.length,
    totalRecipes: recipes.length,
    totalProductions: productions.length,
    pendingProductions: productions.filter((p) => p.status === 'pending').length,
    totalBudgets: budgets.length,
    totalSales: sales.length,
    totalSalesAmount: sales.reduce((sum, s) => sum + s.totalPrice, 0),
    totalSalesProfit: sales.reduce((sum, s) => sum + s.profit, 0),
    totalPurchases: purchases.length,
    totalPurchasesAmount: purchases.reduce((sum, p) => sum + p.total, 0),
    totalClients: clients.length,
  }

  // Per-owner breakdown — computed across all owners for the comparison table.
  const ownerMap = new Map<string, {
    ownerId: string
    ownerName: string
    ownerEmail: string
    places: number
    ingredients: number
    supplies: number
    suppliers: number
    recipes: number
    productions: number
    budgets: number
    sales: number
    salesAmount: number
    salesProfit: number
    purchases: number
    purchasesAmount: number
    clients: number
  }>()

  // Initialize owner entries from admin users (so even owners with 0 data appear)
  for (const u of adminUsers) {
    ownerMap.set(u.id, {
      ownerId: u.id,
      ownerName: `${u.firstName} ${u.lastName}`.trim(),
      ownerEmail: u.email,
      places: 0, ingredients: 0, supplies: 0, suppliers: 0,
      recipes: 0, productions: 0, budgets: 0,
      sales: 0, salesAmount: 0, salesProfit: 0,
      purchases: 0, purchasesAmount: 0, clients: 0,
    })
  }

  // Tally (using the all-owners data)
  for (const p of places) { const e = ownerMap.get(p.ownerId); if (e) e.places++ }
  for (const i of ingredients) { const e = ownerMap.get(i.ownerId); if (e) e.ingredients++ }
  for (const s of supplies) { const e = ownerMap.get(s.ownerId); if (e) e.supplies++ }
  for (const s of suppliers) { const e = ownerMap.get(s.ownerId); if (e) e.suppliers++ }
  for (const r of recipes) { const e = ownerMap.get(r.ownerId); if (e) e.recipes++ }
  for (const p of productions) { const e = ownerMap.get(p.ownerId); if (e) e.productions++ }
  for (const b of budgets) { const e = ownerMap.get(b.ownerId); if (e) e.budgets++ }
  for (const s of sales) {
    const e = ownerMap.get(s.ownerId)
    if (e) { e.sales++; e.salesAmount += s.totalPrice; e.salesProfit += s.profit }
  }
  for (const p of purchases) {
    const e = ownerMap.get(p.ownerId)
    if (e) { e.purchases++; e.purchasesAmount += p.total }
  }
  for (const c of clients) { const e = ownerMap.get(c.ownerId); if (e) e.clients++ }

  const perOwner = Array.from(ownerMap.values())

  return NextResponse.json({
    globalKpis,
    owners: adminUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role,
      isActive: u.isActive,
    })),
    perOwner,
  })
}
