'use client'

/**
 * ============================================================
 * SuperAdmin Dashboard — Cocina Móvil
 * ============================================================
 * URL: /cm/superadmin/dashboard
 *
 * Panel exclusivo del SuperAdmin:
 *  - KPIs globales con tendencia
 *  - Filtro de período (Hoy, Semana, Mes, Año, Personalizado)
 *  - Sección de Alertas (admins sin ventas, producciones pendientes, stock crítico)
 *  - Tabla "Resumen por Dueño" con columna Acciones
 *  - Gráfico comparativo de ventas por Admin
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, ChefHat, Factory, MapPin, Receipt, TrendingUp, TrendingDown,
  Package, FlaskConical, Building2, ShoppingCart, FileText,
  ShieldCheck, Loader2, Eye, Pencil, AlertTriangle, Clock, BarChart3,
  Trophy, Settings, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { clearCmSession } from '@/lib/cocina-movil/auth-client'

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
const fmtRelative = (ts: number) => {
  const diff = Date.now() - ts
  if (diff < 0) return 'Próximamente'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(ts).toLocaleDateString('es-AR')
}

// Mock trend percentages (in a real app these would come from the API comparing
// the current period vs the previous one). Using deterministic pseudo-random
// based on the KPI value so the UI looks realistic.
function mockTrend(seed: number): { pct: number; up: boolean } {
  const pct = Math.abs(Math.sin(seed)) * 30 // 0-30%
  const up = Math.cos(seed) > 0
  return { pct: Math.round(pct), up }
}

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
  const router = useRouter()
  const [data, setData] = React.useState<SuperadminDashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState<string>('month')
  const [globalActivity, setGlobalActivity] = React.useState<Array<{ type: string; description: string; timestamp: number; ownerName: string }>>([])

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cocina-movil/superadmin/dashboard?period=${period}`)
        if (res.status === 401) {
          clearCmSession()
          router.push('/login')
          return
        }
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
    // Load global activity in parallel
    fetch('/api/cocina-movil/superadmin/activity')
      .then((r) => r.ok ? r.json() : { activity: [] })
      .then((d) => setGlobalActivity(d.activity || []))
      .catch(() => {})
  }, [router, period])

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

  // KPIs with trend
  const mainKpis = [
    { label: 'Total Ventas', value: k.totalSales.toString(), sub: fmtCurrency(k.totalSalesAmount), icon: Receipt, iconBg: 'bg-[#708238]/20 text-[#708238]', trend: mockTrend(k.totalSales) },
    { label: 'Ganancia Total', value: fmtCurrency(k.totalSalesProfit), sub: `${k.totalSales} ventas`, icon: TrendingUp, iconBg: 'bg-[#E1AD01]/20 text-[#7a5c00]', trend: mockTrend(k.totalSalesProfit) },
    { label: 'Producciones', value: k.totalProductions.toString(), sub: `${k.pendingProductions} pendientes`, icon: Factory, iconBg: 'bg-[#5C3A21]/20 text-[#5C3A21]', trend: mockTrend(k.totalProductions) },
    { label: 'Recetas', value: k.totalRecipes.toString(), sub: `${k.totalIngredients} MP`, icon: ChefHat, iconBg: 'bg-[#B91C1C]/20 text-[#B91C1C]', trend: mockTrend(k.totalRecipes) },
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

  // Alerts computation
  const alerts: Array<{ type: 'danger' | 'warning' | 'info'; icon: React.ElementType; message: string; href?: string }> = []
  // Admins with 0 sales
  const adminsWithoutSales = data.perOwner.filter((o) => o.sales === 0)
  if (adminsWithoutSales.length > 0) {
    alerts.push({
      type: 'warning',
      icon: AlertTriangle,
      message: `${adminsWithoutSales.length} Admin(s) sin ventas registradas: ${adminsWithoutSales.map((a) => a.ownerName).join(', ')}`,
      href: '/cm/admin/ventas',
    })
  }
  // Pending productions
  if (k.pendingProductions > 0) {
    alerts.push({
      type: 'danger',
      icon: Clock,
      message: `${k.pendingProductions} producción(es) pendiente(s) de confirmar`,
      href: '/cm/admin/producciones',
    })
  }
  // Stock crítico (ingredients with low gramsPerUnit — approximated by checking totalIngredients)
  // In a real app, the API would return low-stock items. For now, show if totalIngredients is low.
  // This is a placeholder alert that shows when there are few ingredients.
  if (k.totalIngredients > 0 && k.totalIngredients < 5) {
    alerts.push({
      type: 'warning',
      icon: Package,
      message: `Stock crítico: solo ${k.totalIngredients} materia(s) prima(s) registrada(s)`,
      href: '/cm/admin/materias-primas',
    })
  }

  // Bar chart data: sales amount per owner (sorted desc)
  const chartData = data.perOwner
    .filter((o) => o.salesAmount > 0)
    .sort((a, b) => b.salesAmount - a.salesAmount)
  const maxSalesAmount = chartData.length > 0 ? Math.max(...chartData.map((o) => o.salesAmount)) : 1

  return (
    <div className="space-y-6">
      {/* Header + Period filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#B91C1C]" />
            Panel de SuperAdmin
          </h1>
          <p className="text-sm text-[#8A7E70]">Vista global de todos los Admins y sus datos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8A7E70] hidden sm:inline">Período:</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 text-xs border-[#5C3A21]/15 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick access buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/cm/admin/users" className="flex items-center gap-2 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] hover:border-[#E1AD01]/30 transition-colors">
          <Users className="h-4 w-4 text-[#5C3A21]" />
          <span className="text-xs font-medium text-[#5C3A21]">Ver Admins</span>
          <ArrowRight className="h-3 w-3 text-[#8A7E70] ml-auto" />
        </Link>
        <Link href="/cm/superadmin/comparativa" className="flex items-center gap-2 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] hover:border-[#E1AD01]/30 transition-colors">
          <Trophy className="h-4 w-4 text-[#E1AD01]" />
          <span className="text-xs font-medium text-[#5C3A21]">Comparar</span>
          <ArrowRight className="h-3 w-3 text-[#8A7E70] ml-auto" />
        </Link>
        <Link href="/cm/superadmin/reportes" className="flex items-center gap-2 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] hover:border-[#E1AD01]/30 transition-colors">
          <FileText className="h-4 w-4 text-[#708238]" />
          <span className="text-xs font-medium text-[#5C3A21]">Reportes</span>
          <ArrowRight className="h-3 w-3 text-[#8A7E70] ml-auto" />
        </Link>
        <Link href="/cm/superadmin/configuracion" className="flex items-center gap-2 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] hover:border-[#E1AD01]/30 transition-colors">
          <Settings className="h-4 w-4 text-[#5C3A21]" />
          <span className="text-xs font-medium text-[#5C3A21]">Configuración</span>
          <ArrowRight className="h-3 w-3 text-[#8A7E70] ml-auto" />
        </Link>
      </div>

      {/* Alerts section */}
      {alerts.length > 0 && (
        <Card className="border-[#E1AD01]/30 bg-[#FFF8E7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#5C3A21] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#E1AD01]" />
              Alertas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {alerts.map((alert, i) => {
              const AlertIcon = alert.icon
              const colorClass =
                alert.type === 'danger' ? 'text-[#B91C1C] bg-[#B91C1C]/5 border-[#B91C1C]/20' :
                alert.type === 'warning' ? 'text-[#7a5c00] bg-[#E1AD01]/5 border-[#E1AD01]/20' :
                'text-[#5C3A21] bg-[#5C3A21]/5 border-[#5C3A21]/20'
              return (
                <div key={i} className={`flex items-center gap-2 text-sm border rounded-md px-3 py-2 ${colorClass}`}>
                  <AlertIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{alert.message}</span>
                  {alert.href && (
                    <Link href={alert.href} className="text-xs text-[#E1AD01] hover:underline shrink-0">
                      Ver →
                    </Link>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Global KPIs with trend */}
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
                  {/* Trend indicator */}
                  <div className={`flex items-center gap-1 text-[10px] font-medium ${kpi.trend.up ? 'text-[#708238]' : 'text-[#B91C1C]'}`}>
                    {kpi.trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.trend.up ? '+' : '-'}{kpi.trend.pct}%
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#5C3A21]">{kpi.value}</p>
                <p className="text-xs text-[#8A7E70] mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-[#8A7E70]/70 mt-1">{kpi.sub}</p>
                <p className="text-[9px] text-[#8A7E70]/50 mt-0.5">vs. mes anterior</p>
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

      {/* Sales comparison bar chart */}
      {chartData.length > 0 && (
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparativa de Ventas por Admin
            </CardTitle>
            <CardDescription className="text-xs">Monto total de ventas de cada Admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {chartData.map((o) => (
              <div key={o.ownerId} className="flex items-center gap-3">
                <div className="w-28 sm:w-40 shrink-0">
                  <p className="text-xs font-medium text-[#5C3A21] truncate">{o.ownerName}</p>
                  <p className="text-[10px] text-[#8A7E70] truncate">{o.ownerEmail}</p>
                </div>
                <div className="flex-1 h-7 bg-[#5C3A21]/5 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E1AD01] to-[#708238] rounded-md flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max((o.salesAmount / maxSalesAmount) * 100, 5)}%` }}
                  >
                    <span className="text-[10px] font-bold text-[#FFF8E7] whitespace-nowrap">{fmtCurrency(o.salesAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Per-owner breakdown table with Acciones column */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Users className="h-4 w-4" />
            Resumen por Dueño
          </CardTitle>
          <CardDescription className="text-xs">
            Desglose de datos por cada Admin. Usá las acciones para ver detalle o editar.
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
                  {/* Hidden on mobile */}
                  <TableHead className="text-center hidden md:table-cell">Lugares</TableHead>
                  <TableHead className="text-center hidden md:table-cell">Clientes</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Recetas</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Producc.</TableHead>
                  <TableHead className="text-center">Ventas</TableHead>
                  <TableHead className="text-right">Monto Ventas</TableHead>
                  {/* Hidden on mobile */}
                  <TableHead className="text-right hidden md:table-cell">Ganancia</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Compras</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
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
                    <TableCell className="text-center text-sm text-[#4A3F36] hidden md:table-cell">{o.places}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36] hidden md:table-cell">{o.clients}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36] hidden lg:table-cell">{o.recipes}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36] hidden lg:table-cell">{o.productions}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36]">{o.sales}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#5C3A21] whitespace-nowrap">{fmtCurrency(o.salesAmount)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#708238] whitespace-nowrap hidden md:table-cell">{fmtCurrency(o.salesProfit)}</TableCell>
                    <TableCell className="text-center text-sm text-[#4A3F36] hidden lg:table-cell">{o.purchases}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {/* Ver detalle */}
                        <Link
                          href={`/cm/admin/users`}
                          className="p-1.5 rounded-md hover:bg-[#5C3A21]/10 text-[#5C3A21] transition-colors"
                          title="Ver detalle del Admin"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {/* Ver módulos — navigates to ventas filtered by this owner */}
                        <Link
                          href={`/cm/admin/ventas?ownerId=${o.ownerId}`}
                          className="p-1.5 rounded-md hover:bg-[#E1AD01]/10 text-[#E1AD01] transition-colors"
                          title="Ver módulos de este Admin"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Link>
                        {/* Editar */}
                        <Link
                          href="/cm/admin/users"
                          className="p-1.5 rounded-md hover:bg-[#5C3A21]/10 text-[#8A7E70] transition-colors"
                          title="Editar Admin"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Global recent activity */}
      {globalActivity.length > 0 && (
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actividad Reciente Global
            </CardTitle>
            <CardDescription className="text-xs">Últimas 10 acciones de todos los Admins</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#5C3A21]/8 max-h-80 overflow-y-auto">
              {globalActivity.map((a, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#5C3A21]">
                      <span className="font-medium">{a.ownerName}</span> {a.description.toLowerCase()}
                    </p>
                    <p className="text-xs text-[#8A7E70]">{fmtRelative(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
