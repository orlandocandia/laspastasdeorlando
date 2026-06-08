import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

/**
 * POST /api/cleanup-productos-sin-imagen
 * 
 * ELIMINA PERMANENTEMENTE todos los ProductoTerminado que NO tengan imagen válida.
 * Condición: imagen IS NULL OR imagen = '' OR imagen = 'N/A' (case insensitive)
 * 
 * Regla de negocio: Solo deben existir productos con foto cargada manualmente.
 * Esta limpieza se ejecuta automáticamente en cada seed también.
 * 
 * Seguridad: requiere secret igual a seed-turso
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    if (secret !== 'laspastasdeorlando-seed-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const databaseUrl = process.env.DATABASE_URL || ''
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || ''

    // Detectar si es Turso o SQLite local
    const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http')

    if (isTurso) {
      // === TURSO PATH (libsql client) ===
      const client = createClient({ url: databaseUrl, authToken: authToken || undefined })

      // 1. Contar productos sin imagen antes de eliminar
      const countResult = await client.execute(
        "SELECT COUNT(*) as total FROM ProductoTerminado WHERE imagen IS NULL OR imagen = '' OR LOWER(imagen) = 'n/a'"
      )
      const totalSinImagen = Number(countResult.rows[0]?.total || 0)

      // 2. Listar productos que se van a eliminar (para auditoría)
      const productosAEliminar = await client.execute(
        "SELECT id, nombre, codigo, imagen FROM ProductoTerminado WHERE imagen IS NULL OR imagen = '' OR LOWER(imagen) = 'n/a'"
      )
      const eliminados = productosAEliminar.rows.map(r => ({
        id: Number(r.id),
        nombre: String(r.nombre),
        codigo: r.codigo ? String(r.codigo) : null,
        imagen: r.imagen ? String(r.imagen) : null,
      }))

      // 3. ELIMINAR PERMANENTEMENTE
      const deleteResult = await client.execute(
        "DELETE FROM ProductoTerminado WHERE imagen IS NULL OR imagen = '' OR LOWER(imagen) = 'n/a'"
      )
      const filasEliminadas = Number(deleteResult.rowsAffected || 0)

      // 4. Contar productos restantes
      const remainingResult = await client.execute("SELECT COUNT(*) as total FROM ProductoTerminado")
      const totalRestantes = Number(remainingResult.rows[0]?.total || 0)

      return NextResponse.json({
        success: true,
        action: 'HARD_DELETE',
        message: `Se eliminaron PERMANENTEMENTE ${filasEliminadas} productos sin imagen válida`,
        totalSinImagen,
        filasEliminadas,
        totalRestantes,
        productosEliminados: eliminados,
        regla: 'REGLA PERMANENTE: No se permite crear ni mantener productos sin imagen válida. Esta limpieza se ejecuta automáticamente en cada seed.',
      })
    } else {
      // === LOCAL SQLite PATH (Prisma) ===
      // SQLite no soporta mode: 'insensitive', usamos SQL raw para compatibilidad
      const { db } = await import('@/lib/db')

      // 1. Listar productos sin imagen (para auditoría) usando raw query
      const productosAEliminar = await db.$queryRaw<
        Array<{ id: number; nombre: string; codigo: string | null; imagen: string | null }>
      >`SELECT id, nombre, codigo, imagen FROM ProductoTerminado WHERE imagen IS NULL OR imagen = '' OR LOWER(imagen) = 'n/a'`
      
      const eliminados = productosAEliminar.map(r => ({
        id: Number(r.id),
        nombre: String(r.nombre),
        codigo: r.codigo,
        imagen: r.imagen,
      }))

      const totalSinImagen = eliminados.length

      // 2. ELIMINAR PERMANENTEMENTE usando raw query
      await db.$executeRaw`DELETE FROM ProductoTerminado WHERE imagen IS NULL OR imagen = '' OR LOWER(imagen) = 'n/a'`

      // 3. Contar productos restantes
      const totalRestantes = await db.productoTerminado.count()

      return NextResponse.json({
        success: true,
        action: 'HARD_DELETE',
        message: `Se eliminaron PERMANENTEMENTE ${totalSinImagen} productos sin imagen válida`,
        totalSinImagen,
        filasEliminadas: totalSinImagen,
        totalRestantes,
        productosEliminados: eliminados,
        regla: 'REGLA PERMANENTE: No se permite crear ni mantener productos sin imagen válida. Esta limpieza se ejecuta automáticamente en cada seed.',
      })
    }
  } catch (error) {
    console.error('Error en cleanup de productos sin imagen:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar limpieza', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
