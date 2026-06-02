/**
 * Shared Prisma include objects to avoid duplication across API routes.
 */

export const recetaIncludes = {
  productoTerminado: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      precio_venta: true,
    },
  },
  detalleRecetas: {
    include: {
      materiaPrima: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          precio_compra_referencia: true,
        },
      },
      insumo: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          precio_compra_referencia: true,
        },
      },
      unidad: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
}
