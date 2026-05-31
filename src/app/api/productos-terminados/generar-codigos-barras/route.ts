import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic rendering for Vercel serverless
export const dynamic = 'force-dynamic'

/**
 * Calcula el dígito verificador de un código EAN-13
 * Algoritmo GS1 mod-10
 */
function calcularCheckDigitEAN13(digits12: string): string {
  const digits = digits12.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  return String((10 - (sum % 10)) % 10)
}

/**
 * Genera un código EAN-13 secuencial a partir de un contador
 * Formato: 779 (prefijo Argentina) + 9 dígitos del contador + 1 check digit = 13 dígitos
 * Ejemplo: contador=1 → 779000000001 + check digit = 7790000000010
 */
function generarCodigoEAN13(contador: number): string {
  const prefijo = '779'
  const numero = contador.toString().padStart(9, '0')
  const base = prefijo + numero // 12 dígitos
  const checkDigit = calcularCheckDigitEAN13(base)
  return base + checkDigit // 13 dígitos
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
 * GET /api/productos-terminados/generar-codigos-barras
 * Devuelve el próximo código EAN-13 que se generaría (para previsualización en formularios)
 */
export async function GET() {
  try {
    const ultimoContador = await obtenerUltimoContador()
    const proximoContador = ultimoContador + 1
    const proximoCodigo = generarCodigoEAN13(proximoContador)

    return NextResponse.json({
      proximo_codigo: proximoCodigo,
      contador: proximoContador,
    })
  } catch (error) {
    console.error('Error al obtener próximo código:', error)
    return NextResponse.json(
      { error: 'Error al obtener próximo código' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/productos-terminados/generar-codigos-barras
 * Genera códigos de barras EAN-13 secuenciales para TODOS los productos que no tienen uno.
 * Usa el último contador existente + 1 para cada nuevo código.
 *
 * Query params:
 *   secret - Token de seguridad (requerido: pastas-orlando-seed-2026)
 *
 * Respuesta:
 *   message - Mensaje descriptivo
 *   actualizados - Cantidad de productos actualizados
 *   codigos - Lista de productos con sus nuevos códigos
 *   errores - Lista de errores (si los hay)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Verificar autorización
    if (secret !== 'pastas-orlando-seed-2026') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todos los productos sin código de barras
    const todosLosProductos = await db.productoTerminado.findMany({
      select: { id: true, nombre: true, codigo_barras: true },
      orderBy: { id: 'asc' },
    })

    const sinCodigo = todosLosProductos.filter(
      (p) => p.codigo_barras === null || p.codigo_barras === '' || p.codigo_barras === undefined
    )

    if (sinCodigo.length === 0) {
      return NextResponse.json({
        message: 'Todos los productos ya tienen código de barras asignado',
        actualizados: 0,
        codigos: [],
      })
    }

    // Obtener el último contador secuencial usado
    let contador = await obtenerUltimoContador()

    let actualizados = 0
    const errores: { id: number; nombre: string; error: string }[] = []
    const codigos: { id: number; nombre: string; codigo_barras: string }[] = []

    for (const producto of sinCodigo) {
      contador++
      const barcode = generarCodigoEAN13(contador)

      try {
        // Verificar que no exista (por seguridad, evitar duplicados)
        const existente = await db.productoTerminado.findUnique({
          where: { codigo_barras: barcode },
        })

        if (existente) {
          // Si ya existe por alguna razón, saltar e incrementar contador
          errores.push({
            id: producto.id,
            nombre: producto.nombre,
            error: `Código ${barcode} ya existe, saltando`,
          })
          continue
        }

        await db.productoTerminado.update({
          where: { id: producto.id },
          data: { codigo_barras: barcode },
        })

        codigos.push({
          id: producto.id,
          nombre: producto.nombre,
          codigo_barras: barcode,
        })
        actualizados++
      } catch (updateErr) {
        console.error(`Error actualizando producto ${producto.id}:`, updateErr)
        errores.push({
          id: producto.id,
          nombre: producto.nombre,
          error: updateErr instanceof Error ? updateErr.message : String(updateErr),
        })
      }
    }

    return NextResponse.json({
      message: `Se generaron ${actualizados} códigos de barras secuenciales`,
      actualizados,
      contador_siguiente: contador + 1,
      codigos,
      errores: errores.length > 0 ? errores : undefined,
    })
  } catch (error) {
    console.error('Error al generar códigos de barras:', error)
    return NextResponse.json(
      {
        error: 'Error al generar códigos de barras',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
