import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/materias-primas/proximo-codigo
 * Devuelve el próximo código disponible para una nueva materia prima.
 * Formato: MP-001, MP-002, etc.
 */
export async function GET() {
  try {
    // Obtener todos los códigos que empiezan con "MP-"
    const materias = await db.materiaPrima.findMany({
      where: {
        codigo: { startsWith: 'MP-' }
      },
      select: { codigo: true },
    })

    // Extraer el número de cada código (ej: "MP-003" → 3)
    let maxNum = 0
    for (const mp of materias) {
      if (mp.codigo) {
        const match = mp.codigo.match(/^MP-(\d+)$/i)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNum) maxNum = num
        }
      }
    }

    // Generar el próximo código con padding de 3 dígitos
    const proximoCodigo = `MP-${String(maxNum + 1).padStart(3, '0')}`

    return NextResponse.json({ codigo: proximoCodigo })
  } catch (error) {
    console.error('Error al generar próximo código:', error)
    // Fallback: devolver MP-001 si hay error
    return NextResponse.json({ codigo: 'MP-001' })
  }
}
