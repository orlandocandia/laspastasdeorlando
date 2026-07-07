'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Boxes,
  BookOpen,
  Factory,
  Receipt,
  ShoppingCart,
  Users,
  Settings,
  FileBarChart,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  BookMarked,
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Layers,
  TrendingUp,
  ShieldCheck,
  Shield,
  Bell,
  Truck,
  MapPin,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Tag,
  Ruler,
  Lock,
  Eye,
  Database,
  Clock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HelpSection {
  id: string
  title: string
  iconComponent: React.ComponentType<{ className?: string }>
  summary: string
  content: React.ReactNode
}

interface StaticHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Step Circle Helper ───────────────────────────────────────────────────────

function StepCircle({ n }: { n: number }) {
  return (
    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-oliva/15 text-oliva text-xs font-bold">
      {n}
    </span>
  )
}

function InfoBox({ type, children }: { type: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip: 'bg-mostaza/10 border border-mostaza/20',
    warning: 'bg-rojo/10 border border-rojo/20',
    info: 'bg-oliva/10 border border-oliva/20',
  }
  const icons = {
    tip: <Lightbulb className="h-4 w-4 text-mostaza shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-rojo shrink-0" />,
    info: <Info className="h-4 w-4 text-oliva shrink-0" />,
  }
  const titles = {
    tip: 'Consejo',
    warning: 'Atención',
    info: 'Información',
  }
  return (
    <div className={`${styles[type]} rounded-lg p-3 my-3`}>
      <div className="flex items-center gap-2 font-semibold text-sm mb-1">
        {icons[type]}
        <span>{titles[type]}</span>
      </div>
      <div className="text-sm text-muted-foreground pl-6">{children}</div>
    </div>
  )
}

function ModuleRef({ name }: { name: string }) {
  return <span className="text-oliva font-medium">Módulo {name} →</span>
}

// ─── Help Sections Data ───────────────────────────────────────────────────────

const helpSections: HelpSection[] = [
  // ─── 1. Introducción ──────────────────────────────────────────────────
  {
    id: 'introduccion',
    title: 'Introducción',
    iconComponent: LayoutDashboard,
    summary: 'Bienvenida al sistema ERP de Las Pastas de Orlando y flujo de trabajo recomendado.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión <strong className="text-marron">Las Pastas de Orlando</strong>,
          una plataforma integral diseñada específicamente para fábricas de pastas artesanales.
          Este ERP te permite centralizar y controlar todos los aspectos operativos de tu negocio
          de manera sencilla y eficiente.
        </p>

        <div className="bg-crema/60 rounded-lg p-4 border border-mostaza/10">
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-mostaza" />
            Beneficios principales
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Control de stock</strong> en tiempo real de productos terminados, materias primas e insumos</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Seguimiento de producción</strong> desde la receta hasta el producto terminado</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Gestión de ventas</strong> con registro automático, presupuestos y pedidos</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Reportes completos</strong> exportables a Excel y PDF</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Alertas automáticas</strong> de stock bajo y crítico</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-mostaza" />
            Flujo de trabajo recomendado
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Para comenzar a usar el sistema de manera óptima, te recomendamos seguir estos pasos en orden:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Configurar el sistema</p>
                <p className="text-xs text-muted-foreground">
                  Definí categorías, marcas, unidades de medida y formas de pago en{' '}
                  <ModuleRef name="Configuración" />
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Cargar materias primas e insumos</p>
                <p className="text-xs text-muted-foreground">
                  Registrá todas las materias primas e insumos con sus datos y stock inicial en{' '}
                  <ModuleRef name="Stock" />
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Crear productos terminados y recetas</p>
                <p className="text-xs text-muted-foreground">
                  Dá de alta tus productos y vinculá cada uno con su receta en{' '}
                  <ModuleRef name="Productos" /> y <ModuleRef name="Recetas" />
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <div>
                <p className="font-medium text-sm">Registrar producción</p>
                <p className="text-xs text-muted-foreground">
                  Producí tus productos usando las recetas; el stock se actualizará automáticamente en{' '}
                  <ModuleRef name="Producción" />
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <div>
                <p className="font-medium text-sm">Vender y analizar</p>
                <p className="text-xs text-muted-foreground">
                  Registrá ventas, consultá reportes y gestioná pedidos en{' '}
                  <ModuleRef name="Ventas" /> y <ModuleRef name="Reportes" />
                </p>
              </div>
            </div>
          </div>
        </div>

        <InfoBox type="info">
          Este manual cubre cada módulo del sistema en detalle. Usá la tabla de contenidos
          o el buscador para encontrar rápidamente la información que necesitás.
        </InfoBox>
      </div>
    ),
  },

  // ─── 1b. Navegación y Menú Lateral ─────────────────────────────────────
  {
    id: 'navegacion-menu',
    title: 'Navegación y Menú Lateral',
    iconComponent: BookMarked,
    summary: 'Cómo moverse por el panel: colapsar/expandir secciones del menú lateral, buscar y usar la tabla de contenidos.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El menú lateral izquierdo organiza todos los módulos del sistema en{' '}
          <strong className="text-marron">secciones colapsables</strong>. Entender cómo navegarlo te
          ahorrará tiempo.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-mostaza" />
            Colapsar y expandir secciones
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            El menú está agrupado en secciones (cada una con un título en mayúsculas y un icono):
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mb-3">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Stock &amp; Producción</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Compras</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Ventas</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Stock</strong> (movimientos)</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Envíos y Logística</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Notificaciones</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Configuración</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Auditoría &amp; Reportes</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Seguridad</strong></span></li>
          </ul>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Hacé clic en el título de la sección</p>
                <p className="text-xs text-muted-foreground">
                  Un clic sobre el encabezado (ej: “Ventas”) <strong>abre</strong> la sección y muestra
                  sus sub-módulos. La flecha cambia de <ChevronRight className="inline h-3 w-3" /> a <ChevronDown className="inline h-3 w-3" />.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Otro clic la cierra</p>
                <p className="text-xs text-muted-foreground">
                  Un segundo clic sobre el mismo encabezado <strong>cierra</strong> la sección. Podés
                  tener varias secciones abiertas a la vez, o ninguna.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Apertura automática al navegar</p>
                <p className="text-xs text-muted-foreground">
                  Cuando entrás a una página (ej: <strong>/admin/ventas</strong>), la sección que la
                  contiene se <strong>abre automáticamente</strong> para que veas dónde estás. Igual,
                  después podés cerrarla manualmente con un clic.
                </p>
              </div>
            </div>
          </div>
          <InfoBox type="info">
            El menú se puede ocultar por completo con el botón <strong>SidebarTrigger</strong> (icono
            de menú en la barra superior izquierda) para ganar espacio de pantalla, especialmente útil
            en dispositivos móviles.
          </InfoBox>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Search className="h-4 w-4 text-mostaza" />
            Buscador de la ayuda
          </h4>
          <p className="text-sm text-muted-foreground">
            En el panel de ayuda (botón <strong>“Ayuda”</strong> de la barra superior) hay un{' '}
            <strong>buscador</strong> que filtra las secciones por título o contenido. Escribí una
            palabra clave y te mostrará solo las secciones relevantes, con la tabla de contenidos a la
            izquierda para saltar entre ellas.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-mostaza" />
            Atajos útiles
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>El <strong>Dashboard</strong> siempre es el primer ítem del menú y el punto de partida.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>En <strong>Personas → Consultas</strong> un badge rojo muestra la cantidad de consultas no leídas.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>El <strong>asistente virtual</strong> (botón flotante abajo a la derecha) responde dudas sin abrir la ayuda.</span></li>
          </ul>
        </div>
      </div>
    ),
  },

  // ─── 2. Productos ─────────────────────────────────────────────────────
  {
    id: 'productos',
    title: 'Productos',
    iconComponent: Package,
    summary: 'Gestión de productos terminados, stock mínimo, alertas visuales y filtros rápidos.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Productos</strong> es el corazón del sistema.
          Aquí gestionás todos los productos terminados que fabricás y vendés, junto con su información
          de stock, precios y categorías.
        </p>

        {/* Productos Terminados */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-mostaza" />
            Productos Terminados
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Los productos terminados son los artículos que producís y vendés. Cada producto tiene la siguiente información:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Nombre:</strong> denominación del producto (ej: "Sorrentinos de Jamón y Queso")</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Descripción:</strong> detalle adicional, ingredientes destacados, presentación</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Precio:</strong> precio de venta al público</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Categoría:</strong> agrupación lógica (ej: "Pasta Rellena", "Pasta Seca")</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Código de barras:</strong> identificación única para lectura rápida</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Stock actual y stock mínimo:</strong> cantidades disponibles y umbral de alerta</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Imagen:</strong> foto del producto para catálogo y panel</span>
            </li>
          </ul>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <p className="text-sm text-muted-foreground">Hacé clic en <strong>"Nuevo Producto"</strong> para crear uno</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <p className="text-sm text-muted-foreground">Completá los datos requeridos en el formulario</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <p className="text-sm text-muted-foreground">Seleccioná la categoría y la marca correspondiente</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <p className="text-sm text-muted-foreground">Definí el stock mínimo para recibir alertas</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <p className="text-sm text-muted-foreground">Guardá el producto y ya estará disponible para producción y ventas</p>
            </div>
          </div>
        </div>

        {/* Stock mínimo */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-mostaza" />
            Stock mínimo
          </h4>
          <p className="text-sm text-muted-foreground">
            El <strong>stock mínimo</strong> es la cantidad límite debajo de la cual el sistema te alertará
            que necesitás reponer ese producto. Se configura individualmente para cada producto y es clave
            para evitar quedarte sin mercadería.
          </p>
          <InfoBox type="tip">
            Configurá el stock mínimo con un valor realista según tu rotación. Un valor muy alto generará
            alertas innecesarias; uno muy bajo podría dejarte sin stock.
          </InfoBox>
        </div>

        {/* Alertas visuales */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Bell className="h-4 w-4 text-rojo" />
            Alertas visuales
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            El sistema utiliza un código de colores para indicar el estado del stock:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-rojo/10 border border-rojo/20 rounded-lg p-2.5">
              <div className="h-3 w-3 rounded-full bg-rojo shrink-0" />
              <span className="text-sm"><strong className="text-rojo">Rojo — Stock crítico:</strong> el producto tiene stock en 0. No hay unidades disponibles para vender.</span>
            </div>
            <div className="flex items-center gap-3 bg-mostaza/10 border border-mostaza/20 rounded-lg p-2.5">
              <div className="h-3 w-3 rounded-full bg-mostaza shrink-0" />
              <span className="text-sm"><strong className="text-mostaza">Naranja — Stock bajo:</strong> el stock actual está por debajo del stock mínimo definido. Necesitás producir más.</span>
            </div>
            <div className="flex items-center gap-3 bg-oliva/10 border border-oliva/20 rounded-lg p-2.5">
              <div className="h-3 w-3 rounded-full bg-oliva shrink-0" />
              <span className="text-sm"><strong className="text-oliva">Verde — Stock normal:</strong> el stock está por encima del mínimo. Todo bien.</span>
            </div>
          </div>
        </div>

        {/* Cargar Stock */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-mostaza" />
            Cargar Stock
          </h4>
          <p className="text-sm text-muted-foreground">
            El botón <strong>"Cargar Stock"</strong> permite realizar ajustes manuales al stock de un producto.
            Se utiliza para:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Carga inicial:</strong> cuando das de alta un producto y querés indicar el stock que ya tenés</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Ajuste:</strong> para corregir diferencias entre el stock del sistema y el stock físico (inventario)</span>
            </li>
          </ul>
          <InfoBox type="warning">
            El stock de productos terminados se actualiza automáticamente al completar producciones o confirmar ventas.
            Usá "Cargar Stock" solo para cargas iniciales o ajustes manuales.
          </InfoBox>
        </div>

        {/* Filtros rápidos */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-mostaza" />
            Filtros rápidos
          </h4>
          <p className="text-sm text-muted-foreground">
            En la vista de productos encontrarás filtros rápidos que te permiten identificar problemas al instante:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Stock = 0:</strong> muestra solo los productos sin stock disponible (crítico)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Stock bajo:</strong> muestra los productos con stock por debajo del mínimo</span>
            </li>
          </ul>
        </div>

        {/* Catálogo */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-mostaza" />
            Productos Catálogo (landing)
          </h4>
          <p className="text-sm text-muted-foreground">
            El <strong>Catálogo</strong> es la vista pública de tus productos, visible en la página principal
            de tu sitio web. A diferencia de <strong>Productos Terminados</strong> (que es el panel de gestión interna),
            el Catálogo muestra solo los productos que querés que tus clientes vean, con fotos, descripciones y precios.
          </p>
          <InfoBox type="info">
            Para que un producto aparezca en el catálogo público, debés marcarlo como visible y tener una imagen cargada.
            La gestión interna de stock y producción se hace desde Productos Terminados.
          </InfoBox>
        </div>
      </div>
    ),
  },

  // ─── 3. Stock ─────────────────────────────────────────────────────────
  {
    id: 'stock',
    title: 'Stock',
    iconComponent: Boxes,
    summary: 'Control de stock actual y mínimo, movimientos automáticos y manuales, alertas de stock.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Stock</strong> te permite conocer en todo momento
          la cantidad disponible de cada producto, materia prima e insumo. El sistema actualiza el stock
          automáticamente según las operaciones que realices.
        </p>

        {/* Stock actual vs mínimo */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Boxes className="h-4 w-4 text-mostaza" />
            Stock actual vs Stock mínimo
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Stock actual:</strong> la cantidad real disponible en este momento. Se modifica automáticamente con producciones, ventas y compras.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Stock mínimo:</strong> el umbral de alerta definido por vos. Si el stock actual cae por debajo, el sistema te avisa.</span>
            </li>
          </ul>
        </div>

        {/* Actualización automática */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Cómo se actualiza el stock automáticamente
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            El sistema maneja el stock de forma automática según las siguientes operaciones:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <ArrowRight className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Producción completada → <span className="text-oliva">SUMA</span> stock de producto terminado</p>
                <p className="text-muted-foreground text-xs">Al completar una producción, se agrega la cantidad producida al stock del producto terminado y se descuentan las materias primas e insumos utilizados.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-rojo/5 border border-rojo/15 rounded-lg p-3">
              <ArrowRight className="h-4 w-4 text-rojo shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Venta confirmada → <span className="text-rojo">DESCUENTA</span> stock de producto terminado</p>
                <p className="text-muted-foreground text-xs">Al confirmar una venta, se descuentan las cantidades vendidas del stock de cada producto terminado.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <ArrowRight className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Compra confirmada → <span className="text-oliva">SUMA</span> stock de materia prima/insumo</p>
                <p className="text-muted-foreground text-xs">Al confirmar una compra, se agrega la cantidad comprada al stock de cada materia prima o insumo.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cargar Stock manual */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-mostaza" />
            Cargar Stock (ajuste manual)
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Cuando necesitás ajustar el stock manualmente, usá la función <strong>"Cargar Stock"</strong>.
            Los tipos de movimiento manual son:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Carga inicial:</strong> para ingresar el stock que ya tenés al momento de empezar a usar el sistema</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Ajuste:</strong> para corregir diferencias tras un conteo físico de inventario</span>
            </li>
          </ul>
          <InfoBox type="tip">
            Hacé inventarios periódicos y usá "Ajuste" para mantener el stock del sistema sincronizado con la realidad.
          </InfoBox>
        </div>

        {/* Movimientos */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-mostaza" />
            Movimientos de Stock
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Cada vez que el stock cambia, el sistema registra un <strong>movimiento</strong> con toda la información
            de la operación. Podés consultar el historial completo de movimientos con estos tipos:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2 bg-crema/60 border border-mostaza/10 rounded-md p-2 text-sm">
              <Badge variant="outline" className="text-oliva border-oliva/30 text-xs">Carga inicial</Badge>
              <span className="text-muted-foreground">Stock inicial al configurar</span>
            </div>
            <div className="flex items-center gap-2 bg-crema/60 border border-mostaza/10 rounded-md p-2 text-sm">
              <Badge variant="outline" className="text-oliva border-oliva/30 text-xs">Producción</Badge>
              <span className="text-muted-foreground">Stock generado al producir</span>
            </div>
            <div className="flex items-center gap-2 bg-crema/60 border border-mostaza/10 rounded-md p-2 text-sm">
              <Badge variant="outline" className="text-rojo border-rojo/30 text-xs">Venta</Badge>
              <span className="text-muted-foreground">Stock descontado al vender</span>
            </div>
            <div className="flex items-center gap-2 bg-crema/60 border border-mostaza/10 rounded-md p-2 text-sm">
              <Badge variant="outline" className="text-oliva border-oliva/30 text-xs">Compra</Badge>
              <span className="text-muted-foreground">Stock sumado al comprar</span>
            </div>
            <div className="flex items-center gap-2 bg-crema/60 border border-mostaza/10 rounded-md p-2 text-sm">
              <Badge variant="outline" className="text-mostaza border-mostaza/30 text-xs">Ajuste</Badge>
              <span className="text-muted-foreground">Corrección manual de stock</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Cada movimiento registra: fecha, tipo, producto, cantidad, descripción y usuario responsable.
          </p>
        </div>

        {/* Alertas de stock */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rojo" />
            Alertas de Stock
          </h4>
          <p className="text-sm text-muted-foreground">
            En el panel principal (Dashboard) verás banners de alerta cuando haya productos con stock bajo o crítico.
            Estos banners te permiten ir directamente al producto para tomar acción. El código de colores es:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-rojo shrink-0 mt-1" />
              <span><strong>Rojo:</strong> Stock en 0 — Sin unidades disponibles</span>
            </li>
            <li className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-mostaza shrink-0 mt-1" />
              <span><strong>Naranja:</strong> Stock bajo — Por debajo del mínimo configurado</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },

  // ─── 4. Recetas ───────────────────────────────────────────────────────
  {
    id: 'recetas',
    title: 'Recetas',
    iconComponent: BookOpen,
    summary: 'Creación y gestión de recetas que vinculan productos terminados con materias primas e insumos.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          Las <strong className="text-marron">Recetas</strong> son la conexión entre los productos terminados
          y las materias primas e insumos necesarios para fabricarlos. Sin una receta, no es posible registrar
          la producción de un producto.
        </p>

        {/* Qué es una receta */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-mostaza" />
            ¿Qué es una receta?
          </h4>
          <p className="text-sm text-muted-foreground">
            Una receta define los ingredientes y cantidades exactas que se necesitan para producir una unidad
            de un producto terminado. Es la fórmula que el sistema usa para calcular cuánta materia prima
            e insumos consumir al producir.
          </p>
        </div>

        {/* Estructura */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-mostaza" />
            Estructura de una receta
          </h4>
          <div className="bg-crema/60 rounded-lg p-4 border border-mostaza/10">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-marron" />
                <span className="font-medium">Producto Terminado</span>
                <span className="text-muted-foreground">— El producto que se fabrica (ej: Sorrentinos JyQ x12)</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-mostaza">+</span>
                  <span className="font-medium">DetalleReceta (MP)</span>
                  <span className="text-muted-foreground">— Materias primas con cantidades (ej: 500g harina, 300g jamón)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-mostaza">+</span>
                  <span className="font-medium">DetalleReceta (Insumos)</span>
                  <span className="text-muted-foreground">— Insumos con cantidades (ej: 1 bolsa, 2 etiquetas)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cómo crear */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Cómo crear una receta
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <p className="text-sm text-muted-foreground">Hacé clic en <strong>"Nueva Receta"</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <p className="text-sm text-muted-foreground">Seleccioná el <strong>producto terminado</strong> para el cual querés crear la receta</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <p className="text-sm text-muted-foreground">Agregá las <strong>materias primas</strong> con sus cantidades (ej: 500 gr de harina)</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <p className="text-sm text-muted-foreground">Agregá los <strong>insumos</strong> necesarios (ej: 1 bolsa de empaque)</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <p className="text-sm text-muted-foreground">Revisá los datos y <strong>guardá</strong> la receta</p>
            </div>
          </div>
        </div>

        {/* Uso en producción */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Factory className="h-4 w-4 text-mostaza" />
            Cómo se usan las recetas en Producción
          </h4>
          <p className="text-sm text-muted-foreground">
            Cuando creás una producción, seleccionás la receta y la cantidad a producir. El sistema
            automáticamente:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Calcula las cantidades totales de MP e insumos necesarias (cantidad receta × cantidad a producir)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Verifica que haya stock suficiente antes de iniciar la producción</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Al completar la producción, descuenta los insumos y MP usados</span>
            </li>
          </ul>
        </div>

        <InfoBox type="tip">
          Siempre creá la receta <strong>antes</strong> de intentar producir un producto. Sin receta, el sistema
          no podrá calcular los materiales necesarios ni registrar la producción correctamente.
        </InfoBox>

        <InfoBox type="warning">
          Si modificás una receta que ya fue usada en producciones anteriores, las producciones ya registradas
          no se alteran. La nueva receta solo aplicará a futuras producciones.
        </InfoBox>
      </div>
    ),
  },

  // ─── 5. Producción ────────────────────────────────────────────────────
  {
    id: 'produccion',
    title: 'Producción',
    iconComponent: Factory,
    summary: 'Flujo completo de producción: desde la receta hasta el stock final, estados y verificaciones.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Producción</strong> es el proceso central del sistema.
          Es la forma principal de agregar stock a los productos terminados, transformando materias primas
          e insumos en productos listos para vender.
        </p>

        {/* Flujo completo */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Factory className="h-4 w-4 text-mostaza" />
            Flujo de producción completo
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Seleccionar receta</p>
                <p className="text-xs text-muted-foreground">
                  Elegí la receta del producto que querés fabricar. Cada receta define los ingredientes necesarios.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Definir cantidad a producir</p>
                <p className="text-xs text-muted-foreground">
                  Indicá cuántas unidades del producto terminado vas a fabricar. El sistema calculará automáticamente
                  los materiales necesarios.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Iniciar producción</p>
                <p className="text-xs text-muted-foreground">
                  Al iniciar, el sistema verifica que haya stock suficiente de todas las materias primas e insumos.
                  Si falta algo, te informará qué materiales no alcanzan.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <div>
                <p className="font-medium text-sm">Completar producción</p>
                <p className="text-xs text-muted-foreground">
                  Al completar, el sistema descuenta automáticamente las MP e insumos del stock y suma las unidades
                  producidas al stock del producto terminado. Se registran todos los movimientos de stock.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verificación de stock */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-oliva" />
            Verificación de stock al iniciar
          </h4>
          <p className="text-sm text-muted-foreground">
            Antes de permitir que una producción comience, el sistema verifica que exista stock suficiente
            de <strong>todas</strong> las materias primas e insumos requeridos por la receta. Si algún material
            no alcanza, se mostrará un aviso con el detalle de qué falta y cuánto.
          </p>
          <InfoBox type="warning">
            No es posible iniciar una producción si no hay stock suficiente de los materiales. Primero debés
            comprar o cargar las materias primas/insumos necesarios.
          </InfoBox>
        </div>

        {/* Descuento al completar */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Qué pasa al completar la producción
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Al marcar una producción como completada, el sistema ejecuta automáticamente:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-rojo shrink-0 font-bold">−</span>
              <span>Descuenta del stock las <strong>materias primas</strong> utilizadas</span>
            </li>
            <li className="flex gap-2">
              <span className="text-rojo shrink-0 font-bold">−</span>
              <span>Descuenta del stock los <strong>insumos</strong> utilizados</span>
            </li>
            <li className="flex gap-2">
              <span className="text-oliva shrink-0 font-bold">+</span>
              <span>Suma al stock la cantidad producida del <strong>producto terminado</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Registra los <strong>movimientos de stock</strong> correspondientes</span>
            </li>
          </ul>
        </div>

        {/* Estados */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-mostaza" />
            Estados de producción
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-mostaza/5 border border-mostaza/15 rounded-lg p-2.5">
              <Badge className="bg-mostaza/20 text-mostaza border-mostaza/30 text-xs">Pendiente</Badge>
              <span className="text-sm text-muted-foreground">Producción creada pero aún no iniciada</span>
            </div>
            <div className="flex items-center gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-2.5">
              <Badge className="bg-oliva/20 text-oliva border-oliva/30 text-xs">En proceso</Badge>
              <span className="text-sm text-muted-foreground">Producción iniciada, en curso de fabricación</span>
            </div>
            <div className="flex items-center gap-3 bg-oliva/10 border border-oliva/20 rounded-lg p-2.5">
              <Badge className="bg-oliva/30 text-oliva border-oliva/30 text-xs">Completada</Badge>
              <span className="text-sm text-muted-foreground">Producción finalizada, stock actualizado</span>
            </div>
            <div className="flex items-center gap-3 bg-rojo/5 border border-rojo/15 rounded-lg p-2.5">
              <Badge className="bg-rojo/20 text-rojo border-rojo/30 text-xs">Cancelada</Badge>
              <span className="text-sm text-muted-foreground">Producción anulada, no se modifica el stock</span>
            </div>
          </div>
        </div>

        <InfoBox type="info">
          La producción es el <strong>único mecanismo automático</strong> para agregar stock a los productos
          terminados. Las ventas y los ajustes manuales son las otras formas de modificar el stock.
        </InfoBox>
      </div>
    ),
  },

  // ─── 6. Ventas ────────────────────────────────────────────────────────
  {
    id: 'ventas',
    title: 'Ventas',
    iconComponent: Receipt,
    summary: 'Registro de ventas, métodos de pago, presupuestos, pedidos de clientes y reservas.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Ventas</strong> te permite registrar todas las operaciones
          de venta, gestionar presupuestos, pedidos de clientes y reservas. El stock se actualiza automáticamente
          al confirmar una venta.
        </p>

        {/* Registrar venta */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-mostaza" />
            Registrar una venta
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <p className="text-sm text-muted-foreground">Hacé clic en <strong>"Nueva Venta"</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <p className="text-sm text-muted-foreground">Seleccioná los <strong>productos terminados</strong> que vas a vender</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <p className="text-sm text-muted-foreground">Indicá las <strong>cantidades</strong> de cada producto</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <p className="text-sm text-muted-foreground">Seleccioná el <strong>método de pago</strong> (efectivo, transferencia, etc.)</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <p className="text-sm text-muted-foreground">Opcionalmente seleccioná el <strong>cliente</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={6} />
              <p className="text-sm text-muted-foreground"><strong>Confirmá</strong> la venta — el stock se descuenta automáticamente</p>
            </div>
          </div>
        </div>

        {/* Stock automático */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Descuento automático de stock
          </h4>
          <p className="text-sm text-muted-foreground">
            Al confirmar la venta, el sistema descuenta automáticamente las cantidades vendidas del stock de
            cada producto terminado. Si algún producto no tiene stock suficiente, el sistema te avisará antes
            de confirmar.
          </p>
          <InfoBox type="warning">
            Verificá siempre que haya stock suficiente antes de confirmar una venta. El sistema validará
            las cantidades, pero es buena práctica revisar el stock previamente.
          </InfoBox>
        </div>

        {/* Métodos de pago */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-mostaza" />
            Métodos de pago
          </h4>
          <p className="text-sm text-muted-foreground">
            Los métodos de pago se configuran en <ModuleRef name="Configuración" /> (Formas de Pago).
            Los más comunes son:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Efectivo</strong> — Pago en efectivo al momento de la venta</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Transferencia bancaria</strong> — Transferencia a la cuenta del negocio</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>MercadoPago</strong> — Pago a través de la plataforma</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Personalizado</strong> — Podés crear los métodos que necesites</span>
            </li>
          </ul>
        </div>

        {/* Historial */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-mostaza" />
            Historial de ventas
          </h4>
          <p className="text-sm text-muted-foreground">
            Todas las ventas quedan registradas con: fecha, productos, cantidades, precios, método de pago,
            cliente y total. Podés filtrar por fecha, cliente o producto para análisis específicos.
          </p>
        </div>

        {/* Presupuestos */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-mostaza" />
            Presupuestos
          </h4>
          <p className="text-sm text-muted-foreground">
            Los presupuestos permiten generar cotizaciones para clientes sin afectar el stock. Podés:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Crear presupuestos con productos, cantidades y precios</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Enviar el presupuesto al cliente para su aprobación</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Convertir un presupuesto aprobado en una venta con un solo clic</span>
            </li>
          </ul>
          <InfoBox type="info">
            Mientras un presupuesto esté pendiente, el stock no se reserva ni se descuenta. Solo al convertirlo
            en venta confirmada se afecta el stock.
          </InfoBox>
        </div>

        {/* Pedidos de Clientes */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-mostaza" />
            Pedidos de Clientes
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Los pedidos de clientes permiten gestionar órdenes con seguimiento de estado:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-mostaza/5 border border-mostaza/15 rounded-lg p-2.5">
              <Badge className="bg-mostaza/20 text-mostaza border-mostaza/30 text-xs">Pendiente</Badge>
              <span className="text-sm text-muted-foreground">Pedido recibido, sin iniciar preparación</span>
            </div>
            <div className="flex items-center gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-2.5">
              <Badge className="bg-oliva/20 text-oliva border-oliva/30 text-xs">En proceso</Badge>
              <span className="text-sm text-muted-foreground">Pedido en preparación</span>
            </div>
            <div className="flex items-center gap-3 bg-oliva/10 border border-oliva/20 rounded-lg p-2.5">
              <Badge className="bg-oliva/30 text-oliva border-oliva/30 text-xs">Listo</Badge>
              <span className="text-sm text-muted-foreground">Pedido listo para entregar</span>
            </div>
            <div className="flex items-center gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-2.5">
              <Badge className="bg-marron/10 text-marron border-marron/20 text-xs">Entregado</Badge>
              <span className="text-sm text-muted-foreground">Pedido entregado al cliente</span>
            </div>
          </div>
        </div>

        {/* Reservas */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-mostaza" />
            Reservas
          </h4>
          <p className="text-sm text-muted-foreground">
            Las reservas permiten a los clientes apartar productos con anticipación, generalmente con un seña
            o depósito. El sistema registra la reserva con los datos del cliente, los productos reservados
            y el monto del depósito. Al confirmar la entrega, se convierte en una venta.
          </p>
        </div>
      </div>
    ),
  },

  // ─── 7. Compras ───────────────────────────────────────────────────────
  {
    id: 'compras',
    title: 'Compras',
    iconComponent: ShoppingCart,
    summary: 'Registro de compras a proveedores, actualización automática de stock y pedidos a proveedores.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Compras</strong> te permite registrar las compras
          de materias primas e insumos a proveedores. Al confirmar una compra, el stock se actualiza
          automáticamente.
        </p>

        {/* Registrar compra */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-mostaza" />
            Registrar una compra
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <p className="text-sm text-muted-foreground">Hacé clic en <strong>"Nueva Compra"</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <p className="text-sm text-muted-foreground">Seleccioná el <strong>proveedor</strong> (ver <ModuleRef name="Clientes y Proveedores" />)</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <p className="text-sm text-muted-foreground">Agregá los <strong>items</strong> (materias primas e insumos) con sus cantidades y precios</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <p className="text-sm text-muted-foreground">Revisá el total y los datos</p>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <p className="text-sm text-muted-foreground"><strong>Confirmá</strong> la compra — el stock se actualiza automáticamente</p>
            </div>
          </div>
        </div>

        {/* Stock automático */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Actualización automática de stock
          </h4>
          <p className="text-sm text-muted-foreground">
            Al confirmar una compra, el sistema suma automáticamente las cantidades compradas al stock
            de cada materia prima e insumo. Se registran los movimientos de stock correspondientes con tipo "Compra".
          </p>
        </div>

        {/* Proveedores */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-mostaza" />
            Vinculación con Proveedores
          </h4>
          <p className="text-sm text-muted-foreground">
            Cada compra se asocia a un proveedor registrado en el módulo de{' '}
            <ModuleRef name="Clientes y Proveedores" />. Esto permite:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Llevar un historial de compras por proveedor</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Consultar datos de contacto del proveedor rápidamente</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Generar reportes de compras agrupados por proveedor</span>
            </li>
          </ul>
        </div>

        {/* Pedidos a Proveedores */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Truck className="h-4 w-4 text-mostaza" />
            Pedidos a Proveedores
          </h4>
          <p className="text-sm text-muted-foreground">
            Podés registrar pedidos a proveedores para hacer seguimiento de las órdenes de compra pendientes.
            Los pedidos a proveedores tienen los siguientes estados:
          </p>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-3 bg-mostaza/5 border border-mostaza/15 rounded-lg p-2.5">
              <Badge className="bg-mostaza/20 text-mostaza border-mostaza/30 text-xs">Pendiente</Badge>
              <span className="text-sm text-muted-foreground">Pedido enviado al proveedor, sin recibir</span>
            </div>
            <div className="flex items-center gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-2.5">
              <Badge className="bg-oliva/20 text-oliva border-oliva/30 text-xs">Recibido</Badge>
              <span className="text-sm text-muted-foreground">Mercadería recibida, se puede confirmar la compra</span>
            </div>
          </div>
          <InfoBox type="tip">
            Usá los Pedidos a Proveedores para planificar tus compras. Cuando la mercadería llegue, confirmá
            la compra y el stock se actualizará automáticamente.
          </InfoBox>
        </div>
      </div>
    ),
  },

  // ─── 8. Clientes y Proveedores ────────────────────────────────────────
  {
    id: 'clientes-proveedores',
    title: 'Clientes y Proveedores',
    iconComponent: Users,
    summary: 'Gestión de personas: clientes para ventas y proveedores para compras, con contactos y dirección.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Personas</strong> te permite gestionar tanto clientes
          como proveedores en un solo lugar. Cada persona puede ser cliente, proveedor o ambos.
        </p>

        {/* Personas */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-mostaza" />
            Gestión de Personas
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Cada persona registrada en el sistema puede tener los siguientes datos:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Nombre/Razón social:</strong> nombre completo del contacto o empresa</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Tipo:</strong> Cliente, Proveedor o ambos</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Documento:</strong> DNI o CUIT para facturación</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Teléfono:</strong> número de contacto</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Email:</strong> correo electrónico para notificaciones y presupuestos</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Dirección:</strong> domicilio para entregas y correspondencia</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Notas:</strong> observaciones o comentarios adicionales</span>
            </li>
          </ul>
        </div>

        {/* Clientes */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-mostaza" />
            Clientes
          </h4>
          <p className="text-sm text-muted-foreground">
            Los clientes se vinculan con las ventas. Al registrar una venta, podés seleccionar el cliente
            para asociarla a su historial. Esto permite:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Consultar el historial de compras de cada cliente</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Generar presupuestos personalizados</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Gestionar pedidos y reservas</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Enviar notificaciones por email o WhatsApp</span>
            </li>
          </ul>
        </div>

        {/* Proveedores */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Truck className="h-4 w-4 text-mostaza" />
            Proveedores
          </h4>
          <p className="text-sm text-muted-foreground">
            Los proveedores se vinculan con las compras. Al registrar una compra, podés seleccionar el proveedor
            para asociarla a su historial. Esto permite:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Consultar el historial de compras a cada proveedor</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Comparar precios entre proveedores</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Registrar pedidos a proveedores con seguimiento</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Acceder rápidamente a datos de contacto</span>
            </li>
          </ul>
        </div>

        <InfoBox type="tip">
          Mantené los datos de contacto actualizados para poder usar las funciones de notificaciones
          por email y WhatsApp desde el sistema.
        </InfoBox>
      </div>
    ),
  },

  // ─── 9. Configuración ─────────────────────────────────────────────────
  {
    id: 'configuracion',
    title: 'Configuración',
    iconComponent: Settings,
    summary: 'Categorías, marcas, unidades de medida, notificaciones y seguridad del sistema.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Configuración</strong> te permite personalizar
          el sistema según las necesidades de tu negocio. Desde aquí gestionás las tablas maestras,
          las notificaciones y la seguridad.
        </p>

        {/* Categorías */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-mostaza" />
            Categorías
          </h4>
          <p className="text-sm text-muted-foreground">
            Las categorías te permiten agrupar productos y materias primas de forma lógica. Ejemplos:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Para productos terminados:</strong> "Pasta Rellena", "Pasta Seca", "Salsas", "Postres"</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Para materias primas:</strong> "Harinas", "Lácteos", "Cárnicos", "Condimentos"</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Para insumos:</strong> "Envases", "Etiquetado", "Material de empaque"</span>
            </li>
          </ul>
          <InfoBox type="tip">
            Definí las categorías <strong>antes</strong> de cargar productos. Una buena estructura de categorías
            facilita la búsqueda, el filtrado y los reportes.
          </InfoBox>
        </div>

        {/* Marcas */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-mostaza" />
            Marcas
          </h4>
          <p className="text-sm text-muted-foreground">
            Las marcas identifican la procedencia o línea de cada producto. Por ejemplo, si fabricás
            productos bajo diferentes líneas (clásica, premium, orgánica), cada una puede ser una marca.
            También se usan para materias primas (ej: marca del proveedor).
          </p>
        </div>

        {/* Unidades de Medida */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Ruler className="h-4 w-4 text-mostaza" />
            Unidades de Medida
          </h4>
          <p className="text-sm text-muted-foreground">
            Las unidades de medida definen cómo se cuantifican los productos, materias primas e insumos.
            Las más comunes son:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            <div className="bg-crema/60 border border-mostaza/10 rounded-md p-2 text-center text-sm">
              <strong>kg</strong> — Kilogramos
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-md p-2 text-center text-sm">
              <strong>gr</strong> — Gramos
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-md p-2 text-center text-sm">
              <strong>u</strong> — Unidades
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-md p-2 text-center text-sm">
              <strong>lt</strong> — Litros
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-md p-2 text-center text-sm">
              <strong>ml</strong> — Mililitros
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-md p-2 text-center text-sm">
              <strong>pack</strong> — Paquetes
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Podés crear tantas unidades como necesites. Cada producto, materia prima e insumo tiene una unidad
            de medida asignada.
          </p>
        </div>

        {/* Notificaciones */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Bell className="h-4 w-4 text-mostaza" />
            Notificaciones
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            El sistema cuenta con un módulo de notificaciones que incluye:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Plantillas:</strong> mensajes predefinidos para situaciones comunes (stock bajo, pedido listo, etc.)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Historial:</strong> registro de todas las notificaciones enviadas</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Alertas de stock:</strong> notificaciones automáticas cuando un producto llega al mínimo</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Envío manual:</strong> enviá notificaciones por email o WhatsApp a clientes y proveedores</span>
            </li>
          </ul>
        </div>

        {/* Seguridad */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Lock className="h-4 w-4 text-mostaza" />
            Seguridad
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            El sistema incluye funcionalidades de seguridad para proteger la información:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <ShieldCheck className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Roles y permisos:</strong> definí qué puede hacer cada usuario (admin, vendedor, operador)</span>
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Autenticación de dos factores (2FA):</strong> capa extra de seguridad para accesos sensibles</span>
            </li>
            <li className="flex gap-2">
              <Eye className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Registro de accesos:</strong> historial de inicios de sesión por usuario</span>
            </li>
            <li className="flex gap-2">
              <Eye className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span><strong>Sesiones activas:</strong> visualizá y gestioná las sesiones abiertas</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },

  // ─── 10. Reportes ─────────────────────────────────────────────────────
  {
    id: 'reportes',
    title: 'Reportes',
    iconComponent: FileBarChart,
    summary: 'Reportes de producción, ventas, finanzas, stock, compras, logística y exportaciones.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Reportes</strong> te brinda información clave
          para tomar decisiones. Desde reportes de producción y ventas hasta logística y finanzas,
          todo es exportable a Excel y PDF.
        </p>

        {/* Reportes disponibles */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-mostaza" />
            Reportes disponibles
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <Factory className="h-4 w-4 text-marron shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Reporte de Producción</p>
                <p className="text-xs text-muted-foreground">Detalle de producciones por período, producto y estado. Incluye cantidades producidas y materiales consumidos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <Receipt className="h-4 w-4 text-marron shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Reporte de Ventas</p>
                <p className="text-xs text-muted-foreground">Ventas por período, producto, cliente y método de pago. Incluye totales y desgloses.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <TrendingUp className="h-4 w-4 text-marron shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Reporte Financiero</p>
                <p className="text-xs text-muted-foreground">Resumen de ingresos (ventas) y egresos (compras) con balance por período.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <Boxes className="h-4 w-4 text-marron shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Reporte de Stock</p>
                <p className="text-xs text-muted-foreground">Estado actual de stock de todos los productos, materias primas e insumos con alertas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <ShoppingCart className="h-4 w-4 text-marron shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Reporte de Compras</p>
                <p className="text-xs text-muted-foreground">Compras por período, proveedor y producto. Incluye totales y evolución.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exportación */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-mostaza" />
            Exportación a Excel y PDF
          </h4>
          <p className="text-sm text-muted-foreground">
            Todos los reportes pueden exportarse en los siguientes formatos:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4 mt-2">
            <li className="flex gap-2">
              <FileSpreadsheet className="h-4 w-4 text-oliva shrink-0" />
              <span><strong>Excel (.xlsx):</strong> para análisis de datos, cálculos adicionales y manipulación</span>
            </li>
            <li className="flex gap-2">
              <FileText className="h-4 w-4 text-rojo shrink-0" />
              <span><strong>PDF:</strong> para presentar, imprimir o compartir con clientes y proveedores</span>
            </li>
          </ul>
        </div>

        {/* Reportes especiales */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-mostaza" />
            Reportes especiales
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <ShoppingCart className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Compras Pendientes</p>
                <p className="text-xs text-muted-foreground">Listado de pedidos a proveedores que aún no fueron recibidos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <Truck className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Hoja de Ruta</p>
                <p className="text-xs text-muted-foreground">Planificación de entregas con orden de visitas y direcciones optimizadas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <ClipboardList className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Pedidos del Día</p>
                <p className="text-xs text-muted-foreground">Todos los pedidos de clientes programados para la fecha actual.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logística */}
        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-mostaza" />
            Logística
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            El sistema incluye herramientas de logística para planificar y visualizar entregas y proveedores:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <Truck className="h-4 w-4 text-mostaza shrink-0 mt-0.5" />
              <span><strong>Entregas:</strong> gestión de entregas con estados y seguimiento</span>
            </li>
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 text-mostaza shrink-0 mt-0.5" />
              <span><strong>Puntos de encuentro:</strong> lugares predefinidos para entregas grupales</span>
            </li>
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 text-mostaza shrink-0 mt-0.5" />
              <span><strong>Mapa de entregas:</strong> visualización geográfica de las entregas del día</span>
            </li>
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 text-mostaza shrink-0 mt-0.5" />
              <span><strong>Mapa de proveedores:</strong> ubicación de proveedores en el mapa para planificar compras</span>
            </li>
          </ul>
          <InfoBox type="info">
            Las funciones de logística con mapas requieren que las direcciones de clientes y proveedores
            estén correctamente cargadas con coordenadas válidas.
          </InfoBox>
        </div>
      </div>
    ),
  },

  // ─── 11. Costos y Rentabilidad ──────────────────────────────────────
  {
    id: 'costos-rentabilidad',
    title: 'Costos y Rentabilidad',
    iconComponent: TrendingUp,
    summary: 'Control de costos de producción, márgenes de ganancia y análisis de rentabilidad por producto.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Costos y Rentabilidad</strong> te permite conocer
          exactamente cuánto te cuesta producir cada producto y qué margen de ganancia obtenés.
          Es fundamental para tomar decisiones de precios y detectar productos poco rentables.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-mostaza" />
            ¿Cómo se calcula el costo?
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            El costo de producción se calcula automáticamente a partir de la <strong>receta activa</strong> del producto:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Se suman los <strong>costos estimados</strong> de todos los ingredientes (MP e insumos) de la receta</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>El total se divide por el <strong>rendimiento</strong> (unidades que produce la receta)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Resultado = <strong>Costo de producción por unidad</strong></span>
            </li>
          </ul>
          <InfoBox type="info">
            Si un producto no tiene receta activa, el costo se muestra como $0 y el margen como 100%.
            Asigná una receta para obtener datos reales.
          </InfoBox>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-mostaza" />
            Margen de ganancia
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            El <strong>margen</strong> es la diferencia entre el precio de venta y el costo de
            producción, expresada en pesos ($) y en porcentaje (%). El porcentaje se calcula así:
          </p>
          <p className="text-sm text-muted-foreground ml-4 mb-3">
            <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">margen_% = (precio_venta − costo_produccion) / precio_venta × 100</code>
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            El margen se muestra con un código de colores para identificar rápidamente la rentabilidad:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <Badge className="bg-oliva/10 text-oliva">🟢 &gt;50%</Badge>
              <span>Margen saludable — buena rentabilidad</span>
            </li>
            <li className="flex gap-2">
              <Badge className="bg-mostaza/10 text-mostaza">🟠 30-50%</Badge>
              <span>Margen moderado — revisar costos o precio</span>
            </li>
            <li className="flex gap-2">
              <Badge className="bg-rojo/10 text-rojo">🔴 &lt;30%</Badge>
              <span>Margen bajo — posiblemente pierde dinero</span>
            </li>
          </ul>
        </div>

        <div className="bg-crema/60 rounded-lg p-4 border border-mostaza/10">
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-mostaza" />
            Ejemplo práctico de cálculo de margen
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Supongamos sorrentinos con estos datos:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground ml-4 mb-3">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Receta activa: costo total de ingredientes = <strong>$1.200</strong> para <strong>4 unidades</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Rendimiento: 4 unidades → <strong>costo por unidad = $1.200 / 4 = $300</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Precio de venta: <strong>$800</strong></span></li>
          </ul>
          <p className="text-sm text-muted-foreground">
            <strong>Margen $</strong> = $800 − $300 = <strong>$500</strong> por unidad.<br />
            <strong>Margen %</strong> = ($500 / $800) × 100 = <strong className="text-oliva">62,5%</strong> → 🟢 Margen saludable.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-mostaza" />
            Reporte de Rentabilidad
          </h4>
          <p className="text-sm text-muted-foreground">
            En el módulo de <ModuleRef name="Reportes" />, la pestaña <strong>"Rentabilidad"</strong> muestra
            una tabla comparativa de todos los productos con su costo, precio de venta, margen en $ y %,
            desglosado por costo de MP y costo de insumos. Podés ordenar por cualquier columna y exportar
            a Excel o PDF.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-mostaza" />
            Dónde ver el margen
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Tabla de Productos:</strong> columna "Margen" con porcentaje colorizado</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Formulario de edición:</strong> sección "Margen de Ganancia" con detalle completo</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Página de detalle:</strong> tarjeta con costo, precio, margen $ y %</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Reportes → Rentabilidad:</strong> análisis completo de todos los productos</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },

  // ─── 12. Promociones ─────────────────────────────────────────────────
  {
    id: 'promociones',
    title: 'Promociones',
    iconComponent: Tag,
    summary: 'Configuración de descuentos, ofertas 2x1 y promociones por tiempo limitado.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Promociones</strong> te permite crear y gestionar
          descuentos y ofertas para tus productos terminados, aumentando las ventas y la visibilidad
          de productos específicos.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-mostaza" />
            Tipos de promoción
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-mostaza/5 border border-mostaza/15 rounded-lg p-3">
              <Badge className="bg-mostaza/10 text-mostaza">%</Badge>
              <div>
                <p className="font-medium text-sm">Descuento Porcentual</p>
                <p className="text-xs text-muted-foreground">Ej: 15% de descuento en todos los sorrentinos. Se aplica un porcentaje al precio de venta.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <Badge className="bg-oliva/10 text-oliva">$</Badge>
              <div>
                <p className="font-medium text-sm">Descuento Fijo</p>
                <p className="text-xs text-muted-foreground">Ej: $500 de descuento en ravioles. Se resta un monto fijo al precio.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-marron/5 border border-marron/15 rounded-lg p-3">
              <Badge className="bg-marron/10 text-marron">2x1</Badge>
              <div>
                <p className="font-medium text-sm">2x1</p>
                <p className="text-xs text-muted-foreground">Comprás 2 y pagás 1. El descuento es del 50% sobre el total.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-rojo/5 border border-rojo/15 rounded-lg p-3">
              <Badge className="bg-rojo/10 text-rojo">⏰</Badge>
              <div>
                <p className="font-medium text-sm">Tiempo Limitado</p>
                <p className="text-xs text-muted-foreground">Oferta con fecha de inicio y fin. Al vencer, se desactiva automáticamente.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4 text-mostaza" />
            Configuración
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Productos participantes:</strong> seleccioná qué productos incluyen la promoción</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Fecha de inicio y fin:</strong> definí el período de vigencia</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span><strong>Aplicar automáticamente:</strong> la promoción se aplica en ventas sin intervención manual</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-mostaza" />
            Cómo crear una promoción (paso a paso)
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Abrir el módulo</p>
                <p className="text-xs text-muted-foreground">
                  Menú lateral → <strong>Ventas → Promociones</strong>. Hacé clic en <strong>“Nueva Promoción”</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Elegir el tipo de descuento</p>
                <p className="text-xs text-muted-foreground">
                  Porcentual (%), Monto fijo ($), 2x1 (50% sobre el total) o Tiempo Limitado (con vigencia).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Seleccionar productos participantes</p>
                <p className="text-xs text-muted-foreground">
                  Elegí qué productos terminados incluyen la promoción. Podés seleccionar varios.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <div>
                <p className="font-medium text-sm">Definir vigencia</p>
                <p className="text-xs text-muted-foreground">
                  Fecha de inicio y fin. Al vencer, la promoción se desactiva automáticamente.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <div>
                <p className="font-medium text-sm">Activar y guardar</p>
                <p className="text-xs text-muted-foreground">
                  Activá la promoción y guardá. Aparecerá automáticamente en la <strong>tienda pública</strong>{' '}
                  (ver sección <ModuleRef name="Promociones en la Tienda Pública" />) y se aplica en ventas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <InfoBox type="tip">
          Combiná promociones con el reporte de <ModuleRef name="Rentabilidad" /> para identificar
          productos con alto margen donde podés ofrecer descuentos sin perder rentabilidad.
        </InfoBox>

        <InfoBox type="info">
          Las promociones <strong>sí se muestran en la tienda pública</strong> (badges de oferta,
          precio tachado y filtro “Solo Ofertas”). Esto las diferencia de los descuentos por volumen,
          que son internos del panel.
        </InfoBox>

        <InfoBox type="tip">
          El <strong>buscador de productos</strong> al crear/editar una promoción muestra <strong>TODOS</strong>{' '}
          los productos terminados (activos, inactivos, visibles y no visibles en la landing, con o sin
          categoría). La búsqueda encuentra coincidencias por <strong>nombre</strong>, <strong>código</strong>{' '}
          y <strong>código de barras</strong>. Ver sección <ModuleRef name="Novedades y Mejoras Recientes" />.
        </InfoBox>
      </div>
    ),
  },

  // ─── 12b. Promociones en la Tienda Pública ────────────────────────────
  {
    id: 'promociones-landing',
    title: 'Promociones en la Tienda Pública',
    iconComponent: Eye,
    summary: 'Cómo se ven las promociones en la landing page: badges de oferta, precio tachado y filtro “Solo Ofertas”.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          Las promociones que creás en <ModuleRef name="Promociones" /> se reflejan automáticamente
          en la <strong className="text-marron">tienda pública</strong> (la landing page que ven los
          clientes). Acá te explicamos cómo se ven y cómo interactúan con la sección de productos.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-mostaza" />
            Badge de oferta en las tarjetas de producto
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Cuando un producto tiene una promoción activa, su tarjeta en la tienda muestra:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Un <strong>badge rojo “🔥 XX%”</strong> (o el monto) en la esquina superior derecha de la imagen, con animación pulsante.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>El <strong>precio original tachado</strong> en color gris.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>El <strong>precio final en rojo</strong> y en negrita, justo debajo.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Al dar vuelta la tarjeta (clic/tap), se repite el detalle de la promoción con su nombre.</span>
            </li>
          </ul>
          <InfoBox type="info">
            El badge de promoción tiene <strong>prioridad</strong> sobre el badge “⭐ Destacado”:
            si un producto está destacado y además tiene promoción, solo se muestra el de promoción.
          </InfoBox>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-mostaza" />
            Filtro “Solo Ofertas”
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            En la sección de productos de la landing, junto a los filtros de harina (Con Gluten /
            Integrales / Sin Gluten), hay un botón <strong>“Solo Ofertas”</strong>.
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Al activarlo, se <strong>desactivan los filtros de harina</strong> (son mutuamente excluyentes) y se muestran únicamente los productos con promoción, sin importar el tipo de harina.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>El botón muestra el <strong>contador de productos en oferta</strong>: “Solo Ofertas (N)”.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Si una <strong>familia</strong> no tiene productos en oferta, se oculta automáticamente cuando el filtro está activo.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Si no hay productos en oferta para el filtro actual, se muestra un mensaje “No hay productos en oferta” con un botón para desactivar el filtro.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-mostaza shrink-0">•</span>
              <span>Dentro de una familia, aparece un <strong>sub-filtro “Ver solo ofertas (N)”</strong> para acotar todavía más.</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-mostaza" />
            Integración con la sección de productos
          </h4>
          <p className="text-sm text-muted-foreground">
            La información de promociones se obtiene del endpoint{' '}
            <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">/api/promociones/public</code>,
            que devuelve las promociones activas y, para cada producto, el{' '}
            <strong>precio original</strong>, <strong>precio final</strong> y una{' '}
            <strong>etiqueta de descuento</strong> legible (ej: “15% OFF”). Este endpoint alimenta
            tanto las tarjetas de producto como el filtro “Solo Ofertas”.
          </p>
        </div>

        <InfoBox type="tip">
          Para que una promoción se vea en la tienda, debe estar <strong>activa</strong> y dentro
          de su <strong>período de vigencia</strong>. Si la desactivás o venció, el producto vuelve
          a mostrar su precio normal automáticamente.
        </InfoBox>
      </div>
    ),
  },

  // ─── 13. Descuentos por Volumen ───────────────────────────────────────
  {
    id: 'descuentos-volumen',
    title: 'Descuentos por Volumen',
    iconComponent: Layers,
    summary: 'Descuentos escalonados por cantidad para ventas mayoristas: cómo crear rangos y cómo se calculan.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Descuentos por Volumen</strong> te permite crear
          descuentos escalonados según la cantidad comprada, ideal para ventas mayoristas y clientes
          que compran en gran volumen. Se accede desde el menú lateral:{' '}
          <ModuleRef name="Ventas → Descuentos por Volumen" />.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-mostaza" />
            ¿Cómo funciona?
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Definís uno o más <strong>descuentos</strong>, y dentro de cada uno definís{' '}
            <strong>rangos de cantidad</strong> con su respectivo descuento. Cuando un cliente
            compra una cantidad que cae en un rango, se aplica el descuento correspondiente.
            Si varios descuentos coinciden para el mismo producto, el sistema elige el que otorgue
            el <strong>mayor beneficio económico</strong> al cliente.
          </p>
          <p className="text-sm text-muted-foreground">
            La fórmula del precio final es: <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">precio_final = máximo(0, precio_original − descuento_aplicado)</code>.
            Es decir, el precio nunca queda negativo.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-mostaza" />
            Cómo crear un descuento por volumen (paso a paso)
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Abrir el módulo</p>
                <p className="text-xs text-muted-foreground">
                  Menú lateral → <strong>Ventas → Descuentos por Volumen</strong>. Hacé clic en{' '}
                  <strong>“Nuevo Descuento”</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Definir los datos generales</p>
                <p className="text-xs text-muted-foreground">
                  Nombre (ej: “Mayorista Sorrentinos”), descripción opcional, ámbito de aplicación
                  y unidad de medida.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Elegir el ámbito de aplicación</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Todos los productos</strong> · <strong>Producto específico</strong> ·{' '}
                  <strong>Categoría</strong> (ej: todos los sorrentinos).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <div>
                <p className="font-medium text-sm">Seleccionar la unidad de medida</p>
                <p className="text-xs text-muted-foreground">
                  Kilogramos (kg), Unidades (u), Bandejas, Docenas o Litros (l). Los rangos se
                  interpretan según esta unidad.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <div>
                <p className="font-medium text-sm">Definir los rangos escalonados</p>
                <p className="text-xs text-muted-foreground">
                  Para cada rango indicás: <strong>cantidad desde</strong>, <strong>cantidad hasta</strong>{' '}
                  (vacío = “en adelante”), <strong>tipo</strong> (porcentaje o monto fijo) y{' '}
                  <strong>valor</strong> del descuento.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={6} />
              <div>
                <p className="font-medium text-sm">Vigencia y estado</p>
                <p className="text-xs text-muted-foreground">
                  Opcionalmente definí <strong>fecha de inicio y fin</strong>. Activá el descuento
                  con el switch <strong>“Activo”</strong> y guardá.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-mostaza" />
            Tipos de descuento por rango
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-mostaza/5 border border-mostaza/15 rounded-lg p-3">
              <Badge className="bg-mostaza/10 text-mostaza">%</Badge>
              <div>
                <p className="font-medium text-sm">Porcentaje</p>
                <p className="text-xs text-muted-foreground">Se calcula sobre el precio de venta. Ej: 10% sobre $2.000 = $200 de descuento.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <Badge className="bg-oliva/10 text-oliva">$</Badge>
              <div>
                <p className="font-medium text-sm">Monto fijo</p>
                <p className="text-xs text-muted-foreground">Se resta directamente del precio. Ej: $100 por unidad al comprar 10 o más.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-crema/60 rounded-lg p-4 border border-mostaza/10">
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-mostaza" />
            Ejemplo práctico: descuento escalonado en sorrentinos
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Supongamos sorrentinos a <strong>$2.000/kg</strong>. Creamos un descuento con unidad{' '}
            <strong>kg</strong> y dos rangos:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded-lg">
              <thead className="bg-mostaza/10">
                <tr>
                  <th className="text-left p-2 font-semibold">Rango</th>
                  <th className="text-left p-2 font-semibold">Cantidad (kg)</th>
                  <th className="text-left p-2 font-semibold">Descuento</th>
                  <th className="text-left p-2 font-semibold">Precio final/kg</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-2">1</td>
                  <td className="p-2">5 a 9,9</td>
                  <td className="p-2">5% (= $100)</td>
                  <td className="p-2 font-semibold text-oliva">$1.900</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-2">2</td>
                  <td className="p-2">10 en adelante</td>
                  <td className="p-2">10% (= $200)</td>
                  <td className="p-2 font-semibold text-oliva">$1.800</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Si un cliente compra <strong>7 kg</strong>, cae en el rango 1 → paga $1.900/kg. Si
            compra <strong>15 kg</strong>, cae en el rango 2 → paga $1.800/kg.
          </p>
        </div>

        <InfoBox type="tip">
          Si un producto tiene tanto una <strong>promoción</strong> como un <strong>descuento por volumen</strong>,
          el sistema compara ambos y aplica el que otorgue el mayor beneficio al cliente. Podés
          combinarlos sin conflicto.
        </InfoBox>

        <InfoBox type="tip">
          Los descuentos por volumen son de <strong>uso interno del panel</strong> y no se muestran
          en la tienda pública. <strong>La aplicación es automática</strong> en los formularios de
          Venta y Presupuesto: al ingresar la cantidad, el sistema consulta{' '}
          <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">/api/descuentos-volumen/calcular</code>{' '}
          (recibe <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">producto_id</code> y{' '}
          <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">cantidad</code>) y aplica el
          mejor descuento. Se muestra el <strong>precio original tachado</strong>, el{' '}
          <strong>% o monto de descuento</strong> y el <strong>precio final</strong>. El descuento se
          persiste en el detalle (<code className="bg-marron/10 px-1 py-0.5 rounded text-xs">descuento_volumen_id</code>,{' '}
          <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">descuento_volumen_valor</code>,{' '}
          <code className="bg-marron/10 px-1 py-0.5 rounded text-xs">descuento_volumen_tipo</code>).
          Si editás el precio manualmente, el descuento se limpia (override).
        </InfoBox>
      </div>
    ),
  },

  // ─── 14. Backup y Restauración ───────────────────────────────────────
  {
    id: 'backup',
    title: 'Backup y Restauración',
    iconComponent: Shield,
    summary: 'Creación de copias de seguridad, descarga y restauración de la base de datos.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Backup</strong> te permite crear copias de seguridad
          de toda la base de datos, descargarlas y restaurarlas en caso de necesidad.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-mostaza" />
            Tipos de backup
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-oliva/15">
                <Database className="h-4 w-4 text-oliva" />
              </div>
              <div>
                <p className="font-medium text-sm">Backup Completo (.db)</p>
                <p className="text-xs text-muted-foreground">Copia exacta del archivo de base de datos. Es la opción más rápida y confiable.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mostaza/15">
                <FileText className="h-4 w-4 text-mostaza" />
              </div>
              <div>
                <p className="font-medium text-sm">Backup SQL (.sql)</p>
                <p className="text-xs text-muted-foreground">Exportación en formato SQL. Útil para migrar a otro motor de base de datos.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rojo" />
            Restauración
          </h4>
          <p className="text-sm text-muted-foreground">
            Al restaurar un backup, se reemplaza la base de datos actual con la copia seleccionada.
            <strong> El sistema crea automáticamente un backup de seguridad</strong> antes de restaurar,
            por si necesitás revertir.
          </p>
          <InfoBox type="warning">
            La restauración reemplaza TODOS los datos actuales. Asegurate de que el backup
            sea el correcto antes de confirmar.
          </InfoBox>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-mostaza" />
            Recomendaciones
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span>Hacé un backup <strong>antes de cambios importantes</strong> (cargas masivas, modificaciones de precios)</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span>Descargá los backups a tu computadora como <strong>copia adicional</strong></span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" />
              <span>Eliminá backups antiguos para <strong>liberar espacio</strong></span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },

  // ─── 15. Impresión Térmica de Etiquetas ──────────────────────────────
  {
    id: 'etiquetas-termicas',
    title: 'Impresión Térmica de Etiquetas',
    iconComponent: FileText,
    summary: 'Generación de etiquetas para impresoras de rollo (Zebra, Brother) en formato PDF y ZPL, con tamaños configurables y vista previa a escala real.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Impresión Térmica</strong> permite generar etiquetas
          para impresoras de rollo (Zebra, Brother, etc.) directamente desde el panel, sin necesidad de
          software de terceros. Se generan dos formatos: <strong>PDF</strong> (una etiqueta por página,
          listo para imprimir desde cualquier PC) y <strong>ZPL</strong> (código nativo Zebra Programming
          Language para envío directo por USB/Bluetooth/red).
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-mostaza" />
            Formatos de salida
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-oliva/5 border border-oliva/15 rounded-lg p-3">
              <Badge className="bg-oliva/10 text-oliva">PDF</Badge>
              <div>
                <p className="font-medium text-sm">PDF (una etiqueta por página)</p>
                <p className="text-xs text-muted-foreground">
                  Tamaño exacto en milímetros, listo para imprimir desde cualquier PC con lector de PDF.
                  Ideal cuando no se dispone de la impresora térmica conectada o se quiere imprimir en otra máquina.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-marron/5 border border-marron/15 rounded-lg p-3">
              <Badge className="bg-marron/10 text-marron">ZPL</Badge>
              <div>
                <p className="font-medium text-sm">ZPL (Zebra Programming Language)</p>
                <p className="text-xs text-muted-foreground">
                  Código nativo para impresoras Zebra. Se envía directamente por USB, Bluetooth o red.
                  Incluye comandos <code className="bg-marron/10 px-1 rounded text-xs">^XA</code>,{' '}
                  <code className="bg-marron/10 px-1 rounded text-xs">^PW</code>,{' '}
                  <code className="bg-marron/10 px-1 rounded text-xs">^FO</code>,{' '}
                  <code className="bg-marron/10 px-1 rounded text-xs">^FD</code> y generación de código
                  de barras con <code className="bg-marron/10 px-1 rounded text-xs">^BY/^BE</code> (EAN-13)
                  o <code className="bg-marron/10 px-1 rounded text-xs">^BC</code> (CODE128).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-mostaza" />
            Tamaños predefinidos (6)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {['40 × 30 mm', '50 × 30 mm', '60 × 40 mm', '70 × 40 mm', '80 × 50 mm', '100 × 60 mm'].map((s) => (
              <div key={s} className="bg-crema/60 border border-mostaza/10 rounded-lg p-2 text-center">
                <p className="text-sm font-medium text-marron">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4 text-mostaza" />
            Campos configurables
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Nombre del producto</strong> (texto principal)</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Precio</strong> (con formato de moneda)</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Peso</strong> (para productos por kilo)</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Código de barras</strong> (EAN-13 o CODE128 según corresponda)</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Fecha de elaboración</strong> y <strong>fecha de vencimiento</strong></span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Categoría</strong> del producto</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-mostaza" />
            Cómo generar etiquetas (paso a paso)
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Abrir el módulo</p>
                <p className="text-xs text-muted-foreground">Menú lateral → <strong>Configuración → Etiquetas</strong> (o desde la fila de un producto terminado).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Elegir el tamaño de etiqueta</p>
                <p className="text-xs text-muted-foreground">Seleccioná uno de los 6 tamaños predefinidos según el rollo que tengas cargado en la impresora.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Marcar los campos a incluir</p>
                <p className="text-xs text-muted-foreground">Activá qué información aparece en la etiqueta: nombre, precio, peso, código de barras, fechas, categoría.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <div>
                <p className="font-medium text-sm">Agregar productos al lote</p>
                <p className="text-xs text-muted-foreground">Podés imprimir una etiqueta sola o un lote: agregá varios productos indicando la cantidad de copias de cada uno.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <div>
                <p className="font-medium text-sm">Vista previa y generar</p>
                <p className="text-xs text-muted-foreground">
                  Revisá la vista previa a escala real. Luego elegí <strong>Descargar PDF</strong> (para imprimir desde cualquier PC)
                  o <strong>Descargar ZPL</strong> / <strong>Copiar al portapapeles</strong> (para envío directo a la impresora Zebra).
                </p>
              </div>
            </div>
          </div>
        </div>

        <InfoBox type="tip">
          La generación es <strong>100 % client-side</strong> (no carga al servidor): usa{' '}
          <code className="bg-marron/10 px-1 rounded text-xs">@react-pdf/renderer</code> para PDF y{' '}
          <code className="bg-marron/10 px-1 rounded text-xs">jsbarcode</code> para los códigos de barras.
        </InfoBox>

        <InfoBox type="info">
          Para enviar ZPL por USB a una Zebra podés usar herramientas como <strong>Zebra Setup Utility</strong>,
          <strong> ZebraPrinterUtils</strong> o un script de Python con <code className="bg-marron/10 px-1 rounded text-xs">pyusb</code>.
          Por Bluetooth o red, copiá el código y pegalo en el puerto configurado de la impresora.
        </InfoBox>
      </div>
    ),
  },

  // ─── 16. Plantillas de Notificaciones ────────────────────────────────
  {
    id: 'plantillas-notificaciones',
    title: 'Plantillas de Notificaciones',
    iconComponent: Bell,
    summary: 'Editor de plantillas con Markdown y variables canónicas ({cliente}, {pedido}, {total}), vista previa y envío de prueba.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          El módulo de <strong className="text-marron">Plantillas de Notificaciones</strong> te permite
          personalizar los mensajes que el sistema envía automáticamente (alertas de stock bajo,
          recordatorios de entrega, etc.) o manualmente por email y WhatsApp. Las plantillas soportan{' '}
          <strong>Markdown</strong> y <strong>variables canónicas</strong> que se reemplazan con datos
          reales al enviar.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Bell className="h-4 w-4 text-mostaza" />
            Características del editor
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Editor con toggle Editar / Vista Markdown:</strong> escribí en Markdown y previsualizá cómo se renderiza (títulos, negritas, listas, etc.).</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Panel de variables canónicas:</strong> lista de todas las variables disponibles con su descripción y contexto de uso.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Click para insertar:</strong> al hacer clic en una variable del panel, se inserta en la posición del cursor del editor.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Variables detectadas:</strong> las variables presentes en la plantilla se marcan con ✓ en el panel.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Previsualización con datos de ejemplo:</strong> vista previa estilo email y estilo WhatsApp con datos simulados.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Envío de prueba:</strong> enviá una notificación de prueba a un destinatario real antes de activar la plantilla.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Activar/desactivar:</strong> desde la lista de plantillas, prendé o apagá cada una sin borrarla.</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-mostaza" />
            Variables canónicas
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Las variables se escriben entre llaves, ej. <code className="bg-marron/10 px-1 rounded text-xs">{'{cliente}'}</code>.
            El sistema soporta tanto <code className="bg-marron/10 px-1 rounded text-xs">{'{var}'}</code> como{' '}
            <code className="bg-marron/10 px-1 rounded text-xs">{'{{var}}'}</code> por compatibilidad.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              '{cliente}', '{pedido}', '{fecha}', '{total}', '{estado}', '{producto}',
            ].map((v) => (
              <div key={v} className="bg-crema/60 border border-mostaza/10 rounded-lg p-2 text-center">
                <code className="text-xs text-marron">{v}</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Las alertas de stock bajo además exponen <code className="bg-marron/10 px-1 rounded text-xs">{'{stock_actual}'}</code>{' '}
            y <code className="bg-marron/10 px-1 rounded text-xs">{'{stock_minimo}'}</code>.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-mostaza" />
            Cómo personalizar una plantilla (paso a paso)
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Abrir el módulo</p>
                <p className="text-xs text-muted-foreground">Menú lateral → <strong>Notificaciones → Plantillas</strong>.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Elegir la plantilla a editar</p>
                <p className="text-xs text-muted-foreground">
                  El sistema incluye plantillas predefinidas (stock bajo, recordatorio de entrega, etc.).
                  Hacé clic en la plantilla que querés personalizar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Editar el contenido en Markdown</p>
                <p className="text-xs text-muted-foreground">
                  Escribí el mensaje usando Markdown para formato. Insertá variables desde el panel lateral
                  con un clic, o tipealas a mano entre llaves.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <div>
                <p className="font-medium text-sm">Previsualizar</p>
                <p className="text-xs text-muted-foreground">
                  Cambiá a la vista de Markdown para ver el renderizado, y a la previsualización con datos
                  de ejemplo para ver cómo llegaría al destinatario (estilo email y WhatsApp).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <div>
                <p className="font-medium text-sm">Enviar prueba y activar</p>
                <p className="text-xs text-muted-foreground">
                  Opcional: enviá una prueba a un destinatario real. Cuando estés conforme, guardá y activá
                  la plantilla. A partir de ese momento, las alertas automáticas la usarán.
                </p>
              </div>
            </div>
          </div>
        </div>

        <InfoBox type="info">
          Si una plantilla está <strong>desactivada</strong> o no existe, el sistema usa un mensaje
          predeterminado (<em>fallback</em>) hardcoded. Por eso, desactivar una plantilla nunca rompe el
          envío de notificaciones.
        </InfoBox>

        <InfoBox type="tip">
          Combiná plantillas personalizadas con el módulo de <ModuleRef name="Reportes" /> para enviar
          resúmenes periódicos a clientes o proveedores con un toque profesional.
        </InfoBox>
      </div>
    ),
  },

  // ─── 17. Filtros Personalizados en Reportes ──────────────────────────
  {
    id: 'filtros-reportes',
    title: 'Filtros Personalizados en Reportes',
    iconComponent: BarChart3,
    summary: 'Filtros por período con presets, producto, cliente, vendedor, categoría y proveedor en reportes de Ventas, Stock y Producción.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          Los <strong className="text-marron">Reportes</strong> ahora incluyen un componente de filtros
          reutilizable y potente que te permite acotar la información por <strong>período</strong> (con
          presets rápidos), <strong>producto</strong>, <strong>cliente</strong>, <strong>vendedor</strong>,
          <strong> categoría</strong> y <strong>proveedor</strong>, según el reporte. La exportación a
          Excel/CSV/PDF respeta los filtros aplicados.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-mostaza" />
            Filtro de período con presets
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Todos los reportes comparten un selector de período con presets de un clic:
          </p>
          <div className="flex flex-wrap gap-2">
            {['Hoy', 'Ayer', 'Últimos 7 días', 'Últimos 30 días', 'Este mes', 'Mes anterior', 'Este año', 'Personalizado'].map((p) => (
              <Badge key={p} variant="outline" className="border-mostaza/30 text-marron">{p}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            El preset <strong>Personalizado</strong> habilita dos calendarios para elegir fecha desde y
            fecha hasta con precisión de día.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-mostaza" />
            Filtros por reporte
          </h4>
          <div className="space-y-2">
            <div className="bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <p className="font-medium text-sm text-marron">Reporte de Ventas</p>
              <p className="text-xs text-muted-foreground">Filtros: <strong>producto</strong>, <strong>cliente</strong>, <strong>vendedor</strong>. Incluye detalle de ventas y ranking por vendedor.</p>
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <p className="font-medium text-sm text-marron">Reporte de Stock</p>
              <p className="text-xs text-muted-foreground">Filtros: <strong>categoría de producto terminado</strong>, <strong>categoría de materia prima</strong>, <strong>proveedor</strong>, <strong>solo stock bajo</strong>.</p>
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <p className="font-medium text-sm text-marron">Reporte de Producción</p>
              <p className="text-xs text-muted-foreground">Filtros: <strong>producto</strong>. Incluye detalle de producciones del período.</p>
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <p className="font-medium text-sm text-marron">Compras y Finanzas</p>
              <p className="text-xs text-muted-foreground">Filtro de período compartido (presets + personalizado).</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-mostaza" />
            Cómo usar los filtros (paso a paso)
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StepCircle n={1} />
              <div>
                <p className="font-medium text-sm">Abrir Reportes</p>
                <p className="text-xs text-muted-foreground">Menú lateral → <strong>Auditoría & Reportes → Reportes Generales</strong>.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={2} />
              <div>
                <p className="font-medium text-sm">Elegir el reporte</p>
                <p className="text-xs text-muted-foreground">Seleccioná Ventas, Stock, Producción, Compras o Finanzas en las pestañas superiores.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={3} />
              <div>
                <p className="font-medium text-sm">Aplicar el período</p>
                <p className="text-xs text-muted-foreground">Elegí un preset (Hoy, Últimos 7 días, etc.) o Personalizado para definir fechas exactas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={4} />
              <div>
                <p className="font-medium text-sm">Aplicar filtros específicos</p>
                <p className="text-xs text-muted-foreground">Según el reporte, elegí producto, cliente, vendedor, categoría o proveedor. Podés combinar varios.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepCircle n={5} />
              <div>
                <p className="font-medium text-sm">Ver resultados y exportar</p>
                <p className="text-xs text-muted-foreground">
                  El reporte se actualiza con los filtros aplicados. Exportá a <strong>Excel</strong>,{' '}
                  <strong>CSV</strong> o <strong>PDF</strong> — la exportación respeta los filtros.
                </p>
              </div>
            </div>
          </div>
        </div>

        <InfoBox type="tip">
          El endpoint <code className="bg-marron/10 px-1 rounded text-xs">/api/reportes/filtros-opciones</code>{' '}
          devuelve en una sola consulta todas las opciones disponibles (productos, clientes, vendedores,
          categorías, proveedores), así el panel carga los selectores sin demoras.
        </InfoBox>

        <InfoBox type="info">
          Los filtros se aplican <strong>del lado del servidor</strong> en la consulta a la base de datos,
          así que aunque el período abarque años, el panel sigue siendo rápido porque solo recibe los
          registros filtrados.
        </InfoBox>
      </div>
    ),
  },

  // ─── 18. Acceso y Contraseñas ────────────────────────────────────────
  {
    id: 'acceso-contrasenas',
    title: 'Acceso y Contraseñas',
    iconComponent: Lock,
    summary: 'Toggle de visibilidad de contraseña (ícono de ojo) en login y creación de usuarios, 2FA y buenas prácticas de acceso.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          La pantalla de <strong className="text-marron">inicio de sesión</strong> y el formulario de{' '}
          <strong className="text-marron">creación/edición de usuarios</strong> incluyen un{' '}
          <strong>toggle de visibilidad de contraseña</strong> (ícono de ojo 👁) que te permite ver el texto
          que estás escribiendo, para evitar errores de tipeo al ingresar o configurar contraseñas.
        </p>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-mostaza" />
            Toggle de visibilidad (ícono de ojo)
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Por defecto, la contraseña se <strong>oculta</strong> (puntos negros).</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Al hacer clic en el ícono del ojo, la contraseña se <strong>muestra</strong> como texto plano.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Otro clic la vuelve a ocultar.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>El botón es <strong>accesible</strong>: <code className="bg-marron/10 px-1 rounded text-xs">aria-label</code> dinámico (“Mostrar contraseña” / “Ocultar contraseña”), <code className="bg-marron/10 px-1 rounded text-xs">type=&quot;button&quot;</code> para no submitir el form, y foco visible con ring.</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-mostaza" />
            Dónde aparece
          </h4>
          <div className="space-y-2">
            <div className="bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <p className="font-medium text-sm text-marron">Pantalla de Login</p>
              <p className="text-xs text-muted-foreground">En <strong>/admin/login</strong>, el campo de contraseña tiene el ojo a la derecha. Útil para verificar la contraseña antes de enviar, especialmente en móviles donde el teclado autocorrige.</p>
            </div>
            <div className="bg-crema/60 border border-mostaza/10 rounded-lg p-3">
              <p className="font-medium text-sm text-marron">Formulario de Usuarios</p>
              <p className="text-xs text-muted-foreground">En <strong>Personas → Usuarios → Nuevo/Editar</strong>, tanto el campo de contraseña como el de confirmación tienen el toggle. Al crear un usuario nuevo, el admin puede ver qué contraseña le está asignando.</p>
            </div>
          </div>
        </div>

        <InfoBox type="tip">
          En móviles, los teclados predictivos suelen autocorregir o capitalizar la primera letra de la
          contraseña. Mostrarla momentáneamente con el ojo te ayuda a detectar estos problemas antes de
          quedar bloqueado por intentos fallidos.
        </InfoBox>

        <div>
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-mostaza" />
            Buenas prácticas de acceso
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" /><span>Activá <strong>2FA (doble factor)</strong> en cuentas de administrador (Menú → Seguridad → Mi 2FA).</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" /><span>Usá contraseñas largas (12+ caracteres) con letras, números y símbolos.</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" /><span>Revisá los <strong>logs de acceso</strong> y las <strong>sesiones activas</strong> periódicamente.</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" /><span>No compartas contraseñas; creá un usuario por persona.</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-oliva shrink-0 mt-0.5" /><span>Volvé a ocultar la contraseña después de verificarla, especialmente en pantallas compartidas.</span></li>
          </ul>
        </div>
      </div>
    ),
  },

  // ─── 19. Novedades y Mejoras Recientes ───────────────────────────────
  {
    id: 'novedades',
    title: 'Novedades y Mejoras Recientes',
    iconComponent: CheckCircle2,
    summary: 'Buscador de promociones que muestra TODOS los productos, alineación del formulario de ventas y otras mejoras.',
    content: (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          Esta sección agrupa las <strong className="text-marron">mejoras y correcciones</strong> más
          recientes del sistema para que las tengas a mano. Si venís usando el sistema desde antes, acá
          encontrás qué cambió.
        </p>

        <div className="bg-oliva/5 border border-oliva/20 rounded-lg p-4">
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Buscador de Promociones: muestra TODOS los productos
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Al crear o editar una promoción, el selector de productos ahora lista <strong>todos</strong> los
            productos terminados, sin filtrar por estado, visibilidad o categoría.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Antes solo se veían los productos <em>activos</em>; ahora también aparecen los inactivos, los no visibles en la landing y los que no tienen categoría asignada.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>La búsqueda ahora encuentra coincidencias por <strong>nombre</strong>, <strong>código</strong> y <strong>código de barras</strong>.</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span>Se cargan hasta 500 productos en una sola consulta para que el buscador los muestre sin paginación lenta.</span></li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Ver sección <ModuleRef name="Promociones" /> para el flujo completo.
          </p>
        </div>

        <div className="bg-crema/60 border border-mostaza/15 rounded-lg p-4">
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Formulario de Ventas: mejor alineación
          </h4>
          <p className="text-sm text-muted-foreground">
            Las filas de detalle del <strong>VentaForm</strong> ahora alinean verticalmente todos los campos
            (producto, cantidad, precio, descuento), incluso cuando aparece el badge de descuento por
            volumen. El escáner de código de barras pasó a usar el componente <code className="bg-marron/10 px-1 rounded text-xs">Input</code>{' '}
            de shadcn/ui, así comparte altura, bordes y radio con el resto del formulario. Resultado: filas
            claras, sin superposición, consistentes con <code className="bg-marron/10 px-1 rounded text-xs">PedidoClienteForm</code>.
          </p>
        </div>

        <div className="bg-mostaza/5 border border-mostaza/15 rounded-lg p-4">
          <h4 className="font-semibold text-marron mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-oliva" />
            Más mejoras en esta versión
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-4">
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Impresión térmica de etiquetas</strong> en PDF y ZPL (ver sección dedicada).</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Plantillas de notificaciones</strong> con Markdown y variables canónicas (ver sección dedicada).</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Filtros personalizados</strong> en reportes de Ventas, Stock y Producción (ver sección dedicada).</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Visibilidad de contraseña</strong> en login y creación de usuarios (ver sección dedicada).</span></li>
            <li className="flex gap-2"><span className="text-mostaza shrink-0">•</span><span><strong>Paquete standalone</strong> para uso local sin internet, con sincronización bidireccional a Turso.</span></li>
          </ul>
        </div>

        <InfoBox type="info">
          ¿No encontrás una funcionalidad donde esperabas? Usá el <strong>buscador de este manual</strong>{' '}
          (arriba a la izquierda) o abrí el <strong>asistente virtual</strong> (botón flotante abajo a la
          derecha) y preguntá en lenguaje natural.
        </InfoBox>
      </div>
    ),
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaticHelp({ open, onOpenChange }: StaticHelpProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState(helpSections[0]?.id ?? '')
  const [tocOpen, setTocOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections
    const q = searchQuery.toLowerCase()
    return helpSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // IntersectionObserver to track active section
  useEffect(() => {
    if (!open) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the section closest to the top that is visible
        const visibleEntries = entries.filter((e) => e.isIntersecting)
        if (visibleEntries.length > 0) {
          // Pick the one with the smallest top (closest to viewport top)
          const topEntry = visibleEntries.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          )
          setActiveSection(topEntry.target.id)
        }
      },
      {
        root: contentRef.current?.querySelector('[data-radix-scroll-area-viewport]') ?? null,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0,
      }
    )

    // Small delay to let the DOM render
    const timer = setTimeout(() => {
      Object.values(sectionRefs.current).forEach((el) => {
        if (el) observer.observe(el)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [open, filteredSections])

  // Handle close with state reset
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchQuery('')
      setTocOpen(false)
    }
    onOpenChange(nextOpen)
  }, [onOpenChange])

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(id)
      setTocOpen(false) // Close mobile TOC
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-full h-full max-w-none sm:max-w-none p-0 gap-0 overflow-hidden border-0 rounded-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Manual de Ayuda - Las Pastas de Orlando</DialogTitle>

        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-marron/10 hover:bg-marron/20 text-marron transition-colors"
          aria-label="Cerrar ayuda"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-full w-full">
          {/* ─── Desktop Sidebar TOC ─────────────────────────────────── */}
          <aside className="hidden md:flex flex-col w-[280px] shrink-0 bg-crema/70 border-r border-mostaza/15">
            {/* Header */}
            <div className="p-4 border-b border-mostaza/15">
              <div className="flex items-center gap-2 mb-3">
                <BookMarked className="h-5 w-5 text-marron" />
                <h2 className="font-bold text-marron text-lg">Manual de Ayuda</h2>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en el manual..."
                  className="pl-8 pr-8 h-8 text-sm bg-white/80 border-mostaza/20 focus:border-mostaza"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-marron"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* TOC Items */}
            <ScrollArea className="flex-1">
              <nav className="p-2">
                {filteredSections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No se encontraron secciones.
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {filteredSections.map((section) => {
                      const Icon = section.iconComponent
                      const isActive = activeSection === section.id
                      return (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-mostaza/15 text-marron font-semibold'
                              : 'text-muted-foreground hover:bg-mostaza/8 hover:text-marron'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-mostaza' : 'text-muted-foreground/60'}`} />
                          <span className="truncate">{section.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-mostaza/15">
              <p className="text-xs text-muted-foreground text-center">
                Las Pastas de Orlando — ERP v1.0
              </p>
            </div>
          </aside>

          {/* ─── Main Content Area ────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Mobile Header + TOC */}
            <div className="md:hidden">
              {/* Mobile Header */}
              <div className="p-3 border-b border-mostaza/15 bg-crema/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-5 w-5 text-marron" />
                    <h2 className="font-bold text-marron">Manual de Ayuda</h2>
                  </div>
                  {/* Close button for mobile is at top-right */}
                </div>
                {/* Mobile Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en el manual..."
                    className="pl-8 pr-8 h-8 text-sm bg-white/80 border-mostaza/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-marron"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {/* Mobile TOC Toggle */}
                <button
                  onClick={() => setTocOpen(!tocOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white/60 border border-mostaza/15 text-sm text-marron hover:bg-mostaza/8 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${tocOpen ? 'rotate-90' : ''}`} />
                    <span>Tabla de contenidos</span>
                  </span>
                  <Badge variant="outline" className="text-xs text-muted-foreground border-mostaza/20">
                    {filteredSections.length} secciones
                  </Badge>
                </button>
              </div>

              {/* Mobile TOC Dropdown */}
              <AnimatePresence>
                {tocOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-crema/50 border-b border-mostaza/15"
                  >
                    <nav className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {filteredSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No se encontraron secciones.
                        </p>
                      ) : (
                        <div className="space-y-0.5">
                          {filteredSections.map((section) => {
                            const Icon = section.iconComponent
                            const isActive = activeSection === section.id
                            return (
                              <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                                  isActive
                                    ? 'bg-mostaza/15 text-marron font-semibold'
                                    : 'text-muted-foreground hover:bg-mostaza/8 hover:text-marron'
                                }`}
                              >
                                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-mostaza' : 'text-muted-foreground/60'}`} />
                                <span className="truncate">{section.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1" ref={contentRef}>
              <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-16">
                {filteredSections.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No se encontraron secciones para &quot;{searchQuery}&quot;
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-mostaza/30 text-marron"
                      onClick={() => setSearchQuery('')}
                    >
                      Limpiar búsqueda
                    </Button>
                  </div>
                ) : (
                  <>
                    {filteredSections.map((section, index) => {
                      const Icon = section.iconComponent
                      return (
                        <motion.div
                          key={section.id}
                          id={section.id}
                          ref={(el) => { sectionRefs.current[section.id] = el }}
                          className={`scroll-mt-4 ${index < filteredSections.length - 1 ? 'mb-12' : ''}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          {/* Section Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mostaza/15">
                              <Icon className="h-5 w-5 text-mostaza" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-marron">{section.title}</h3>
                              <p className="text-xs text-muted-foreground">{section.summary}</p>
                            </div>
                          </div>
                          <Separator className="mb-4 bg-mostaza/20" />

                          {/* Section Content */}
                          <div>{section.content}</div>
                        </motion.div>
                      )
                    })}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-mostaza/15 text-center">
                      <p className="text-sm text-muted-foreground">
                        Fin del manual — Las Pastas de Orlando ERP
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Si necesitás más ayuda, usá el asistente virtual
                        <span className="text-mostaza"> 💬</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
