import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alerts — Comprehensive alert system for the dashboard
export async function GET() {
  try {
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

    // ─── 1. STOCK ALERTS ───────────────────────────────────────────────────

    const pts = await db.productoTerminado.findMany({
      where: { estado: true },
      select: { id: true, nombre: true, stock_actual: true, stock_minimo: true, imagen: true, precio_venta: true },
    })

    const ptSinStock = pts.filter(p => p.stock_actual <= 0)
    const ptStockBajo = pts.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo)

    const mps = await db.materiaPrima.findMany({
      where: { estado: true },
      select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
    })

    const mpSinStock = mps.filter(m => m.stock_actual <= 0)
    const mpStockBajo = mps.filter(m => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo)

    const inss = await db.insumo.findMany({
      where: { estado: true },
      select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
    })

    const insSinStock = inss.filter(i => i.stock_actual <= 0)
    const insStockBajo = inss.filter(i => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo)

    // ─── 2. PRODUCTION & RECIPES ALERTS ────────────────────────────────────

    const estadoPlanificado = await db.estadoGeneral.findFirst({ where: { nombre_estado: 'planificado' } })
    const estadoEnCurso = await db.estadoGeneral.findFirst({ where: { nombre_estado: 'en_curso' } })

    let produccionPendienteOld: { id: number; fecha_produccion: Date; receta: { nombre_receta: string; productoTerminado: { nombre: string } } }[] = []
    if (estadoPlanificado || estadoEnCurso) {
      const estadoIds = [estadoPlanificado?.id, estadoEnCurso?.id].filter(Boolean) as number[]
      produccionPendienteOld = await db.produccion.findMany({
        where: {
          id_estado: { in: estadoIds },
          fecha_produccion: { lt: twoDaysAgo },
        },
        select: {
          id: true,
          fecha_produccion: true,
          receta: { select: { nombre_receta: true, productoTerminado: { select: { nombre: true } } } },
        },
        take: 10,
      })
    }

    // Producto terminado sin receta
    const productosConReceta = await db.receta.findMany({
      where: { activo: true },
      select: { id_producto_terminado: true },
    })
    const idsConReceta = new Set(productosConReceta.map(r => r.id_producto_terminado))
    const productosSinReceta = pts.filter(p => !idsConReceta.has(p.id))

    // Receta sin ingredientes (vacía)
    const recetasActivas = await db.receta.findMany({
      where: { activo: true },
      select: { id: true, nombre_receta: true, detalleRecetas: { select: { id: true } } },
    })
    const recetasVacias = recetasActivas.filter(r => r.detalleRecetas.length === 0)

    // ─── 3. CLIENTS & ORDERS ALERTS ────────────────────────────────────────

    const estadosPendientes = await db.estadoGeneral.findMany({
      where: { nombre_estado: { in: ['pendiente', 'confirmado', 'en_proceso'] } },
    })
    const estadosPendientesIds = estadosPendientes.map(e => e.id)

    let pedidosClientePendientesOld: { id: number; fecha_pedido: Date; cliente: { nombre: string; apellido: string } }[] = []
    if (estadosPendientesIds.length > 0) {
      pedidosClientePendientesOld = await db.pedidoCliente.findMany({
        where: {
          id_estado: { in: estadosPendientesIds },
          fecha_pedido: { lt: threeDaysAgo },
          fecha_entrega_real: null,
        },
        select: {
          id: true,
          fecha_pedido: true,
          cliente: { select: { nombre: true, apellido: true } },
        },
        take: 10,
      })
    }

    const estadosReservaActiva = await db.estadoGeneral.findMany({
      where: { nombre_estado: { in: ['pendiente', 'confirmada', 'activa'] } },
    })
    const estadosReservaIds = estadosReservaActiva.map(e => e.id)

    let reservasVencidas: { id: number; fecha_validez_hasta: Date; cliente: { nombre: string; apellido: string }; productoTerminado: { nombre: string } }[] = []
    if (estadosReservaIds.length > 0) {
      reservasVencidas = await db.reservaCliente.findMany({
        where: {
          id_estado: { in: estadosReservaIds },
          fecha_validez_hasta: { lt: sevenDaysAgo },
        },
        select: {
          id: true,
          fecha_validez_hasta: true,
          cliente: { select: { nombre: true, apellido: true } },
          productoTerminado: { select: { nombre: true } },
        },
        take: 10,
      })
    }

    // ─── 4. SUPPLIERS & PURCHASES ALERTS ───────────────────────────────────

    const estadosPPActivo = await db.estadoGeneral.findMany({
      where: { nombre_estado: { in: ['pendiente', 'confirmado', 'en_proceso'] } },
    })
    const estadosPPIds = estadosPPActivo.map(e => e.id)

    let pedidosProvAtrasados: { id: number; fecha_entrega_estimada: Date | null; proveedor: { nombre: string; apellido: string } }[] = []
    if (estadosPPIds.length > 0) {
      pedidosProvAtrasados = await db.pedidoProveedor.findMany({
        where: {
          id_estado: { in: estadosPPIds },
          fecha_entrega_estimada: { lt: now },
          fecha_entrega_real: null,
        },
        select: {
          id: true,
          fecha_entrega_estimada: true,
          proveedor: { select: { nombre: true, apellido: true } },
        },
        take: 10,
      })
    }

    // ─── 5. SALES & BUDGETS ALERTS ─────────────────────────────────────────

    const presupuestosVencidos = await db.presupuesto.findMany({
      where: {
        estado: 'pendiente',
        fecha_validez: { lt: fifteenDaysAgo },
      },
      select: {
        id: true,
        numero: true,
        fecha_validez: true,
        cliente: { select: { nombre: true, apellido: true } },
      },
      take: 10,
    })

    const productosSinCosto = pts.filter(p => p.precio_venta > 0 && !idsConReceta.has(p.id))

    // ─── 6. PRODUCTS & STORE ALERTS ────────────────────────────────────────

    const productosSinImagen = pts.filter(p => !p.imagen)

    // ─── BUILD RESPONSE ────────────────────────────────────────────────────

    const alertas = {
      stock: {
        pt_sin_stock: {
          count: ptSinStock.length,
          severity: 'critica' as const,
          label: 'Productos terminados sin stock',
          items: ptSinStock.slice(0, 10).map(p => ({ id: p.id, nombre: p.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo })),
          href: '/admin/productos-terminados?stock=sin_stock',
        },
        pt_stock_bajo: {
          count: ptStockBajo.length,
          severity: 'media' as const,
          label: 'Productos terminados con stock bajo',
          items: ptStockBajo.slice(0, 10).map(p => ({ id: p.id, nombre: p.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo })),
          href: '/admin/productos-terminados?stock=stock_bajo',
        },
        mp_sin_stock: {
          count: mpSinStock.length,
          severity: 'critica' as const,
          label: 'Materias primas sin stock',
          items: mpSinStock.slice(0, 10).map(m => ({ id: m.id, nombre: m.nombre, stock_actual: m.stock_actual, stock_minimo: m.stock_minimo })),
          href: '/admin/materias-primas?stock=sin_stock',
        },
        mp_stock_bajo: {
          count: mpStockBajo.length,
          severity: 'media' as const,
          label: 'Materias primas con stock bajo',
          items: mpStockBajo.slice(0, 10).map(m => ({ id: m.id, nombre: m.nombre, stock_actual: m.stock_actual, stock_minimo: m.stock_minimo })),
          href: '/admin/materias-primas?stock=stock_bajo',
        },
        ins_sin_stock: {
          count: insSinStock.length,
          severity: 'critica' as const,
          label: 'Insumos sin stock',
          items: insSinStock.slice(0, 10).map(i => ({ id: i.id, nombre: i.nombre, stock_actual: i.stock_actual, stock_minimo: i.stock_minimo })),
          href: '/admin/insumos?stock=sin_stock',
        },
        ins_stock_bajo: {
          count: insStockBajo.length,
          severity: 'media' as const,
          label: 'Insumos con stock bajo',
          items: insStockBajo.slice(0, 10).map(i => ({ id: i.id, nombre: i.nombre, stock_actual: i.stock_actual, stock_minimo: i.stock_minimo })),
          href: '/admin/insumos?stock=stock_bajo',
        },
      },
      produccion: {
        produccion_pendiente_old: {
          count: produccionPendienteOld.length,
          severity: 'media' as const,
          label: 'Producciones pendientes (> 2 días)',
          items: produccionPendienteOld.map(p => ({
            id: p.id,
            nombre: p.receta.productoTerminado.nombre,
            fecha: p.fecha_produccion.toISOString(),
          })),
          href: '/admin/produccion',
        },
        producto_sin_receta: {
          count: productosSinReceta.length,
          severity: 'critica' as const,
          label: 'Productos terminados sin receta',
          items: productosSinReceta.slice(0, 10).map(p => ({ id: p.id, nombre: p.nombre })),
          href: '/admin/productos-terminados',
        },
        receta_sin_ingredientes: {
          count: recetasVacias.length,
          severity: 'informativa' as const,
          label: 'Recetas sin ingredientes',
          items: recetasVacias.slice(0, 10).map(r => ({ id: r.id, nombre: r.nombre_receta })),
          href: '/admin/recetas',
        },
      },
      clientes: {
        pedido_pendiente_old: {
          count: pedidosClientePendientesOld.length,
          severity: 'media' as const,
          label: 'Pedidos de clientes pendientes (> 3 días)',
          items: pedidosClientePendientesOld.map(p => ({
            id: p.id,
            nombre: `${p.cliente.nombre} ${p.cliente.apellido}`,
            fecha: p.fecha_pedido.toISOString(),
          })),
          href: '/admin/pedidos-clientes',
        },
        reserva_vencida: {
          count: reservasVencidas.length,
          severity: 'media' as const,
          label: 'Reservas vencidas (> 7 días)',
          items: reservasVencidas.map(r => ({
            id: r.id,
            nombre: `${r.cliente.nombre} ${r.cliente.apellido} — ${r.productoTerminado.nombre}`,
            fecha: r.fecha_validez_hasta.toISOString(),
          })),
          href: '/admin/reservas-clientes',
        },
      },
      proveedores: {
        pedido_proveedor_atrasado: {
          count: pedidosProvAtrasados.length,
          severity: 'media' as const,
          label: 'Pedidos a proveedores atrasados',
          items: pedidosProvAtrasados.map(p => ({
            id: p.id,
            nombre: `${p.proveedor.nombre} ${p.proveedor.apellido}`,
            fecha: p.fecha_entrega_estimada?.toISOString() || null,
          })),
          href: '/admin/pedidos-proveedores',
        },
      },
      ventas: {
        presupuesto_vencido: {
          count: presupuestosVencidos.length,
          severity: 'media' as const,
          label: 'Presupuestos vencidos (> 15 días)',
          items: presupuestosVencidos.map(p => ({
            id: p.id,
            nombre: `${p.numero} — ${p.cliente.nombre} ${p.cliente.apellido}`,
            fecha: p.fecha_validez.toISOString(),
          })),
          href: '/admin/presupuestos',
        },
        producto_sin_costo: {
          count: productosSinCosto.length,
          severity: 'informativa' as const,
          label: 'Productos con precio pero sin costo',
          items: productosSinCosto.slice(0, 10).map(p => ({ id: p.id, nombre: p.nombre })),
          href: '/admin/productos-terminados',
        },
      },
      tienda: {
        producto_sin_imagen: {
          count: productosSinImagen.length,
          severity: 'informativa' as const,
          label: 'Productos sin imagen',
          items: productosSinImagen.slice(0, 10).map(p => ({ id: p.id, nombre: p.nombre })),
          href: '/admin/productos-terminados',
        },
      },
    }

    const totalCriticas = Object.values(alertas)
      .flatMap(cat => Object.values(cat))
      .filter(a => a.severity === 'critica')
      .reduce((sum, a) => sum + a.count, 0)

    const totalMedias = Object.values(alertas)
      .flatMap(cat => Object.values(cat))
      .filter(a => a.severity === 'media')
      .reduce((sum, a) => sum + a.count, 0)

    const totalInformativas = Object.values(alertas)
      .flatMap(cat => Object.values(cat))
      .filter(a => a.severity === 'informativa')
      .reduce((sum, a) => sum + a.count, 0)

    const totalAlertas = totalCriticas + totalMedias + totalInformativas

    return NextResponse.json({
      alertas,
      resumen: {
        total: totalAlertas,
        criticas: totalCriticas,
        medias: totalMedias,
        informativas: totalInformativas,
      },
    })
  } catch (error) {
    console.error('Error al obtener alertas:', error)
    return NextResponse.json({ error: 'Error al obtener alertas' }, { status: 500 })
  }
}
