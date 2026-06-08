import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic rendering for Vercel serverless
export const dynamic = 'force-dynamic'

/**
 * Calcula el dígito verificador EAN-13
 */
function calcularCheckDigitEAN13(digits12: string): string {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits12[i]) * (i % 2 === 0 ? 1 : 3)
  }
  return String((10 - (sum % 10)) % 10)
}

/**
 * Genera un código EAN-13 a partir de un contador secuencial
 * Formato: 779 + 9 dígitos del contador + 1 dígito verificador = 13 dígitos
 * Ejemplo: contador=1 → 779000000001 + check digit
 */
function generarCodigoEAN13(contador: number): string {
  const prefijo = '779'
  const numero = contador.toString().padStart(9, '0')
  const base = prefijo + numero // 12 dígitos
  const checkDigit = calcularCheckDigitEAN13(base)
  return base + checkDigit
}

/**
 * Busca el último contador secuencial usado en los códigos EAN-13 existentes
 * Analiza todos los códigos que empiecen con "779" y extrae el número secuencial
 */
async function obtenerUltimoContador(): Promise<number> {
  const productos = await db.productoTerminado.findMany({
    where: {
      codigo_barras: { not: null },
    },
    select: { codigo_barras: true },
    orderBy: { codigo_barras: 'desc' },
  })

  let maxContador = 0

  for (const p of productos) {
    const cb = p.codigo_barras
    if (!cb || !cb.startsWith('779') || cb.length !== 13) continue

    // Extraer los 9 dígitos después del prefijo 779 (posiciones 3-11)
    const secuencial = parseInt(cb.substring(3, 12), 10)
    if (secuencial > maxContador) {
      maxContador = secuencial
    }
  }

  return maxContador
}

/**
 * POST /api/productos-terminados/generar-codigos
 * Genera códigos de barras EAN-13 secuenciales para todos los productos que no tienen uno.
 * Usa el último contador existente + 1 para cada nuevo código.
 * 
 * Query params:
 *   secret - Token de seguridad (opcional, para producción)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Verificar token de seguridad si se proporciona
    if (secret && secret !== 'laspastasdeorlando-seed-2026') {
      return NextResponse.json({ error: 'Token de seguridad inválido' }, { status: 403 })
    }

    // Obtener todos los productos sin código de barras
    const allProductos = await db.productoTerminado.findMany({
      select: { id: true, nombre: true, codigo_barras: true },
      orderBy: { id: 'asc' },
    })

    const productosSinCodigo = allProductos.filter(
      (p) => p.codigo_barras === null || p.codigo_barras === '' || p.codigo_barras === undefined
    )

    if (productosSinCodigo.length === 0) {
      return NextResponse.json({
        message: 'Todos los productos ya tienen código de barras',
        actualizados: 0,
      })
    }

    // Obtener el último contador secuencial usado
    let contador = await obtenerUltimoContador()

    let actualizados = 0
    const errores: { id: number; error: string }[] = []
    const resultados: { id: number; nombre: string; codigo_barras: string }[] = []

    for (const producto of productosSinCodigo) {
      contador++
      const barcode = generarCodigoEAN13(contador)

      try {
        // Verificar que no exista (por seguridad)
        const existente = await db.productoTerminado.findUnique({
          where: { codigo_barras: barcode },
        })

        if (existente) {
          // Si ya existe por alguna razón, saltar y reintentar
          errores.push({ id: producto.id, error: `Código ${barcode} ya existe` })
          continue
        }

        await db.productoTerminado.update({
          where: { id: producto.id },
          data: { codigo_barras: barcode },
        })

        resultados.push({ id: producto.id, nombre: producto.nombre, codigo_barras: barcode })
        actualizados++
      } catch (updateErr) {
        console.error(`Error actualizando producto ${producto.id}:`, updateErr)
        errores.push({
          id: producto.id,
          error: updateErr instanceof Error ? updateErr.message : String(updateErr),
        })
      }
    }

    return NextResponse.json({
      message: `Se generaron ${actualizados} códigos de barras secuenciales`,
      actualizados,
      contadorFinal: contador,
      resultados,
      errores: errores.length > 0 ? errores : undefined,
    })
  } catch (error) {
    console.error('Error generando códigos de barras:', error)
    return NextResponse.json(
      {
        error: 'Error al generar códigos de barras',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
