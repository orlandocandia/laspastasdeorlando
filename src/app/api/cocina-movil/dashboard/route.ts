/**
 * ============================================================
 * API — Dashboard de la Cocina Móvil
 * ============================================================
 * GET /api/cocina-movil/dashboard
 *
 * Agrega KPIs de todos los módulos:
 *  - Total usuarios (activos/inactivos)
 *  - Total lugares (activos/inactivos)
 *  - Total materias primas
 *  - Total insumos
 *  - Total proveedores
 *  - Total recetas
 *  - Total producciones (por estado: pendientes/confirmadas/rechazadas)
 *  - Total presupuestos (por estado)
 *  - Total ventas + monto total + ganancia total
 *  - Total compras + monto total
 *  - Lugar más activo (con más producciones)
 *  - Recetas más vendidas (top 3)
 *  - Usuarios recientes (últimos 5)
 *  - Ventas recientes (últimas 5)
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

export const runtime = 'nodejs'

export async function GET() {
  // Fetch all data in parallel
  const [
    usersData, placesData, ingredientsData, suppliesData, suppliersData,
    recipesData, productionsData, budgetsData, salesData, purchasesData,
  ] = await Promise.all([
    Promise.resolve(listUsers({ pageSize: 1000 })),
    Promise.resolve(listPlaces({ pageSize: 1000 })),
    Promise.resolve(listIngredients({ pageSize: 1000 })),
    Promise.resolve(listSupplies({ pageSize: 1000 })),
    Promise.resolve(listSuppliers({ pageSize: 1000 })),
    Promise.resolve(listRecipes({ pageSize: 1000 })),
    Promise.resolve(listProductions({ pageSize: 1000 })),
    Promise.resolve(listBudgets({ pageSize: 1000 })),
    Promise.resolve(listSales({ pageSize: 1000 })),
    Promise.resolve(listPurchases({ pageSize: 1000 })),
  ])

  const users = usersData.users
  const places = placesData.places
  const recipes = recipesData.recipes
  const productions = productionsData.productions
  const budgets = budgetsData.budgets
  const sales = salesData.sales
  const purchases = purchasesData.purchases

  // Calculate KPIs
  const activeUsers = users.filter((u) => u.isActive).length
  const inactiveUsers = users.length - activeUsers

  const activePlaces = places.filter((p) => p.isActive).length

  const pendingProductions = productions.filter((p) => p.status === 'pending').length
  const confirmedProductions = productions.filter((p) => p.status === 'confirmed').length
  const rejectedProductions = productions.filter((p) => p.status === 'rejected').length

  const borradorBudgets = budgets.filter((b) => b.status === 'borrador').length
  const enviadoBudgets = budgets.filter((b) => b.status === 'enviado').length
  const aprobadoBudgets = budgets.filter((b) => b.status === 'aprobado').length
  const rechazadoBudgets = budgets.filter((b) => b.status === 'rechazado').length

  const totalSalesAmount = sales.reduce((sum, s) => sum + s.totalPrice, 0)
  const totalSalesProfit = sales.reduce((sum, s) => sum + s.profit, 0)
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.total, 0)

  // Lugar más activo (con más producciones)
  const placeCount = new Map<string, number>()
  productions.forEach((p) => {
    placeCount.set(p.placeName, (placeCount.get(p.placeName) || 0) + 1)
  })
  let lugarMasActivo = 'Sin datos'
  let maxCount = 0
  placeCount.forEach((count, name) => {
    if (count > maxCount) {
      maxCount = count
      lugarMasActivo = name
    }
  })

  // Recetas más vendidas (top 3 by quantity)
  const recipeSales = new Map<string, { title: string; quantity: number; total: number }>()
  sales.forEach((s) => {
    const existing = recipeSales.get(s.recipeId)
    if (existing) {
      existing.quantity += s.quantity
      existing.total += s.totalPrice
    } else {
      recipeSales.set(s.recipeId, { title: s.recipeTitle, quantity: s.quantity, total: s.totalPrice })
    }
  })
  const topRecipes = Array.from(recipeSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)

  // Usuarios recientes (últimos 5, sorted by createdAt desc)
  const recentUsers = users
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
    }))

  // Ventas recientes (últimas 5)
  const recentSales = sales
    .sort((a, b) => b.saleDate - a.saleDate)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber,
      recipeTitle: s.recipeTitle,
      quantity: s.quantity,
      totalPrice: s.totalPrice,
      saleDate: s.saleDate,
    }))

  return NextResponse.json({
    kpis: {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      totalPlaces: places.length,
      activePlaces,
      totalIngredients: ingredientsData.total,
      totalSupplies: suppliesData.total,
      totalSuppliers: suppliersData.total,
      totalRecipes: recipes.length,
      totalProductions: productions.length,
      pendingProductions,
      confirmedProductions,
      rejectedProductions,
      totalBudgets: budgets.length,
      borradorBudgets,
      enviadoBudgets,
      aprobadoBudgets,
      rechazadoBudgets,
      totalSales: sales.length,
      totalSalesAmount,
      totalSalesProfit,
      totalPurchases: purchases.length,
      totalPurchasesAmount,
      lugarMasActivo,
    },
    topRecipes,
    recentUsers,
    recentSales,
  })
}
