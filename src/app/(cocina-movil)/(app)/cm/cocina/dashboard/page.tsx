'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChefHat, Factory, TrendingUp, Package, Eye, MapPin, CheckCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getCmUserFromStorage } from '@/lib/cocina-movil/auth-client'

const fmtCurrency = (v: number) => `$${Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
const fmtDate = (ts: number) => {
  if (!ts || isNaN(ts)) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
const fmtRelative = (ts: number) => {
  if (!ts || isNaN(ts)) return '—'
  const diff = Date.now() - ts
  if (diff < 0) return 'Próximamente'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return fmtDate(ts)
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-[#8A7E70]' },
  en_proceso: { label: 'En Proceso', color: 'bg-[#E1AD01]' },
  finalizado: { label: 'Finalizado', color: 'bg-[#708238]' },
  cancelado: { label: 'Cancelado', color: 'bg-[#B91C1C]' },
  confirmed: { label: 'Confirmada', color: 'bg-[#708238]' },
  pending: { label: 'Pendiente', color: 'bg-[#8A7E70]' },
  rejected: { label: 'Rechazada', color: 'bg-[#B91C1C]' },
}

export default function CookDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
        </div>
      }
    >
      <CookDashboardContent />
    </React.Suspense>
  )
}

function CookDashboardContent() {
  const [user, setUser] = React.useState<{ firstName?: string; role?: string } | null>(null)
  const [stats, setStats] = React.useState({ recipes: 0, productionsToday: 0, portionsToday: 0, estimatedCost: 0, lowStock: 0 })
  const [recentProductions, setRecentProductions] = React.useState<Array<{ id: string; recipeTitle: string; placeName: string; quantity: number; cost: number; status: string; productionDate: number }>>([])
  const [pendingProductions, setPendingProductions] = React.useState(0)
  const [places, setPlaces] = React.useState<Array<{ id: string; name: string; productionsCount: number }>>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const u = getCmUserFromStorage()
    setUser(u)
    // Fetch helper: returns parsed JSON only when res.ok, else null.
    // Avoids silently swallowing 401/403 as "empty data".
    const safeJson = async (res: Response) => (res.ok ? res.json() : null)
    Promise.all([
      fetch('/api/cocina-movil/recipes?isActive=true&pageSize=200').then(safeJson).catch(() => null),
      fetch('/api/cocina-movil/productions?pageSize=200').then(safeJson).catch(() => null),
      fetch('/api/cocina-movil/ingredients?isActive=true&pageSize=200').then(safeJson).catch(() => null),
      fetch('/api/cocina-movil/supplies?isActive=true&pageSize=200').then(safeJson).catch(() => null),
      fetch('/api/cocina-movil/places?isActive=true&pageSize=200').then(safeJson).catch(() => null),
    ]).then(([rData, pData, iData, sData, plData]) => {
      // Detect total failure (e.g. session expired) and surface it.
      if (!rData && !pData && !iData && !sData && !plData) {
        toast.error('No se pudieron cargar los datos del dashboard. Verificá tu sesión.')
      }
      const recipes = rData?.recipes || []
      const allProductions = pData?.productions || []
      const today = new Date(); today.setHours(0,0,0,0)
      const todayMs = today.getTime()
      const todayProductions = allProductions.filter((p: { productionDate: number }) => p.productionDate && p.productionDate >= todayMs)
      const portionsToday = todayProductions.reduce((sum: number, p: { quantity: number }) => sum + (p.quantity || 0), 0)
      const costToday = todayProductions.reduce((sum: number, p: { cost: number }) => sum + (p.cost || 0), 0)
      const lowStockItems = [
        ...(iData?.ingredients || []).filter((i: { gramsPerUnit: number | null }) => !i.gramsPerUnit || i.gramsPerUnit < 500),
        ...(sData?.supplies || []).filter((s: { purchasePrice: number }) => s.purchasePrice < 100),
      ]
      const pending = allProductions.filter((p: { status: string }) => p.status === 'pendiente' || p.status === 'pending').length

      // Places with production count this month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      const placeList = (plData?.places || []).map((pl: { id: string; name: string }) => ({
        id: pl.id,
        name: pl.name,
        productionsCount: allProductions.filter((p: { placeId: string; productionDate: number }) => p.placeId === pl.id && p.productionDate >= monthStart).length,
      }))

      setStats({ recipes: recipes.length, productionsToday: todayProductions.length, portionsToday, estimatedCost: costToday, lowStock: lowStockItems.length })
      setPendingProductions(pending)
      setRecentProductions(allProductions.slice(0, 5))
      setPlaces(placeList.slice(0, 5))
      setLoading(false)
    }).catch((err) => {
      // Defensive: never leave the page stuck on the spinner.
      console.error('[CookDashboard] load error:', err)
      toast.error('Ocurrió un error al cargar el dashboard.')
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E1AD01] border-t-transparent" /></div>
  }

  const hasAlerts = pendingProductions > 0 || stats.lowStock > 0

  return (
    <div
      className="space-y-6 relative min-h-[calc(100vh-120px)] rounded-lg"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,248,231,0.88), rgba(255,248,231,0.92)), url("/images/(cocina-movil)/fondo-cocina.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-[#5C3A21]">¡Hola, {user?.firstName || 'Cocinero'}! 👨‍🍳</h1>
        <p className="text-sm text-[#8A7E70]">Bienvenido a tu panel de trabajo.</p>
      </div>

      {/* Sección 1: Alertas y Tareas Pendientes */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#E1AD01]" />Alertas y Tareas Pendientes
          </h3>
          {hasAlerts ? (
            <div className="space-y-2">
              {pendingProductions > 0 && (
                <div className="flex items-center gap-2 text-sm text-[#5C3A21]">
                  <Clock className="h-4 w-4 text-[#E1AD01]" />
                  <span>Tenés <strong>{pendingProductions}</strong> producciones pendientes de confirmar.</span>
                  <Link href="/cm/cocina/producciones" className="text-[#E1AD01] hover:underline ml-auto text-xs">Ver →</Link>
                </div>
              )}
              {stats.lowStock > 0 && (
                <div className="flex items-center gap-2 text-sm text-[#5C3A21]">
                  <Package className="h-4 w-4 text-[#B91C1C]" />
                  <span>Stock crítico en <strong>{stats.lowStock}</strong> insumos.</span>
                  <Link href="/cm/cocina/stock" className="text-[#E1AD01] hover:underline ml-auto text-xs">Ver →</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#708238]">
              <CheckCircle className="h-4 w-4" />
              <span>Todo en orden. No tenés tareas pendientes.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección 2: Resumen del Día */}
      <div>
        <h3 className="text-sm font-semibold text-[#5C3A21] mb-3">Resumen del Día</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-[#5C3A21]/10 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#E1AD01]/10 flex items-center justify-center"><ChefHat className="h-5 w-5 text-[#E1AD01]" /></div>
              <div><p className="text-xs text-[#8A7E70]">Recetas Activas</p><p className="text-xl font-bold text-[#5C3A21]">{stats.recipes}</p></div>
            </CardContent>
          </Card>
          <Card className="border-[#5C3A21]/10 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#708238]/10 flex items-center justify-center"><Factory className="h-5 w-5 text-[#708238]" /></div>
              <div><p className="text-xs text-[#8A7E70]">Producciones Hoy</p><p className="text-xl font-bold text-[#5C3A21]">{stats.productionsToday} ({stats.portionsToday} porc.)</p></div>
            </CardContent>
          </Card>
          <Card className="border-[#5C3A21]/10 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#5C3A21]/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-[#5C3A21]" /></div>
              <div><p className="text-xs text-[#8A7E70]">Costo Producción Hoy</p><p className="text-xl font-bold text-[#5C3A21]">{fmtCurrency(stats.estimatedCost)}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sección 3: Últimas Actividades */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-[#5C3A21]/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2"><Factory className="h-4 w-4" />Últimas Producciones</h3>
              <Link href="/cm/cocina/producciones" className="text-xs text-[#E1AD01] hover:underline flex items-center gap-1"><Eye className="h-3 w-3" />Ver todas</Link>
            </div>
            {recentProductions.length === 0 ? (
              <p className="text-sm text-[#8A7E70] text-center py-8">No hay producciones registradas.</p>
            ) : (
              <div className="divide-y divide-[#5C3A21]/8">
                {recentProductions.map((p) => {
                  const meta = STATUS_META[p.status] || { label: p.status, color: 'bg-gray-500' }
                  return (
                    <div key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#5C3A21] truncate">{p.recipeTitle}</p>
                        <p className="text-xs text-[#8A7E70]">{fmtRelative(p.productionDate)} · {p.placeName || '—'} · {p.quantity} porc.</p>
                      </div>
                      <Badge className={`text-[10px] ${meta.color} text-white shrink-0`}>{meta.label}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección 4: Mis Lugares */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-[#5C3A21]/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2"><MapPin className="h-4 w-4" />Mis Lugares</h3>
              <Link href="/cm/cocina/lugares" className="text-xs text-[#E1AD01] hover:underline flex items-center gap-1"><Eye className="h-3 w-3" />Ver todos</Link>
            </div>
            {places.length === 0 ? (
              <p className="text-sm text-[#8A7E70] text-center py-8">No hay lugares registrados.</p>
            ) : (
              <div className="divide-y divide-[#5C3A21]/8">
                {places.map((pl) => (
                  <div key={pl.id} className="px-4 py-2.5 flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-[#5C3A21]/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#5C3A21] truncate">{pl.name}</p>
                      <p className="text-xs text-[#8A7E70]">{pl.productionsCount} producciones este mes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
