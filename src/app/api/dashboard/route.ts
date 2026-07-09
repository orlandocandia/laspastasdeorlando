import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Types ───────────────────────────────────────────────────────────────────

type Sev = 'critica' | 'importante' | 'informativo'
type Etapa = 'materias_primas' | 'recetas' | 'produccion' | 'stock' | 'ventas'

interface PasoPendiente {
  id: string
  titulo: string
  descripcion: string
  severidad: Sev
  etapa: Etapa
  accionLabel: string
  href: string
  iconKey: string
  cantidad: number
}

interface IndicadorClave {
  id: string
  label: string
  valor: number
  esMoneda: boolean
  tendencia: 'sube' | 'baja' | 'estable' | 'sin_datos'
  variacionPct: number | null
  contexto: string
  iconKey: string
  href: string
}

type EstadoFlujo = 'ok' | 'pendiente' | 'critico'

interface FlujoStage {
  estado: EstadoFlujo
  label: string
  total: number
  pendientes: number
  detalle: string
  href: string
  iconKey: string
}

interface DashboardResponse {
  pasosPendientes: PasoPendiente[]
  indicadoresClave: IndicadorClave[]
  flujoTrabajo: {
    materias_primas: FlujoStage
    recetas: FlujoStage
    produccion: FlujoStage
    stock: FlujoStage
    ventas: FlujoStage
  }
  resumen: {
    totalPasos: number
    criticas: number
    importantes: number
    informativas: number
    flujoCompletado: number
    flujoTotal: number
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ETAPA_ORDER: Record<Etapa, number> = {
  materias_primas: 0,
  recetas: 1,
  produccion: 2,
  stock: 3,
  ventas: 4,
}

const SEV_ORDER: Record<Sev, number> = {
  critica: 0,
  importante: 1,
  informativo: 2,
}

function pctVariacion(actual: number, anterior: number): number | null {
  if (anterior === 0) {
    return actual > 0 ? 100 : 0
  }
  return Math.round(((actual - anterior) / anterior) * 100)
}

function tendencia(actual: number, anterior: number): 'sube' | 'baja' | 'estable' | 'sin_datos' {
  if (anterior === 0 && actual === 0) return 'sin_datos'
  if (anterior === 0) return actual > 0 ? 'sube' : 'estable'
  if (actual === anterior) return 'estable'
  return actual > anterior ? 'sube' : 'baja'
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    // ─── Parallel queries ─────────────────────────────────────────────────
    const [
      pts,
      mps,
      inss,
      estadoPlanificado,
      estadoEnCurso,
      productosConReceta,
      recetasActivas,
      ventasMes,
      ventasMesPrevio,
      produccionMes,
      produccionMesPrevio,
      pedidosClientePendientes,
      reservasActivas,
      comprasMes,
    ] = await Promise.all([
      db.productoTerminado.findMany({
        where: { estado: true },
        select: { id: true, nombre: true, stock_actual: true, stock_minimo: true, precio_venta: true },
      }),
      db.materiaPrima.findMany({
        where: { estado: true },
        select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
      }),
      db.insumo.findMany({
        where: { estado: true },
        select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
      }),
      db.estadoGeneral.findFirst({ where: { nombre_estado: 'planificado' } }),
      db.estadoGeneral.findFirst({ where: { nombre_estado: 'en_curso' } }),
      db.receta.findMany({ where: { activo: true }, select: { id_producto_terminado: true } }),
      db.receta.findMany({
        where: { activo: true },
        select: { id: true, nombre_receta: true, detalleRecetas: { select: { id: true } } },
      }),
      db.venta.aggregate({ _sum: { total: true }, _count: true, where: { fecha_venta: { gte: startOfMonth } } }),
      db.venta.aggregate({ _sum: { total: true }, _count: true, where: { fecha_venta: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
      db.produccion.aggregate({ _sum: { cantidad_producida: true }, _count: true, where: { fecha_produccion: { gte: startOfMonth } } }),
      db.produccion.aggregate({ _sum: { cantidad_producida: true }, _count: true, where: { fecha_produccion: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
      db.estadoGeneral.findMany({ where: { nombre_estado: { in: ['pendiente', 'confirmado', 'en_proceso'] } } }),
      db.estadoGeneral.findMany({ where: { nombre_estado: { in: ['pendiente', 'confirmada', 'activa'] } } }),
      db.compra.aggregate({ _sum: { total: true }, _count: true, where: { fecha_compra: { gte: startOfMonth } } }),
    ])

    // ─── Stock calculations ──────────────────────────────────────────────
    const ptSinStock = pts.filter(p => p.stock_actual <= 0)
    const ptStockBajo = pts.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo)
    const mpSinStock = mps.filter(m => m.stock_actual <= 0)
    const mpStockBajo = mps.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo)
    const insSinStock = inss.filter(i => i.stock_actual <= 0)
    const insStockBajo = inss.filter(i => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo)

    // ─── Production calculations ─────────────────────────────────────────
    const idsConReceta = new Set(productosConReceta.map(r => r.id_producto_terminado))
    const productosSinReceta = pts.filter(p => !idsConReceta.has(p.id))
    const recetasVacias = recetasActivas.filter(r => r.detalleRecetas.length === 0)

    let estadoProdPendienteIds: number[] = []
    if (estadoPlanificado || estadoEnCurso) {
      estadoProdPendienteIds = [estadoPlanificado?.id, estadoEnCurso?.id].filter((x): x is number => x !== undefined)
    }

    const [produccionPendiente, produccionEnCurso] = await Promise.all([
      estadoProdPendienteIds.length > 0
        ? db.produccion.count({
            where: {
              id_estado: { in: estadoProdPendienteIds },
              fecha_produccion: { lt: twoDaysAgo },
            },
          })
        : Promise.resolve(0),
      estadoProdPendienteIds.length > 0
        ? db.produccion.count({
            where: { id_estado: { in: estadoProdPendienteIds } },
          })
        : Promise.resolve(0),
    ])

    // ─── Clients & orders calculations ───────────────────────────────────
    const estadosPedCliIds = pedidosClientePendientes.map(e => e.id)
    const estadosReservaIds = reservasActivas.map(e => e.id)

    const [pedidosPendientesCount, reservasActivasCount] = await Promise.all([
      estadosPedCliIds.length > 0
        ? db.pedidoCliente.count({
            where: { id_estado: { in: estadosPedCliIds }, fecha_entrega_real: null },
          })
        : Promise.resolve(0),
      estadosReservaIds.length > 0
        ? db.reservaCliente.count({
            where: { id_estado: { in: estadosReservaIds } },
          })
        : Promise.resolve(0),
    ])

    // ─── Build "Pasos Pendientes" (actionable alerts) ────────────────────
    // Ordered by workflow stage (MP → Recetas → Producción → Stock → Ventas)
    // and within each stage by severity (crítica → importante → informativo).
    const pasosPendientes: PasoPendiente[] = []

    // ── Etapa 1: Materias Primas ──
    if (mpSinStock.length > 0) {
      pasosPendientes.push({
        id: 'mp_sin_stock',
        titulo: 'Materias primas agotadas',
        descripcion: `${mpSinStock.length} materia(s) prima(s) sin stock. No se puede producir sin reponer.`,
        severidad: 'critica',
        etapa: 'materias_primas',
        accionLabel: 'Cargar materias primas',
        href: '/admin/compras?materias-primas=agotadas',
        iconKey: 'leaf',
        cantidad: mpSinStock.length,
      })
    }

    if (mpStockBajo.length > 0) {
      pasosPendientes.push({
        id: 'mp_stock_bajo',
        titulo: 'Materias primas con stock bajo',
        descripcion: `${mpStockBajo.length} materia(s) prima(s) por debajo del mínimo. Programar compra.`,
        severidad: 'importante',
        etapa: 'materias_primas',
        accionLabel: 'Ver stock bajo',
        href: '/admin/materias-primas?stock=bajo',
        iconKey: 'leaf',
        cantidad: mpStockBajo.length,
      })
    }

    if (insSinStock.length > 0) {
      pasosPendientes.push({
        id: 'ins_sin_stock',
        titulo: 'Insumos agotados',
        descripcion: `${insSinStock.length} insumo(s) sin stock (envases, bandejas, bolsas).`,
        severidad: 'critica',
        etapa: 'materias_primas',
        accionLabel: 'Ver insumos sin stock',
        href: '/admin/compras?insumos=agotados',
        iconKey: 'package-open',
        cantidad: insSinStock.length,
      })
    }

    if (insStockBajo.length > 0) {
      pasosPendientes.push({
        id: 'ins_stock_bajo',
        titulo: 'Insumos con stock bajo',
        descripcion: `${insStockBajo.length} insumo(s) por debajo del mínimo.`,
        severidad: 'importante',
        etapa: 'materias_primas',
        accionLabel: 'Ver insumos',
        href: '/admin/insumos?stock=bajo',
        iconKey: 'package-open',
        cantidad: insStockBajo.length,
      })
    }

    // ── Etapa 2: Recetas ──
    if (productosSinReceta.length > 0) {
      pasosPendientes.push({
        id: 'pt_sin_receta',
        titulo: 'Productos sin receta',
        descripcion: `${productosSinReceta.length} producto(s) terminado(s) sin receta asociada. No se puede producir.`,
        severidad: 'importante',
        etapa: 'recetas',
        accionLabel: 'Crear recetas',
        href: '/admin/recetas?filtro=sin-receta',
        iconKey: 'book',
        cantidad: productosSinReceta.length,
      })
    }

    if (recetasVacias.length > 0) {
      pasosPendientes.push({
        id: 'receta_vacia',
        titulo: 'Recetas sin ingredientes',
        descripcion: `${recetasVacias.length} receta(s) sin ingredientes cargados.`,
        severidad: 'importante',
        etapa: 'recetas',
        accionLabel: 'Editar recetas',
        href: '/admin/recetas?filtro=vacia',
        iconKey: 'book',
        cantidad: recetasVacias.length,
      })
    }

    // ── Etapa 3: Producción ──
    if (produccionPendiente > 0) {
      pasosPendientes.push({
        id: 'produccion_pendiente',
        titulo: 'Producción pendiente',
        descripcion: `${produccionPendiente} producción(es) pendiente(s) hace más de 2 días.`,
        severidad: 'importante',
        etapa: 'produccion',
        accionLabel: 'Completar producción',
        href: '/admin/produccion?estado=pendiente',
        iconKey: 'factory',
        cantidad: produccionPendiente,
      })
    }

    // ── Etapa 4: Stock ──
    if (ptSinStock.length > 0) {
      pasosPendientes.push({
        id: 'pt_sin_stock',
        titulo: 'Productos sin stock',
        descripcion: `${ptSinStock.length} producto(s) terminado(s) agotado(s). Es necesario producir más.`,
        severidad: 'critica',
        etapa: 'stock',
        accionLabel: 'Producir más',
        href: '/admin/produccion?productos-sin-stock',
        iconKey: 'package',
        cantidad: ptSinStock.length,
      })
    }

    if (ptStockBajo.length > 0) {
      pasosPendientes.push({
        id: 'pt_stock_bajo',
        titulo: 'Productos con stock bajo',
        descripcion: `${ptStockBajo.length} producto(s) por debajo del mínimo. Programar producción.`,
        severidad: 'importante',
        etapa: 'stock',
        accionLabel: 'Programar producción',
        href: '/admin/productos-terminados?stock=bajo',
        iconKey: 'package',
        cantidad: ptStockBajo.length,
      })
    }

    // ── Etapa 5: Ventas ──
    if (pedidosPendientesCount > 0) {
      pasosPendientes.push({
        id: 'pedidos_pendientes',
        titulo: 'Pedidos de clientes pendientes',
        descripcion: `${pedidosPendientesCount} pedido(s) sin entregar.`,
        severidad: 'informativo',
        etapa: 'ventas',
        accionLabel: 'Ver pedidos',
        href: '/admin/pedidos-clientes?estado=pendiente',
        iconKey: 'clipboard',
        cantidad: pedidosPendientesCount,
      })
    }

    if (reservasActivasCount > 0) {
      pasosPendientes.push({
        id: 'reservas_activas',
        titulo: 'Reservas activas',
        descripcion: `${reservasActivasCount} reserva(s) vigente(s) con seña.`,
        severidad: 'informativo',
        etapa: 'ventas',
        accionLabel: 'Ver reservas',
        href: '/admin/reservas-clientes?estado=activa',
        iconKey: 'calendar',
        cantidad: reservasActivasCount,
      })
    }

    // Sort: by etapa (workflow order), then severity, then cantidad desc
    pasosPendientes.sort((a, b) => {
      const etapaDiff = ETAPA_ORDER[a.etapa] - ETAPA_ORDER[b.etapa]
      if (etapaDiff !== 0) return etapaDiff
      const sevDiff = SEV_ORDER[a.severidad] - SEV_ORDER[b.severidad]
      if (sevDiff !== 0) return sevDiff
      return b.cantidad - a.cantidad
    })

    // ─── Build "Indicadores Clave" (with trends) ─────────────────────────
    const ventasMesTotal = ventasMes._sum.total ?? 0
    const ventasMesPrevioTotal = ventasMesPrevio._sum.total ?? 0
    const prodMesCant = produccionMes._sum.cantidad_producida ?? 0
    const prodMesPrevioCant = produccionMesPrevio._sum.cantidad_producida ?? 0

    const indicadoresClave: IndicadorClave[] = [
      {
        id: 'ventas_mes',
        label: 'Ventas del Mes',
        valor: ventasMesTotal,
        esMoneda: true,
        tendencia: tendencia(ventasMesTotal, ventasMesPrevioTotal),
        variacionPct: pctVariacion(ventasMesTotal, ventasMesPrevioTotal),
        contexto: `vs ${formatCurrency(ventasMesPrevioTotal)} mes anterior`,
        iconKey: 'dollar',
        href: '/admin/ventas',
      },
      {
        id: 'produccion_mes',
        label: 'Producción del Mes',
        valor: prodMesCant,
        esMoneda: false,
        tendencia: tendencia(prodMesCant, prodMesPrevioCant),
        variacionPct: pctVariacion(prodMesCant, prodMesPrevioCant),
        contexto: `vs ${prodMesPrevioCant} unidades mes anterior`,
        iconKey: 'factory',
        href: '/admin/produccion',
      },
      {
        id: 'pedidos_pendientes',
        label: 'Pedidos Pendientes',
        valor: pedidosPendientesCount,
        esMoneda: false,
        tendencia: 'sin_datos',
        variacionPct: null,
        contexto: 'pedidos de clientes sin entregar',
        iconKey: 'clipboard',
        href: '/admin/pedidos-clientes',
      },
      {
        id: 'reservas_activas',
        label: 'Reservas Activas',
        valor: reservasActivasCount,
        esMoneda: false,
        tendencia: 'sin_datos',
        variacionPct: null,
        contexto: 'reservas vigentes con seña',
        iconKey: 'calendar',
        href: '/admin/reservas-clientes',
      },
      {
        id: 'compras_mes',
        label: 'Compras del Mes',
        valor: comprasMes._sum.total ?? 0,
        esMoneda: true,
        tendencia: 'sin_datos',
        variacionPct: null,
        contexto: `${comprasMes._count} compra(s) registrada(s)`,
        iconKey: 'cart',
        href: '/admin/compras',
      },
      {
        id: 'stock_critico',
        label: 'Stock Crítico',
        valor: ptSinStock.length + mpSinStock.length + insSinStock.length,
        esMoneda: false,
        tendencia: 'sin_datos',
        variacionPct: null,
        contexto: 'items agotados (PT + MP + Insumos)',
        iconKey: 'alert',
        href: '/admin/dashboard',
      },
    ]

    // ─── Build "Flujo de Trabajo" ────────────────────────────────────────
    const totalMP = mps.length
    const mpPendientes = mpSinStock.length + mpStockBajo.length
    const estadoMP: EstadoFlujo = mpSinStock.length > 0 ? 'critico' : mpStockBajo.length > 0 ? 'pendiente' : 'ok'

    const totalPT = pts.length
    const totalRecetas = recetasActivas.length
    const recetasPendientes = recetasVacias.length + productosSinReceta.length
    const estadoRecetas: EstadoFlujo = productosSinReceta.length > 0 ? 'critico' : recetasVacias.length > 0 ? 'pendiente' : 'ok'

    const estadoProduccion: EstadoFlujo = produccionPendiente > 0 ? 'pendiente' : 'ok'

    const stockPendientes = ptSinStock.length + ptStockBajo.length
    const estadoStock: EstadoFlujo = ptSinStock.length > 0 ? 'critico' : ptStockBajo.length > 0 ? 'pendiente' : 'ok'

    const ventasCount = ventasMes._count
    const estadoVentas: EstadoFlujo = ventasCount === 0 ? 'pendiente' : 'ok'

    const flujoTrabajo = {
      materias_primas: {
        estado: estadoMP,
        label: 'Materias Primas',
        total: totalMP,
        pendientes: mpPendientes,
        detalle: mpSinStock.length > 0
          ? `${mpSinStock.length} sin stock`
          : mpStockBajo.length > 0
            ? `${mpStockBajo.length} con stock bajo`
            : `${totalMP} insumo(s) en orden`,
        href: '/admin/materias-primas',
        iconKey: 'leaf',
      },
      recetas: {
        estado: estadoRecetas,
        label: 'Recetas',
        total: totalRecetas,
        pendientes: recetasPendientes,
        detalle: productosSinReceta.length > 0
          ? `${productosSinReceta.length} producto(s) sin receta`
          : recetasVacias.length > 0
            ? `${recetasVacias.length} receta(s) vacía(s)`
            : `${totalRecetas} receta(s) activa(s)`,
        href: '/admin/recetas',
        iconKey: 'book',
      },
      produccion: {
        estado: estadoProduccion,
        label: 'Producción',
        total: produccionEnCurso,
        pendientes: produccionPendiente,
        detalle: produccionPendiente > 0
          ? `${produccionPendiente} pendiente(s) > 2 días`
          : produccionEnCurso > 0
            ? `${produccionEnCurso} en curso`
            : 'Sin producciones pendientes',
        href: '/admin/produccion',
        iconKey: 'factory',
      },
      stock: {
        estado: estadoStock,
        label: 'Stock PT',
        total: totalPT,
        pendientes: stockPendientes,
        detalle: ptSinStock.length > 0
          ? `${ptSinStock.length} sin stock`
          : ptStockBajo.length > 0
            ? `${ptStockBajo.length} con stock bajo`
            : `${totalPT} producto(s) en orden`,
        href: '/admin/productos-terminados',
        iconKey: 'package',
      },
      ventas: {
        estado: estadoVentas,
        label: 'Ventas',
        total: ventasCount,
        pendientes: 0,
        detalle: ventasCount > 0
          ? `${ventasCount} venta(s) este mes`
          : 'Sin ventas este mes',
        href: '/admin/ventas',
        iconKey: 'dollar',
      },
    }

    // ─── Resumen ─────────────────────────────────────────────────────────
    const criticas = pasosPendientes.filter(p => p.severidad === 'critica').length
    const importantes = pasosPendientes.filter(p => p.severidad === 'importante').length
    const informativas = pasosPendientes.filter(p => p.severidad === 'informativo').length
    const flujoCompletado = Object.values(flujoTrabajo).filter(s => s.estado === 'ok').length

    const response: DashboardResponse = {
      pasosPendientes,
      indicadoresClave,
      flujoTrabajo,
      resumen: {
        totalPasos: pasosPendientes.length,
        criticas,
        importantes,
        informativas,
        flujoCompletado,
        flujoTotal: 5,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error)
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 })
  }
}
