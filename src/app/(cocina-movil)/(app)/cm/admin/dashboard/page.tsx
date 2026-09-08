'use client'

/**
 * ============================================================
 * Dashboard del Administrador — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/dashboard
 *
 * Muestra KPIs agregados de todos los módulos:
 *  - Usuarios, Lugares, Materias Primas, Insumos, Proveedores
 *  - Recetas, Producciones, Presupuestos, Ventas, Compras
 *  - Top recetas más vendidas
 *  - Usuarios recientes
 *  - Ventas recientes
 *  - Acciones rápidas
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Users, ChefHat, Factory, MapPin, Plus, ArrowRight, Activity,
  Package, FlaskConical, Building2, ShoppingCart, Receipt,
  FileText, DollarSign, TrendingUp, TrendingDown, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/cocina-movil/users'

interface DashboardData {
  kpis: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    totalPlaces: number
    activePlaces: number
    totalIngredients: number
    totalSupplies: number
    totalSuppliers: number
    totalRecipes: number
    totalProductions: number
    pendingProductions: number
    confirmedProductions: number
    rejectedProductions: number
    totalBudgets: number
    borradorBudgets: number
    enviadoBudgets: number
    aprobadoBudgets: number
    rechazadoBudgets: number
    totalSales: number
    totalSalesAmount: number
    totalSalesProfit: number
    totalPurchases: number
    totalPurchasesAmount: number
    lugarMasActivo: string
  }
  topRecipes: Array<{ title: string; quantity: number; total: number }>
  recentUsers: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    isActive: boolean
    lastLoginAt: number | null
  }>
  recentSales: Array<{
    id: string
    ticketNumber: string
    recipeTitle: string
    quantity: number
    totalPrice: number
    saleDate: number
  }>
}

export default function CmAdminDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cocina-movil/dashboard')
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('[Dashboard] Error:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E1AD01] border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[#B91C1C]">Error al cargar el dashboard: {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-3 border-[#5C3A21]/20 text-[#5C3A21]">
          Reintentar
        </Button>
      </div>
    )
  }

  if (!data) return null
  const k = data.kpis

  const fmtCurrency = (v: number) => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
  const fmtDate = (ts: number) => {
    const d = new Date(ts)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  // KPI cards (4 main + 4 secondary)
  const mainKpis = [
    { label: 'Total Ventas', value: k.totalSales.toString(), sub: fmtCurrency(k.totalSalesAmount), icon: Receipt, color: 'bg-[#708238] text-[#FFF8E7]', iconBg: 'bg-[#708238]/20 text-[#708238]' },
    { label: 'Ganancia Total', value: fmtCurrency(k.totalSalesProfit), sub: `${k.totalSales} ventas`, icon: TrendingUp, color: 'bg-[#E1AD01]/10 text-[#7a5c00]', iconBg: 'bg-[#E1AD01]/20 text-[#7a5c00]' },
    { label: 'Producciones', value: k.totalProductions.toString(), sub: `${k.pendingProductions} pendientes`, icon: Factory, color: 'bg-[#5C3A21]/10 text-[#5C3A21]', iconBg: 'bg-[#5C3A21]/20 text-[#5C3A21]' },
    { label: 'Recetas', value: k.totalRecipes.toString(), sub: `${k.totalIngredients} materias primas`, icon: ChefHat, color: 'bg-[#B91C1C]/10 text-[#B91C1C]', iconBg: 'bg-[#B91C1C]/20 text-[#B91C1C]' },
  ]

  const secondaryKpis = [
    { label: 'Usuarios', value: k.totalUsers, sub: `${k.activeUsers} activos`, icon: Users, href: '/cm/admin/users' },
    { label: 'Lugares', value: k.totalPlaces, sub: `${k.activePlaces} activos`, icon: MapPin, href: '/cm/admin/lugares' },
    { label: 'Proveedores', value: k.totalSuppliers, sub: 'proveedores', icon: Building2, href: '/cm/admin/proveedores' },
    { label: 'Compras', value: k.totalPurchases, sub: fmtCurrency(k.totalPurchasesAmount), icon: ShoppingCart, href: '/cm/admin/compras' },
    { label: 'Presupuestos', value: k.totalBudgets, sub: `${k.borradorBudgets} borradores`, icon: FileText, href: '/cm/admin/presupuestos' },
    { label: 'Materias Primas', value: k.totalIngredients, sub: 'ingredientes', icon: Package, href: '/cm/admin/materias-primas' },
    { label: 'Insumos', value: k.totalSupplies, sub: 'insumos', icon: FlaskConical, href: '/cm/admin/insumos' },
    { label: 'Lugar más activo', value: k.lugarMasActivo, sub: 'producciones', icon: MapPin, href: '/cm/admin/lugares' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21]">Dashboard</h1>
          <p className="text-sm text-[#8A7E70]">Resumen general de la Cocina Móvil</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
            <Link href="/cm/admin/ventas?action=new"><Plus className="h-4 w-4" />Nueva Venta</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <Link href="/cm/admin/producciones"><Factory className="h-4 w-4" />Producciones</Link>
          </Button>
        </div>
      </div>

      {/* Main KPIs (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-[#5C3A21]/10 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#5C3A21]">{kpi.value}</p>
                <p className="text-xs text-[#8A7E70] mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-[#8A7E70]/70 mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Secondary KPIs (compact grid) */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Resumen de Módulos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {secondaryKpis.map((sk) => {
            const Icon = sk.icon
            return (
              <Link
                key={sk.label}
                href={sk.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] hover:border-[#E1AD01]/30 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-[#5C3A21]/8 flex items-center justify-center text-[#5C3A21] shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#5C3A21]">{sk.value}</p>
                  <p className="text-[10px] text-[#8A7E70] truncate">{sk.label}</p>
                  <p className="text-[9px] text-[#8A7E70]/60 truncate">{sk.sub}</p>
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>

      {/* Two-column: Top Recipes + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top recetas más vendidas */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recetas más Vendidas
            </CardTitle>
            <CardDescription className="text-xs">Top 3 por cantidad vendida</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topRecipes.length === 0 ? (
              <p className="text-sm text-[#8A7E70] text-center py-4">Sin ventas registradas todavía.</p>
            ) : (
              <div className="space-y-2">
                {data.topRecipes.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#5C3A21] truncate">{r.title}</p>
                        <p className="text-xs text-[#8A7E70]">{r.quantity} porciones vendidas</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#708238] shrink-0">{fmtCurrency(r.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ventas recientes */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Ventas Recientes
                </CardTitle>
                <CardDescription className="text-xs">Últimas 5 ventas</CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="text-[#5C3A21]">
                <Link href="/cm/admin/ventas">Ver todas<ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <p className="text-sm text-[#8A7E70] text-center py-4">Sin ventas registradas.</p>
            ) : (
              <div className="space-y-2">
                {data.recentSales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-[#708238]/15 flex items-center justify-center text-[#708238] shrink-0">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#5C3A21] truncate">{s.recipeTitle}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] py-0 h-4 font-mono">{s.ticketNumber}</Badge>
                          <span className="text-xs text-[#8A7E70]">{fmtDate(s.saleDate)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#5C3A21] shrink-0">{fmtCurrency(s.totalPrice)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Producciones por estado + Usuarios recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Producciones por estado */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Producciones por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#E1AD01]/5 border border-[#E1AD01]/20">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#E1AD01]" /><span className="text-sm text-[#5C3A21]">Pendientes</span></div>
              <Badge className="bg-[#E1AD01] text-[#1F1611]">{k.pendingProductions}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#708238]/5 border border-[#708238]/20">
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#708238]" /><span className="text-sm text-[#5C3A21]">Confirmadas</span></div>
              <Badge className="bg-[#708238]">{k.confirmedProductions}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#B91C1C]/5 border border-[#B91C1C]/20">
              <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-[#B91C1C]" /><span className="text-sm text-[#5C3A21]">Rechazadas</span></div>
              <Badge className="bg-[#B91C1C]">{k.rejectedProductions}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Usuarios recientes */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios Recientes
                </CardTitle>
                <CardDescription className="text-xs">Últimos 5 usuarios</CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="text-[#5C3A21]">
                <Link href="/cm/admin/users">Ver todos<ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-[#8A7E70] text-center py-4">Sin usuarios registrados.</p>
            ) : (
              <div className="space-y-2">
                {data.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(u)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#5C3A21] truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-[#8A7E70] truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] capitalize border-[#5C3A21]/20">{u.role}</Badge>
                      <Badge className={`text-[10px] ${u.isActive ? 'bg-[#708238]' : 'bg-[#8A7E70]'}`}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription className="text-xs">Atajos a las tareas más comunes</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Nueva Venta', desc: 'Registrar una venta', icon: Receipt, href: '/cm/admin/ventas?action=new', color: 'bg-[#708238]/15 text-[#708238]' },
            { label: 'Nueva Producción', desc: 'Registrar producción', icon: Factory, href: '/cm/admin/producciones?action=new', color: 'bg-[#5C3A21]/10 text-[#5C3A21]' },
            { label: 'Nueva Receta', desc: 'Crear una receta', icon: ChefHat, href: '/cm/admin/recetas?action=new', color: 'bg-[#E1AD01]/15 text-[#7a5c00]' },
            { label: 'Nuevo Presupuesto', desc: 'Cotizar a cliente', icon: FileText, href: '/cm/admin/presupuestos?action=new', color: 'bg-[#B91C1C]/10 text-[#B91C1C]' },
          ].map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-4 rounded-lg border border-[#5C3A21]/10 bg-[#FFF8E7] hover:bg-[#FBF1DC] hover:border-[#E1AD01]/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#5C3A21]">{action.label}</p>
                    <p className="text-xs text-[#8A7E70]">{action.desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8A7E70] group-hover:text-[#5C3A21] group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
