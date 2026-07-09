'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Loader2, LogOut, LayoutDashboard, Package, MessageSquare, BarChart3, Users, UserCircle, Leaf, PackageOpen, UtensilsCrossed, FolderTree, Tag, Ruler, ChevronDown, ChevronRight, ShoppingCart, ClipboardList, ArrowLeftRight, Settings, Receipt, CalendarCheck, BookOpen, Utensils, Factory, Shield, FileBarChart, KeyRound, FileSearch, MonitorSmartphone, Truck, MapPin, Map, Bell, History, AlertTriangle, Send, FileText, AlertCircle, Mail, Printer, HelpCircle, Database, Layers } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ChatAssistant from '@/components/admin/ChatAssistant'
import StaticHelp from '@/components/admin/StaticHelp'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Productos',
    href: '/admin/productos',
    icon: Package,
  },
]

const stockItems = [
  {
    title: 'Materias Primas',
    href: '/admin/materias-primas',
    icon: Leaf,
  },
  {
    title: 'Insumos',
    href: '/admin/insumos',
    icon: PackageOpen,
  },
  {
    title: 'Productos Terminados',
    href: '/admin/productos-terminados',
    icon: UtensilsCrossed,
  },
  {
    title: 'Recetas',
    href: '/admin/recetas',
    icon: BookOpen,
  },
  {
    title: 'Producción',
    href: '/admin/produccion',
    icon: Factory,
  },
  {
    title: 'Etiquetas',
    href: '/admin/etiquetas',
    icon: Printer,
  },
]


const contenidoItems = [
  {
    title: 'Recetas de Cocina',
    href: '/admin/recetas-cocina',
    icon: Utensils,
  },
]

const comprasItems = [
  {
    title: 'Compras',
    href: '/admin/compras',
    icon: ShoppingCart,
  },
  {
    title: 'Pedidos a Proveedores',
    href: '/admin/pedidos-proveedores',
    icon: ClipboardList,
  },
]

const ventasItems = [
  {
    title: 'Pedidos de Clientes',
    href: '/admin/pedidos-clientes',
    icon: ClipboardList,
  },
  {
    title: 'Presupuestos',
    href: '/admin/presupuestos',
    icon: FileText,
  },
  {
    title: 'Promociones',
    href: '/admin/promociones',
    icon: Tag,
  },
  {
    title: 'Descuentos x Volumen',
    href: '/admin/descuentos-volumen',
    icon: Layers,
  },
  {
    title: 'Ventas',
    href: '/admin/ventas',
    icon: Receipt,
  },
  {
    title: 'Reservas de Clientes',
    href: '/admin/reservas-clientes',
    icon: CalendarCheck,
  },
]

const stockMovimientoItems = [
  {
    title: 'Movimientos',
    href: '/admin/stock-movements',
    icon: ArrowLeftRight,
  },
]

const notificacionesItems = [
  {
    title: 'Plantillas',
    href: '/admin/notificaciones/plantillas',
    icon: Bell,
  },
  {
    title: 'Historial',
    href: '/admin/notificaciones/historial',
    icon: History,
  },
  {
    title: 'Alertas',
    href: '/admin/notificaciones/alertas',
    icon: AlertTriangle,
  },
  {
    title: 'Enviar Manual',
    href: '/admin/notificaciones/enviar',
    icon: Send,
  },
]

const logisticaItems = [
  {
    title: 'Entregas',
    href: '/admin/logistica/entregas',
    icon: Truck,
  },
  {
    title: 'Puntos de Encuentro',
    href: '/admin/logistica/puntos-encuentro',
    icon: MapPin,
  },
  {
    title: 'Mapa de Entregas',
    href: '/admin/logistica/mapa-entregas',
    icon: Map,
  },
  {
    title: 'Mapa de Proveedores',
    href: '/admin/logistica/mapa-proveedores',
    icon: MapPin,
  },
]

const configItems = [
  {
    title: 'Categorías',
    href: '/admin/categorias',
    icon: FolderTree,
  },
  {
    title: 'Marcas',
    href: '/admin/marcas',
    icon: Tag,
  },
  {
    title: 'Unidades de Medida',
    href: '/admin/unidades-medida',
    icon: Ruler,
  },
  {
    title: 'General',
    href: '/admin/configuracion',
    icon: Settings,
  },
]

const auditoriaItems = [
  {
    title: 'Auditoría',
    href: '/admin/auditoria',
    icon: Shield,
  },
  {
    title: 'Backup',
    href: '/admin/backup',
    icon: Database,
  },
  {
    title: 'Reportes Generales',
    href: '/admin/reportes',
    icon: FileBarChart,
  },
  {
    title: 'Compras Pendientes',
    href: '/admin/reportes/compras-pendientes',
    icon: AlertCircle,
  },
  {
    title: 'Hoja de Ruta',
    href: '/admin/reportes/hoja-ruta',
    icon: Truck,
  },
  {
    title: 'Pedidos del Día',
    href: '/admin/reportes/pedidos-dia',
    icon: ClipboardList,
  },
]

const seguridadItems = [
  {
    title: 'Permisos',
    href: '/admin/usuarios/permisos',
    icon: Shield,
  },
  {
    title: 'Mi 2FA',
    href: '/admin/perfil/2fa',
    icon: KeyRound,
  },
  {
    title: 'Logs de Acceso',
    href: '/admin/seguridad/logs-acceso',
    icon: FileSearch,
  },
  {
    title: 'Sesiones',
    href: '/admin/seguridad/sesiones',
    icon: MonitorSmartphone,
  },
]

const otherItems = [
  {
    title: 'Personas',
    href: '/admin/personas',
    icon: UserCircle,
  },
  {
    title: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
  },
  {
    title: 'Opiniones',
    href: '/admin/opiniones',
    icon: MessageSquare,
  },
  {
    title: 'Consultas',
    href: '/admin/consultas',
    icon: Mail,
  },
  {
    title: 'Estadísticas',
    href: '/admin/estadisticas',
    icon: BarChart3,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [unreadConsultas, setUnreadConsultas] = useState(0)
  const [stockOpen, setStockOpen] = useState(true)
  const [contenidoOpen, setContenidoOpen] = useState(false)
  const [comprasOpen, setComprasOpen] = useState(false)
  const [ventasOpen, setVentasOpen] = useState(false)
  const [stockMovOpen, setStockMovOpen] = useState(false)
  const [logisticaOpen, setLogisticaOpen] = useState(false)
  const [notificacionesOpen, setNotificacionesOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [auditoriaOpen, setAuditoriaOpen] = useState(false)
  const [seguridadOpen, setSeguridadOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const isContenidoActive = contenidoItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isStockActive = stockItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isComprasActive = comprasItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isVentasActive = ventasItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isStockMovActive = stockMovimientoItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isLogisticaActive = logisticaItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isNotificacionesActive = notificacionesItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isConfigActive = configItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isAuditoriaActive = auditoriaItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  const isSeguridadActive = seguridadItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  // Poll unread consultas count for sidebar badge every 30s
  useEffect(() => {
    if (status !== 'authenticated') return

    let active = true
    const load = () => {
      fetch('/api/consultas/count')
        .then(r => r.ok ? r.json() : { noLeidos: 0 })
        .then(d => { if (active) setUnreadConsultas(d.noLeidos || 0) })
        .catch(() => {})
    }

    load()
    const interval = setInterval(load, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [status, pathname])

  // Toggle section handler
  const toggleSection = (section: 'stock' | 'contenido' | 'compras' | 'ventas' | 'stockMov' | 'logistica' | 'notificaciones' | 'config' | 'auditoria' | 'seguridad', currentOpen: boolean) => {
    switch (section) {
      case 'stock': setStockOpen(!currentOpen); break
      case 'compras': setComprasOpen(!currentOpen); break
      case 'ventas': setVentasOpen(!currentOpen); break
      case 'stockMov': setStockMovOpen(!currentOpen); break
      case 'logistica': setLogisticaOpen(!currentOpen); break
      case 'notificaciones': setNotificacionesOpen(!currentOpen); break
      case 'config': setConfigOpen(!currentOpen); break
      case 'auditoria': setAuditoriaOpen(!currentOpen); break
      case 'seguridad': setSeguridadOpen(!currentOpen); break
    }
  }

  // Auto-open the section that contains the current route on navigation.
  //
  // The previous implementation used `effectiveXOpen = xOpen || isXActive`,
  // which recomputed on every render. That made it impossible to close a
  // section while sitting on one of its subpages: even after the click set
  // `xOpen` to false, `isXActive` stayed true and forced the menu open.
  // ("Ventas no se cierra" — and Compras had the same latent bug, it just
  // wasn't noticed because it was tested from a non-compras page.)
  //
  // Fix: adjust state during render when the route changes (the pattern
  // endorsed by the React docs to avoid useEffect + setState). We only
  // ever OPEN the active section here — never close — so the user's
  // explicit toggle is always respected afterwards.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    if (isContenidoActive) setContenidoOpen(true)
    if (isStockActive) setStockOpen(true)
    if (isComprasActive) setComprasOpen(true)
    if (isVentasActive) setVentasOpen(true)
    if (isStockMovActive) setStockMovOpen(true)
    if (isLogisticaActive) setLogisticaOpen(true)
    if (isNotificacionesActive) setNotificacionesOpen(true)
    if (isConfigActive) setConfigOpen(true)
    if (isAuditoriaActive) setAuditoriaOpen(true)
    if (isSeguridadActive) setSeguridadOpen(true)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-crema">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-mostaza mx-auto" />
          <p className="mt-2 text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const renderCollapsibleSection = (
    title: string,
    icon: React.ReactNode,
    items: typeof stockItems,
    isOpen: boolean,
    onToggle: () => void,
    isActive: boolean
  ) => (
    <SidebarGroup>
      <SidebarGroupContent>
        <button
          onClick={onToggle}
          className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider hover:text-sidebar-foreground ${isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/60'}`}
        >
          {icon}
          <span className="flex-1 text-left">{title}</span>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        {isOpen && (
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="p-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg bg-mostaza/20 flex items-center justify-center p-1 shrink-0">
              <Image
                src="/images/logo.png"
                alt="Pastas Orlando"
                width={32}
                height={32}
                loading="lazy"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-sidebar-foreground truncate">
                Pastas Orlando
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                Administración
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          {/* Main nav */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Stock & Producción */}
          {renderCollapsibleSection(
            'Stock & Producción',
            <Package className="h-3.5 w-3.5" />,
            stockItems,
            stockOpen,
            () => toggleSection('stock', stockOpen),
            isStockActive
          )}

          {/* Contenido */}
          {renderCollapsibleSection(
            'Contenido',
            <Utensils className="h-3.5 w-3.5" />,
            contenidoItems,
            contenidoOpen,
            () => toggleSection('contenido', contenidoOpen),
            isContenidoActive
          )}

          {/* Compras */}
          {renderCollapsibleSection(
            'Compras',
            <ShoppingCart className="h-3.5 w-3.5" />,
            comprasItems,
            comprasOpen,
            () => toggleSection('compras', comprasOpen),
            isComprasActive
          )}

          {/* Ventas */}
          {renderCollapsibleSection(
            'Ventas',
            <Receipt className="h-3.5 w-3.5" />,
            ventasItems,
            ventasOpen,
            () => toggleSection('ventas', ventasOpen),
            isVentasActive
          )}

          {/* Stock Movements */}
          {renderCollapsibleSection(
            'Stock',
            <ArrowLeftRight className="h-3.5 w-3.5" />,
            stockMovimientoItems,
            stockMovOpen,
            () => toggleSection('stockMov', stockMovOpen),
            isStockMovActive
          )}

          {/* Envíos y Logística */}
          {renderCollapsibleSection(
            'Envíos y Logística',
            <Truck className="h-3.5 w-3.5" />,
            logisticaItems,
            logisticaOpen,
            () => toggleSection('logistica', logisticaOpen),
            isLogisticaActive
          )}

          {/* Notificaciones */}
          {renderCollapsibleSection(
            'Notificaciones',
            <Bell className="h-3.5 w-3.5" />,
            notificacionesItems,
            notificacionesOpen,
            () => toggleSection('notificaciones', notificacionesOpen),
            isNotificacionesActive
          )}

          {/* Configuración */}
          {renderCollapsibleSection(
            'Configuración',
            <Settings className="h-3.5 w-3.5" />,
            configItems,
            configOpen,
            () => toggleSection('config', configOpen),
            isConfigActive
          )}

          <SidebarSeparator />

          {/* Auditoría & Reportes */}
          {renderCollapsibleSection(
            'Auditoría & Reportes',
            <Shield className="h-3.5 w-3.5" />,
            auditoriaItems,
            auditoriaOpen,
            () => toggleSection('auditoria', auditoriaOpen),
            isAuditoriaActive
          )}

          {/* Seguridad */}
          {renderCollapsibleSection(
            'Seguridad',
            <KeyRound className="h-3.5 w-3.5" />,
            seguridadItems,
            seguridadOpen,
            () => toggleSection('seguridad', seguridadOpen),
            isSeguridadActive
          )}

          <SidebarSeparator />

          {/* Other items */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {otherItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      tooltip={item.title}
                    >
                      <Link href={item.href} className="flex items-center gap-2 w-full">
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.title === 'Consultas' && unreadConsultas > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                            {unreadConsultas > 99 ? '99+' : unreadConsultas}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {session.user?.name}
                </span>
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {session.user?.email}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpOpen(true)}
            className="gap-1.5 text-muted-foreground hover:text-marron hover:bg-mostaza/10"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Ayuda</span>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-muted-foreground hidden sm:block">
            {session.user?.name}
          </span>
        </header>
        <div className="flex-1 p-4 md:p-6 bg-crema overflow-auto">
          {children}
        </div>
      </SidebarInset>
      <ChatAssistant />
      <StaticHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </SidebarProvider>
  )
}
