/**
 * ============================================================
 * Cocina Móvil — SuperAdmin supervision logic
 * ============================================================
 * Functions to compute global stats, per-admin breakdowns,
 * rankings, and recent activity across all admins.
 * ============================================================
 */

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

export interface AdminDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  avatar: string | null
  createdAt: number
  lastLoginAt: number | null
}

export interface AdminStats {
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
}

export interface AdminActivity {
  type: 'sale' | 'production' | 'recipe' | 'budget' | 'purchase' | 'client'
  description: string
  timestamp: number
  ownerName: string
}

export interface RankingEntry {
  ownerId: string
  ownerName: string
  ownerEmail: string
  value: number
  label: string
}

/**
 * Gets detailed info about a specific admin user.
 */
export function getAdminDetail(adminId: string): AdminDetail | null {
  const { users } = listUsers({ pageSize: 1000 })
  const u = users.find((x) => x.id === adminId && (x.role === 'admin' || x.role === 'superadmin'))
  if (!u) return null
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    avatar: u.avatar,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }
}

/**
 * Gets stats for a specific admin (filtered by ownerId).
 */
export function getAdminStats(adminId: string): AdminStats {
  const places = listPlaces({ pageSize: 1000, ownerId: adminId }).places
  const ingredients = listIngredients({ pageSize: 1000, ownerId: adminId }).ingredients
  const supplies = listSupplies({ pageSize: 1000, ownerId: adminId }).supplies
  const suppliers = listSuppliers({ pageSize: 1000, ownerId: adminId }).suppliers
  const recipes = listRecipes({ pageSize: 1000, ownerId: adminId }).recipes
  const productions = listProductions({ pageSize: 1000, ownerId: adminId }).productions
  const budgets = listBudgets({ pageSize: 1000, ownerId: adminId }).budgets
  const sales = listSales({ pageSize: 1000, ownerId: adminId }).sales
  const purchases = listPurchases({ pageSize: 1000, ownerId: adminId }).purchases
  const clients = listClients({ pageSize: 1000, ownerId: adminId }).clients

  return {
    places: places.length,
    ingredients: ingredients.length,
    supplies: supplies.length,
    suppliers: suppliers.length,
    recipes: recipes.length,
    productions: productions.length,
    budgets: budgets.length,
    sales: sales.length,
    salesAmount: sales.reduce((sum, s) => sum + s.totalPrice, 0),
    salesProfit: sales.reduce((sum, s) => sum + s.profit, 0),
    purchases: purchases.length,
    purchasesAmount: purchases.reduce((sum, p) => sum + p.total, 0),
    clients: clients.length,
  }
}

/**
 * Gets recent activity for a specific admin (last 10 actions).
 */
export function getAdminActivity(adminId: string): AdminActivity[] {
  const ownerName = (() => {
    const detail = getAdminDetail(adminId)
    return detail ? `${detail.firstName} ${detail.lastName}`.trim() : 'Admin'
  })()

  const activities: AdminActivity[] = []

  // Sales
  const sales = listSales({ pageSize: 1000, ownerId: adminId }).sales
  for (const s of sales) {
    activities.push({
      type: 'sale',
      description: `Vendió ${s.quantity}x ${s.recipeTitle} por $${s.totalPrice.toLocaleString('es-AR')}`,
      timestamp: s.saleDate,
      ownerName,
    })
  }

  // Productions
  const productions = listProductions({ pageSize: 1000, ownerId: adminId }).productions
  for (const p of productions) {
    activities.push({
      type: 'production',
      description: `Produjo ${p.quantity} porciones de ${p.recipeTitle}`,
      timestamp: p.productionDate,
      ownerName,
    })
  }

  // Recipes
  const recipes = listRecipes({ pageSize: 1000, ownerId: adminId }).recipes
  for (const r of recipes) {
    activities.push({
      type: 'recipe',
      description: `Creó la receta "${r.title}"`,
      timestamp: r.createdAt,
      ownerName,
    })
  }

  // Budgets
  const budgets = listBudgets({ pageSize: 1000, ownerId: adminId }).budgets
  for (const b of budgets) {
    activities.push({
      type: 'budget',
      description: `Generó presupuesto por $${b.total.toLocaleString('es-AR')}`,
      timestamp: b.createdAt,
      ownerName,
    })
  }

  // Purchases
  const purchases = listPurchases({ pageSize: 1000, ownerId: adminId }).purchases
  for (const p of purchases) {
    activities.push({
      type: 'purchase',
      description: `Registró compra por $${p.total.toLocaleString('es-AR')}`,
      timestamp: p.createdAt,
      ownerName,
    })
  }

  // Clients
  const clients = listClients({ pageSize: 1000, ownerId: adminId }).clients
  for (const c of clients) {
    activities.push({
      type: 'client',
      description: `Agregó cliente "${c.firstName} ${c.lastName}"`,
      timestamp: c.createdAt,
      ownerName,
    })
  }

  // Sort by timestamp desc, take first 10
  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
}

/**
 * Gets global recent activity across ALL admins (last 10).
 */
export function getGlobalActivity(): AdminActivity[] {
  const { users } = listUsers({ pageSize: 1000 })
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin')
  const allActivities: AdminActivity[] = []

  for (const admin of adminUsers) {
    const activities = getAdminActivity(admin.id)
    allActivities.push(...activities)
  }

  return allActivities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
}

/**
 * Gets ranking of admins by different metrics (top 5).
 */
export function getRankings(): {
  bySales: RankingEntry[]
  byProductions: RankingEntry[]
  byRecipes: RankingEntry[]
} {
  const { users } = listUsers({ pageSize: 1000 })
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin')

  const entries: Array<{
    ownerId: string
    ownerName: string
    ownerEmail: string
    salesAmount: number
    productions: number
    recipes: number
  }> = []

  for (const admin of adminUsers) {
    const stats = getAdminStats(admin.id)
    entries.push({
      ownerId: admin.id,
      ownerName: `${admin.firstName} ${admin.lastName}`.trim(),
      ownerEmail: admin.email,
      salesAmount: stats.salesAmount,
      productions: stats.productions,
      recipes: stats.recipes,
    })
  }

  const bySales = [...entries]
    .sort((a, b) => b.salesAmount - a.salesAmount)
    .slice(0, 5)
    .map((e) => ({ ownerId: e.ownerId, ownerName: e.ownerName, ownerEmail: e.ownerEmail, value: e.salesAmount, label: 'ventas' }))

  const byProductions = [...entries]
    .sort((a, b) => b.productions - a.productions)
    .slice(0, 5)
    .map((e) => ({ ownerId: e.ownerId, ownerName: e.ownerName, ownerEmail: e.ownerEmail, value: e.productions, label: 'producciones' }))

  const byRecipes = [...entries]
    .sort((a, b) => b.recipes - a.recipes)
    .slice(0, 5)
    .map((e) => ({ ownerId: e.ownerId, ownerName: e.ownerName, ownerEmail: e.ownerEmail, value: e.recipes, label: 'recetas' }))

  return { bySales, byProductions, byRecipes }
}

/**
 * Gets global report data for export.
 */
export function getGlobalReport(): {
  admins: Array<{
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    stats: AdminStats
  }>
  totals: AdminStats
} {
  const { users } = listUsers({ pageSize: 1000 })
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin')

  const admins = adminUsers.map((admin) => ({
    id: admin.id,
    name: `${admin.firstName} ${admin.lastName}`.trim(),
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
    stats: getAdminStats(admin.id),
  }))

  const totals: AdminStats = {
    places: admins.reduce((s, a) => s + a.stats.places, 0),
    ingredients: admins.reduce((s, a) => s + a.stats.ingredients, 0),
    supplies: admins.reduce((s, a) => s + a.stats.supplies, 0),
    suppliers: admins.reduce((s, a) => s + a.stats.suppliers, 0),
    recipes: admins.reduce((s, a) => s + a.stats.recipes, 0),
    productions: admins.reduce((s, a) => s + a.stats.productions, 0),
    budgets: admins.reduce((s, a) => s + a.stats.budgets, 0),
    sales: admins.reduce((s, a) => s + a.stats.sales, 0),
    salesAmount: admins.reduce((s, a) => s + a.stats.salesAmount, 0),
    salesProfit: admins.reduce((s, a) => s + a.stats.salesProfit, 0),
    purchases: admins.reduce((s, a) => s + a.stats.purchases, 0),
    purchasesAmount: admins.reduce((s, a) => s + a.stats.purchasesAmount, 0),
    clients: admins.reduce((s, a) => s + a.stats.clients, 0),
  }

  return { admins, totals }
}
