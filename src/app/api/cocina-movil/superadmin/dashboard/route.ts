/**
 * ============================================================
 * API — SuperAdmin Dashboard (global KPIs + per-owner breakdown)
 * ============================================================
 * GET /api/cocina-movil/superadmin/dashboard
 *
 * Returns:
 *  - globalKpis: aggregated totals across ALL owners
 *  - owners: list of admin users (id, name) for the owner selector
 *  - perOwner: per-owner breakdown (sales, recipes, places, productions, etc.)
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

  // Fetch ALL data (ownerId = 'all') for global aggregation
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

  // Global KPIs (sum of all owners)
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

  // Per-owner breakdown
  // Group all data by ownerId and compute counts per owner
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

  // Tally places
  for (const p of places) {
    const entry = ownerMap.get(p.ownerId)
    if (entry) entry.places++
  }
  // Tally ingredients
  for (const i of ingredients) {
    const entry = ownerMap.get(i.ownerId)
    if (entry) entry.ingredients++
  }
  // Tally supplies
  for (const s of supplies) {
    const entry = ownerMap.get(s.ownerId)
    if (entry) entry.supplies++
  }
  // Tally suppliers
  for (const s of suppliers) {
    const entry = ownerMap.get(s.ownerId)
    if (entry) entry.suppliers++
  }
  // Tally recipes
  for (const r of recipes) {
    const entry = ownerMap.get(r.ownerId)
    if (entry) entry.recipes++
  }
  // Tally productions
  for (const p of productions) {
    const entry = ownerMap.get(p.ownerId)
    if (entry) entry.productions++
  }
  // Tally budgets
  for (const b of budgets) {
    const entry = ownerMap.get(b.ownerId)
    if (entry) entry.budgets++
  }
  // Tally sales
  for (const s of sales) {
    const entry = ownerMap.get(s.ownerId)
    if (entry) {
      entry.sales++
      entry.salesAmount += s.totalPrice
      entry.salesProfit += s.profit
    }
  }
  // Tally purchases
  for (const p of purchases) {
    const entry = ownerMap.get(p.ownerId)
    if (entry) {
      entry.purchases++
      entry.purchasesAmount += p.total
    }
  }
  // Tally clients
  for (const c of clients) {
    const entry = ownerMap.get(c.ownerId)
    if (entry) entry.clients++
  }

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
