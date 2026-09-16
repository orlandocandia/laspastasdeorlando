'use client'

/**
 * ============================================================
 * SuperAdmin Dashboard — Cocina Móvil
 * ============================================================
 * URL: /cm/superadmin/dashboard
 *
 * Panel exclusivo del SuperAdmin:
 *  - KPIs globales (suma de todos los Admins)
 *  - Selector de dueño para ver datos de un Admin específico
 *  - Tabla "Resumen por Dueño" (ventas, recetas, lugares, etc.)
 *  - Acceso al ABM de Admins (/cm/admin/users)
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Users, ChefHat, Factory, MapPin, Receipt, TrendingUp,
  Package, FlaskConical, Building2, ShoppingCart, FileText,
  ShieldCheck, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

interface OwnerInfo {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface OwnerBreakdown {
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
}

interface SuperadminDashboardData {
  globalKpis: {
    totalAdmins: number
    activeAdmins: number
    totalPlaces: number
    totalIngredients: number
    totalSupplies: number
    totalSuppliers: number
    totalRecipes: number
    totalProductions: number
    pendingProductions: number
    totalBudgets: number
    totalSales: number
    totalSalesAmount: number
    totalSalesProfit: number
    totalPurchases: number
    totalPurchasesAmount: number
    totalClients: number
  }
  owners: OwnerInfo[]
  perOwner: OwnerBreakdown[]
}

const fmtCurrency = (v: number) => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

export default function SuperadminDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
        </div>
      }
    >
      <SuperadminDashboardContent />
    </React.Suspense>
  )
}

function SuperadminDashboardContent() {
  const [data, setData] = React.useState<SuperadminDashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cocina-movil/superadmin/dashboard')
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('[SuperadminDashboard] Error:', err)
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
        <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
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
  const k = data.globalKpis

  const mainKpis = [
    { label: 'Total Ventas', value: k.totalSales.toString(), sub: fmtCurrency(k.totalSalesAmount), icon: Receipt, iconBg: 'bg-[#708238]/20 text-[#708238]' },
    { label: 'Ganancia Total', value: fmtCurrency(k.totalSalesProfit), sub: `${k.totalSales} ventas`, icon: TrendingUp, iconBg: 'bg-[#E1AD01]/20 text-[#7a5c00]' },
    { label: 'Producciones', value: k.totalProductions.toString(), sub: `${k.pendingProductions} pendientes`, icon: Factory, iconBg: 'bg-[#5C3A21]/20 text-[#5C3A21]' },
    { label: 'Recetas', value: k.totalRecipes.toString(), sub: `${k.totalIngredients} MP`, icon: ChefHat, iconBg: 'bg-[#B91C1C]/20 text-[#B91C1C]' },
  ]

  const moduleKpis = [
    { label: 'Admins', value: k.totalAdmins, sub: `${k.activeAdmins} activos`, icon: Users, href: '/cm/admin/users' },
    { label: 'Lugares', value: k.totalPlaces, sub: 'lugares', icon: MapPin, href: '/cm/admin/lugares' },
    { label: 'Clientes', value: k.totalClients, sub: 'clientes', icon: Users, href: '/cm/admin/clientes' },
    { label: 'Proveedores', value: k.totalSuppliers, sub: 'proveedores', icon: Building2, href: '/cm/admin/proveedores' },
    { label: 'Compras', value: k.totalPurchases, sub: fmtCurrency(k.totalPurchasesAmount), icon: ShoppingCart, href: '/cm/admin/compras' },
    { label: 'Presupuestos', value: k.totalBudgets, sub: 'presupuestos', icon: FileText, href: '/cm/admin/presupuestos' },
    { label: 'Materias Primas', value: k.totalIngredients, sub: 'ingredientes', icon: Package, href: '/cm/admin/materias-primas' },
    { label: 'Insumos', value: k.totalSupplies, sub: 'insumos', icon: FlaskConical, href: '/cm/admin/insumos' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[#B91C1C]" />
          Panel de SuperAdmin
        </h1>
        <p className="text-sm text-[#8A7E70]">Vista global de todos los Admins y sus datos</p>
      </div>

      {/* Global KPIs */}
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

      {/* Module quick-links */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21]">Resumen de Módulos (Global)</CardTitle>
          <CardDescription className="text-xs">Datos sumados de todos los Admins</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {moduleKpis.map((sk) => {
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

      {/* Per-owner breakdown table */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Users className="h-4 w-4" />
            Resumen por Dueño
          </CardTitle>
          <CardDescription className="text-xs">
            Desglose de datos por cada Admin. Hacé clic en un módulo para ver el detalle.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {data.perOwner.length === 0 ? (
            <p className="text-sm text-[#8A7E70] text-center py-8">No hay Admins registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                  <TableHead>Dueño</TableHead>
                  <TableHead className="text-center">Lugares</TableHead>
                  <TableHead className="text-center">Clientes</TableHead>
                  <TableHead className="text-center">Recetas</TableHead>
                  <TableHead className="text-center">Producc.</TableHead>
                  <TableHead className="text-center">Ventas</TableHead>
                  <TableHead className="text-right">Monto Ventas</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="text-center">Compras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.perOwner.map((o) => (
                  <TableRow key={o.ownerId} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#5C3A21] truncate">{o.ownerName}</p>
                          <p className="text-[10px] text-[#8A7E70] truncate">{o.ownerEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36]">{o.places}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36]">{o.clients}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36]">{o.recipes}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36]">{o.productions}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36]">{o.sales}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#5C3A21] whitespace-nowrap">{fmtCurrency(o.salesAmount)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#708238] whitespace-nowrap">{fmtCurrency(o.salesProfit)}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36]">{o.purchases}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
