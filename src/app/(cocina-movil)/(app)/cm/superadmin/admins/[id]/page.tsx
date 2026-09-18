'use client'

/**
 * ============================================================
 * SuperAdmin — Admin Detail Page
 * ============================================================
 * URL: /cm/superadmin/admins/[id]
 *
 * Shows a specific Admin's KPIs, module shortcuts,
 * and recent activity.
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, ChefHat, Factory, MapPin, Receipt, TrendingUp,
  Package, FlaskConical, Building2, ShoppingCart, FileText,
  Loader2, ShieldCheck, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { clearCmSession } from '@/lib/cocina-movil/auth-client'

interface AdminDetail {
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

interface AdminStats {
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

interface AdminActivity {
  type: string
  description: string
  timestamp: number
  ownerName: string
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

export default function AdminDetailPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <AdminDetailContent />
    </React.Suspense>
  )
}

function AdminDetailContent() {
  const params = useParams()
  const router = useRouter()
  const adminId = params.id as string
  const [admin, setAdmin] = React.useState<AdminDetail | null>(null)
  const [stats, setStats] = React.useState<AdminStats | null>(null)
  const [activity, setActivity] = React.useState<AdminActivity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const [detailRes, activityRes] = await Promise.all([
          fetch(`/api/cocina-movil/superadmin/admins/${adminId}`),
          fetch(`/api/cocina-movil/superadmin/admins/${adminId}/activity`),
        ])
        if (detailRes.status === 401) { clearCmSession(); router.push('/login'); return }
        if (detailRes.status === 404) { setError('Admin no encontrado'); setLoading(false); return }
        if (!detailRes.ok) throw new Error('HTTP ' + detailRes.status)
        const detailData = await detailRes.json()
        setAdmin(detailData.admin)
        setStats(detailData.stats)
        const actData = await activityRes.json()
        setActivity(actData.activity || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [adminId, router])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>
  if (error) return <div className="py-20 text-center"><p className="text-sm text-[#B91C1C]">{error}</p><Button onClick={() => router.push('/cm/superadmin/dashboard')} variant="outline" className="mt-3">Volver</Button></div>
  if (!admin || !stats) return null

  const kpis = [
    { label: 'Ventas', value: stats.sales.toString(), sub: fmtCurrency(stats.salesAmount), icon: Receipt, iconBg: 'bg-[#708238]/20 text-[#708238]' },
    { label: 'Ganancia', value: fmtCurrency(stats.salesProfit), sub: `${stats.sales} ventas`, icon: TrendingUp, iconBg: 'bg-[#E1AD01]/20 text-[#7a5c00]' },
    { label: 'Producciones', value: stats.productions.toString(), sub: `${stats.recipes} recetas`, icon: Factory, iconBg: 'bg-[#5C3A21]/20 text-[#5C3A21]' },
    { label: 'Recetas', value: stats.recipes.toString(), sub: `${stats.ingredients} MP`, icon: ChefHat, iconBg: 'bg-[#B91C1C]/20 text-[#B91C1C]' },
  ]

  const modules = [
    { label: 'Lugares', value: stats.places, icon: MapPin, href: `/cm/admin/lugares?ownerId=${adminId}` },
    { label: 'Recetas', value: stats.recipes, icon: ChefHat, href: `/cm/admin/recetas?ownerId=${adminId}` },
    { label: 'Producciones', value: stats.productions, icon: Factory, href: `/cm/admin/producciones?ownerId=${adminId}` },
    { label: 'Presupuestos', value: stats.budgets, icon: FileText, href: `/cm/admin/presupuestos?ownerId=${adminId}` },
    { label: 'Ventas', value: stats.sales, icon: Receipt, href: `/cm/admin/ventas?ownerId=${adminId}` },
    { label: 'Clientes', value: stats.clients, icon: Users, href: `/cm/admin/clientes?ownerId=${adminId}` },
    { label: 'Materias Primas', value: stats.ingredients, icon: Package, href: `/cm/admin/materias-primas?ownerId=${adminId}` },
    { label: 'Insumos', value: stats.supplies, icon: FlaskConical, href: `/cm/admin/insumos?ownerId=${adminId}` },
    { label: 'Proveedores', value: stats.suppliers, icon: Building2, href: `/cm/admin/proveedores?ownerId=${adminId}` },
    { label: 'Compras', value: stats.purchases, icon: ShoppingCart, href: `/cm/admin/compras?ownerId=${adminId}` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/cm/superadmin/dashboard" className="p-2 rounded-lg hover:bg-[#5C3A21]/8 text-[#5C3A21]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#5C3A21]">{admin.firstName} {admin.lastName}</h1>
            <p className="text-sm text-[#8A7E70]">{admin.email}</p>
          </div>
        </div>
        <Badge className={admin.isActive ? 'bg-[#708238] text-[#FFF8E7]' : 'bg-[#B91C1C] text-[#FFF8E7]'}>
          {admin.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-[#5C3A21]/10 shadow-sm">
              <CardContent className="p-5">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.iconBg} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-[#5C3A21]">{kpi.value}</p>
                <p className="text-xs text-[#8A7E70] mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-[#8A7E70]/70 mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Module shortcuts */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21]">Módulos de {admin.firstName}</CardTitle>
          <CardDescription className="text-xs">Hacé clic para ver los datos de este Admin</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <Link key={m.label} href={m.href} className="flex items-center gap-3 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] hover:border-[#E1AD01]/30 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-[#5C3A21]/8 flex items-center justify-center text-[#5C3A21] shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#5C3A21]">{m.value}</p>
                  <p className="text-[10px] text-[#8A7E70] truncate">{m.label}</p>
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Últimas Actividades de {admin.firstName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activity.length === 0 ? (
            <p className="text-sm text-[#8A7E70] text-center py-8">No hay actividad reciente.</p>
          ) : (
            <div className="divide-y divide-[#5C3A21]/8">
              {activity.map((a, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#5C3A21]">{a.description}</p>
                    <p className="text-xs text-[#8A7E70]">{fmtRelative(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
