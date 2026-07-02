'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, MessageSquare, Phone, ArrowRight, UserCircle, Users,
  Leaf, PackageOpen, UtensilsCrossed, ShoppingCart, ClipboardList,
  ArrowLeftRight, Receipt, CalendarCheck, DollarSign, Factory,
  AlertTriangle, BookOpen, Shield, TrendingUp, FileBarChart,
  CheckCircle, ChevronDown, ChevronUp, Utensils, Info, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  productosActivos: number
  opinionesPendientes: number
  interaccionesWhatsApp: number
  totalPersonas: number
  totalUsuarios: number
  totalMateriasPrimas: number
  totalInsumos: number
  totalProductosTerminados: number
  totalCompras: number
  totalPedidos: number
  totalMovimientos: number
  totalVentas: number
  totalPedidosClientes: number
  totalReservas: number
  ventasDelMes: number
  pedidosPendientes: number
  reservasActivas: number
  produccionDelMes: number
  costoPromedioProduccion: number
  stockCritico: number
  recetasActivas: number
}

// ─── Alert Types ────────────────────────────────────────────────────────────

type AlertSeverity = 'critica' | 'media' | 'informativa'

interface AlertItem {
  id: number
  nombre: string
  stock_actual?: number
  stock_minimo?: number
  fecha?: string | null
}

interface AlertEntry {
  count: number
  severity: AlertSeverity
  label: string
  items: AlertItem[]
  href: string
}

interface AlertsData {
  alertas: {
    stock: Record<string, AlertEntry>
    produccion: Record<string, AlertEntry>
    clientes: Record<string, AlertEntry>
    proveedores: Record<string, AlertEntry>
    ventas: Record<string, AlertEntry>
    tienda: Record<string, AlertEntry>
  }
  resumen: {
    total: number
    criticas: number
    medias: number
    informativas: number
  }
}

const CATEGORY_META: Record<string, { label: string; icon: typeof AlertTriangle }> = {
  stock: { label: 'Stock', icon: Package },
  produccion: { label: 'Producción y Recetas', icon: Factory },
  clientes: { label: 'Clientes y Pedidos', icon: ClipboardList },
  proveedores: { label: 'Proveedores y Compras', icon: ShoppingCart },
  ventas: { label: 'Ventas y Presupuestos', icon: Receipt },
  tienda: { label: 'Productos y Tienda', icon: UtensilsCrossed },
}

const SEVERITY_META: Record<AlertSeverity, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  critica: { color: 'text-rojo', bg: 'bg-rojo/10', border: 'border-rojo/30', icon: AlertTriangle },
  media: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertCircle },
  informativa: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Info },
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
}

const alertPanelVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    productosActivos: 0,
    opinionesPendientes: 0,
    interaccionesWhatsApp: 0,
    totalPersonas: 0,
    totalUsuarios: 0,
    totalMateriasPrimas: 0,
    totalInsumos: 0,
    totalProductosTerminados: 0,
    totalCompras: 0,
    totalPedidos: 0,
    totalMovimientos: 0,
    totalVentas: 0,
    totalPedidosClientes: 0,
    totalReservas: 0,
    ventasDelMes: 0,
    pedidosPendientes: 0,
    reservasActivas: 0,
    produccionDelMes: 0,
    costoPromedioProduccion: 0,
    stockCritico: 0,
    recetasActivas: 0,
  })
  const [loading, setLoading] = useState(true)
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [activeAlertCategory, setActiveAlertCategory] = useState<string>('stock')

  // Fetch general stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const [productosRes, opinionesRes, contactoRes, personasRes, usuariosRes, mpRes, insRes, ptRes, comprasRes, pedidosRes, stockRes, ventasRes, pedidosCliRes, reservasRes, produccionRes] = await Promise.all([
          fetch('/api/productos?stock=false'),
          fetch('/api/opiniones?admin=true&estado=pending'),
          fetch('/api/contacto?dias=30'),
          fetch('/api/personas?limite=1'),
          fetch('/api/usuarios'),
          fetch('/api/materias-primas?limite=1'),
          fetch('/api/insumos?limite=1'),
          fetch('/api/productos-terminados?limite=1'),
          fetch('/api/compras?limite=1'),
          fetch('/api/pedidos-proveedores?limite=1'),
          fetch('/api/stock-movements?limite=1'),
          fetch('/api/ventas?limite=1'),
          fetch('/api/pedidos-clientes?limite=1'),
          fetch('/api/reservas-clientes?limite=1'),
          fetch('/api/produccion?limite=1'),
        ])

        const productos = await productosRes.json()
        const opiniones = await opinionesRes.json()
        const contacto = await contactoRes.json()
        const personasData = await personasRes.json()
        const usuariosData = await usuariosRes.json()
        const mpData = await mpRes.json()
        const insData = await insRes.json()
        const ptData = await ptRes.json()
        const comprasData = await comprasRes.json()
        const pedidosData = await pedidosRes.json()
        const stockData = await stockRes.json()
        const ventasData = await ventasRes.json()
        const pedidosCliData = await pedidosCliRes.json()
        const reservasData = await reservasRes.json()
        const produccionData = await produccionRes.json()

        setStats({
          productosActivos: Array.isArray(productos)
            ? productos.filter((p: { stock: boolean }) => p.stock).length
            : 0,
          opinionesPendientes: Array.isArray(opiniones) ? opiniones.length : 0,
          interaccionesWhatsApp: contacto?.estadisticas?.total || 0,
          totalPersonas: personasData?.total || 0,
          totalUsuarios: Array.isArray(usuariosData) ? usuariosData.length : 0,
          totalMateriasPrimas: mpData?.total || 0,
          totalInsumos: insData?.total || 0,
          totalProductosTerminados: ptData?.total || 0,
          totalCompras: comprasData?.total || 0,
          totalPedidos: pedidosData?.total || 0,
          totalMovimientos: stockData?.total || 0,
          totalVentas: ventasData?.total || 0,
          totalPedidosClientes: pedidosCliData?.total || 0,
          totalReservas: reservasData?.total || 0,
          ventasDelMes: ventasData?.total || 0,
          pedidosPendientes: pedidosCliData?.total || 0,
          reservasActivas: reservasData?.total || 0,
          produccionDelMes: produccionData?.total || 0,
          costoPromedioProduccion: 0,
          stockCritico: 0,
          recetasActivas: 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Fetch comprehensive alerts
  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true)
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const data: AlertsData = await res.json()
        setAlertsData(data)
        setStats(prev => ({
          ...prev,
          stockCritico: data.resumen.criticas,
          recetasActivas: data.alertas.produccion.receta_sin_ingredientes
            ? 0 : 0, // Keep from stats API
        }))
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setAlertsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // ─── Derived alert data ────────────────────────────────────────────────────

  // Get active alerts only (count > 0)
  const activeCategories = alertsData
    ? Object.entries(alertsData.alertas)
        .map(([key, entries]) => ({
          key,
          meta: CATEGORY_META[key],
          alerts: Object.values(entries).filter((e: AlertEntry) => e.count > 0),
          total: Object.values(entries).reduce((sum: number, e: AlertEntry) => sum + e.count, 0),
        }))
        .filter(cat => cat.total > 0)
    : []

  const totalAlerts = alertsData?.resumen.total ?? 0

  // ─── Metric Cards ──────────────────────────────────────────────────────────

  const metricCards = [
    {
      title: 'Ventas del Mes',
      value: stats.totalVentas,
      icon: DollarSign,
      color: 'bg-oliva/10 text-oliva',
      href: '/admin/ventas',
      isCurrency: false,
    },
    {
      title: 'Pedidos Pendientes',
      value: stats.totalPedidosClientes,
      icon: ClipboardList,
      color: 'bg-mostaza/10 text-mostaza',
      href: '/admin/pedidos-clientes',
    },
    {
      title: 'Reservas Activas',
      value: stats.totalReservas,
      icon: CalendarCheck,
      color: 'bg-rojo/10 text-rojo',
      href: '/admin/reservas-clientes',
    },
    {
      title: 'Producción del Mes',
      value: stats.produccionDelMes,
      icon: Factory,
      color: 'bg-marron/10 text-marron',
      href: '/admin/produccion',
    },
    {
      title: 'Alertas Críticas',
      value: stats.stockCritico,
      icon: AlertTriangle,
      color: stats.stockCritico > 0 ? 'bg-rojo/10 text-rojo' : 'bg-oliva/10 text-oliva',
      href: '/admin/dashboard',
    },
    {
      title: 'Recetas Activas',
      value: stats.recetasActivas,
      icon: BookOpen,
      color: 'bg-oliva/10 text-oliva',
      href: '/admin/recetas',
    },
    {
      title: 'Ventas',
      value: stats.totalVentas,
      icon: Receipt,
      color: 'bg-marron/10 text-marron',
      href: '/admin/ventas',
    },
    {
      title: 'Productos Activos',
      value: stats.productosActivos,
      icon: Package,
      color: 'bg-mostaza/10 text-mostaza',
      href: '/admin/productos',
    },
    {
      title: 'Materias Primas',
      value: stats.totalMateriasPrimas,
      icon: Leaf,
      color: 'bg-oliva/10 text-oliva',
      href: '/admin/materias-primas',
    },
    {
      title: 'Insumos',
      value: stats.totalInsumos,
      icon: PackageOpen,
      color: 'bg-mostaza/10 text-mostaza',
      href: '/admin/insumos',
    },
    {
      title: 'Productos Terminados',
      value: stats.totalProductosTerminados,
      icon: UtensilsCrossed,
      color: 'bg-rojo/10 text-rojo',
      href: '/admin/productos-terminados',
    },
    {
      title: 'Compras',
      value: stats.totalCompras,
      icon: ShoppingCart,
      color: 'bg-marron/10 text-marron',
      href: '/admin/compras',
    },
    {
      title: 'Pedidos Proveedores',
      value: stats.totalPedidos,
      icon: ClipboardList,
      color: 'bg-mostaza/10 text-mostaza',
      href: '/admin/pedidos-proveedores',
    },
    {
      title: 'Mov. Stock',
      value: stats.totalMovimientos,
      icon: ArrowLeftRight,
      color: 'bg-oliva/10 text-oliva',
      href: '/admin/stock-movements',
    },
    {
      title: 'Opiniones Pendientes',
      value: stats.opinionesPendientes,
      icon: MessageSquare,
      color: 'bg-rojo/10 text-rojo',
      href: '/admin/opiniones',
    },
    {
      title: 'Interacciones WhatsApp',
      value: stats.interaccionesWhatsApp,
      icon: Phone,
      color: 'bg-whatsapp/10 text-whatsapp',
      href: '/admin/estadisticas',
    },
    {
      title: 'Total Personas',
      value: stats.totalPersonas,
      icon: UserCircle,
      color: 'bg-marron/10 text-marron',
      href: '/admin/personas',
    },
    {
      title: 'Total Usuarios',
      value: stats.totalUsuarios,
      icon: Users,
      color: 'bg-oliva/10 text-oliva',
      href: '/admin/usuarios',
    },
  ]

  const firstName = session?.user?.name?.split(' ')[0] || 'Admin'

  return (
    <div className="space-y-6">
      {/* ─── Header with Greeting + Help Button ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-marron">
            ¡Hola, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido al panel de administración de Pastas Orlando
          </p>
        </div>


      </div>

      {/* ─── Alerts Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {!alertsLoading && alertsData && (
          <motion.div
            variants={alertPanelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {totalAlerts === 0 ? (
              /* ── All OK Card ── */
              <Card className="border-oliva/30 bg-oliva/5">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-oliva/20 p-2">
                      <CheckCircle className="h-5 w-5 text-oliva" />
                    </div>
                    <p className="font-medium text-oliva">
                      ✅ Todo está en orden — No hay alertas activas
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* ── Comprehensive Alerts Panel ── */
              <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
                <Card className="border-rojo/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-marron/5 transition-colors rounded-t-lg pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-rojo/15 p-2">
                            <AlertTriangle className="h-5 w-5 text-rojo" />
                          </div>
                          <div>
                            <CardTitle className="text-base text-marron">
                              Panel de Alertas
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {alertsData!.resumen.criticas > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {alertsData!.resumen.criticas} críticas
                                </Badge>
                              )}
                              {alertsData!.resumen.medias > 0 && (
                                <Badge className="text-xs bg-orange-500 text-white border-orange-500">
                                  {alertsData!.resumen.medias} medias
                                </Badge>
                              )}
                              {alertsData!.resumen.informativas > 0 && (
                                <Badge className="text-xs bg-blue-500 text-white border-blue-500">
                                  {alertsData!.resumen.informativas} informativas
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: alertsOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-5 space-y-4">
                      <Separator className="mb-1" />

                      {/* Category tabs */}
                      <div className="flex flex-wrap gap-1.5">
                        {activeCategories.map(cat => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setActiveAlertCategory(cat.key)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                              activeAlertCategory === cat.key
                                ? 'bg-marron text-crema shadow-sm'
                                : 'bg-muted text-muted-foreground hover:bg-marron/10 hover:text-marron'
                            }`}
                          >
                            <cat.meta.icon className="h-3.5 w-3.5" />
                            {cat.meta.label}
                            <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              activeAlertCategory === cat.key
                                ? 'bg-crema/20 text-crema'
                                : 'bg-marron/10 text-marron'
                            }`}>
                              {cat.total}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Alert items for active category */}
                      {activeCategories
                        .filter(cat => cat.key === activeAlertCategory)
                        .map(cat => (
                          <div key={cat.key} className="space-y-2">
                            {cat.alerts.map((alert: AlertEntry, idx: number) => {
                              const sev = SEVERITY_META[alert.severity]
                              const SevIcon = sev.icon
                              return (
                                <Link key={idx} href={alert.href}>
                                  <motion.div
                                    whileHover={{ scale: 1.005 }}
                                    whileTap={{ scale: 0.995 }}
                                    className={`rounded-lg border ${sev.border} ${sev.bg} p-3 transition-colors hover:brightness-95`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <SevIcon className={`h-4 w-4 ${sev.color}`} />
                                      <span className={`font-semibold text-sm ${sev.color}`}>
                                        {alert.count} {alert.label}
                                      </span>
                                      <Badge variant="outline" className={`text-[10px] ml-auto ${sev.color} border-current`}>
                                        {alert.severity === 'critica' ? '🔴 Crítica' : alert.severity === 'media' ? '🟠 Media' : '🔵 Info'}
                                      </Badge>
                                    </div>
                                    {alert.items.length > 0 && (
                                      <div className="ml-6 mt-1 space-y-1">
                                        {alert.items.slice(0, 5).map(item => (
                                          <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="truncate mr-2">{item.nombre}</span>
                                            {item.stock_actual !== undefined && item.stock_minimo !== undefined ? (
                                              <span className="font-mono shrink-0">
                                                {item.stock_actual} / {item.stock_minimo}
                                              </span>
                                            ) : item.fecha ? (
                                              <span className="font-mono shrink-0">
                                                {new Date(item.fecha).toLocaleDateString('es-AR')}
                                              </span>
                                            ) : null}
                                          </div>
                                        ))}
                                        {alert.items.length > 5 && (
                                          <p className="text-xs text-muted-foreground italic mt-1">
                                            y {alert.items.length - 5} más...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </motion.div>
                                </Link>
                              )
                            })}
                          </div>
                        ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Metric Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="hover:shadow-lg transition-shadow border-marron/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="text-3xl font-bold text-marron">
                    {card.value}
                  </div>
                )}
                <Link href={card.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 -ml-2 text-xs text-muted-foreground hover:text-marron"
                  >
                    Ver detalles
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Quick Access ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="border-marron/5">
          <CardHeader>
            <CardTitle className="text-lg text-marron">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/admin/ventas">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-oliva hover:bg-oliva/5"
                >
                  <Receipt className="mr-3 h-5 w-5 text-oliva" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Ventas</div>
                    <div className="text-xs text-muted-foreground">Registrar ventas y descontar stock</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/pedidos-clientes">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-mostaza hover:bg-mostaza/5"
                >
                  <ClipboardList className="mr-3 h-5 w-5 text-mostaza" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Pedidos de Clientes</div>
                    <div className="text-xs text-muted-foreground">Gestionar pedidos y entregas</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/reservas-clientes">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-rojo hover:bg-rojo/5"
                >
                  <CalendarCheck className="mr-3 h-5 w-5 text-rojo" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Reservas</div>
                    <div className="text-xs text-muted-foreground">Reservas de productos con seña</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/recetas">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-oliva hover:bg-oliva/5"
                >
                  <BookOpen className="mr-3 h-5 w-5 text-oliva" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Recetas</div>
                    <div className="text-xs text-muted-foreground">Recetas de producción y costos</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/produccion">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-marron hover:bg-marron/5"
                >
                  <Factory className="mr-3 h-5 w-5 text-marron" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Producción</div>
                    <div className="text-xs text-muted-foreground">Producir y consumir stock</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/compras">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-marron hover:bg-marron/5"
                >
                  <ShoppingCart className="mr-3 h-5 w-5 text-marron" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Compras</div>
                    <div className="text-xs text-muted-foreground">Registrar compras y actualizar stock</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/pedidos-proveedores">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-mostaza hover:bg-mostaza/5"
                >
                  <ClipboardList className="mr-3 h-5 w-5 text-mostaza" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Pedidos a Proveedores</div>
                    <div className="text-xs text-muted-foreground">Seguimiento de pedidos pendientes</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/materias-primas">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-oliva hover:bg-oliva/5"
                >
                  <Leaf className="mr-3 h-5 w-5 text-oliva" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Materias Primas</div>
                    <div className="text-xs text-muted-foreground">Gestionar stock de materias primas</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/insumos">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-mostaza hover:bg-mostaza/5"
                >
                  <PackageOpen className="mr-3 h-5 w-5 text-mostaza" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Insumos</div>
                    <div className="text-xs text-muted-foreground">Envases, bandejas, bolsas</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/productos-terminados">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-rojo hover:bg-rojo/5"
                >
                  <UtensilsCrossed className="mr-3 h-5 w-5 text-rojo" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Productos Terminados</div>
                    <div className="text-xs text-muted-foreground">Pastas para producción y venta</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/stock-movements">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-oliva hover:bg-oliva/5"
                >
                  <ArrowLeftRight className="mr-3 h-5 w-5 text-oliva" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Movimientos de Stock</div>
                    <div className="text-xs text-muted-foreground">Historial de entradas y salidas</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/productos">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-mostaza hover:bg-mostaza/5"
                >
                  <Package className="mr-3 h-5 w-5 text-mostaza" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Catálogo Landing</div>
                    <div className="text-xs text-muted-foreground">Productos visibles al público</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/opiniones">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-mostaza hover:bg-mostaza/5"
                >
                  <MessageSquare className="mr-3 h-5 w-5 text-rojo" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Moderar Opiniones</div>
                    <div className="text-xs text-muted-foreground">Aprobar o rechazar reseñas</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/auditoria">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-oliva hover:bg-oliva/5"
                >
                  <Shield className="mr-3 h-5 w-5 text-oliva" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Auditoría</div>
                    <div className="text-xs text-muted-foreground">Registro de acciones del sistema</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/reportes">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-mostaza hover:bg-mostaza/5"
                >
                  <FileBarChart className="mr-3 h-5 w-5 text-mostaza" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Reportes</div>
                    <div className="text-xs text-muted-foreground">Reportes exportables Excel/PDF</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/estadisticas">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-marron/10 hover:border-mostaza hover:bg-mostaza/5"
                >
                  <Phone className="mr-3 h-5 w-5 text-whatsapp" />
                  <div className="text-left">
                    <div className="font-medium text-marron">Estadísticas WhatsApp</div>
                    <div className="text-xs text-muted-foreground">Ver interacciones y datos</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
