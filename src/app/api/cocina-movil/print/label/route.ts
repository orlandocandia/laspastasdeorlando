/**
 * POST /api/cocina-movil/print/label
 * Body: { productionId: string }
 * Returns: { label: string (ZPL or HTML), barcode: string, settings: object }
 *
 * Generates a production label with barcode (using the production ID).
 */
import { NextResponse } from 'next/server'
import { getProductionById } from '@/lib/cocina-movil/productions'
import { getPrinterSettings } from '@/lib/cocina-movil/printer-settings'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { productionId?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 }) }
  const productionId = body.productionId
  if (typeof productionId !== 'string' || !productionId) return NextResponse.json({ error: 'productionId es obligatorio.' }, { status: 400 })

  const production = getProductionById(productionId)
  if (!production) return NextResponse.json({ error: 'Producción no encontrada.' }, { status: 404 })

  const settings = getPrinterSettings()

  // Generate barcode value (production ID + date for uniqueness)
  const barcodeValue = production.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 12)

  // Generate ZPL label
  let zpl = ''
  if (settings.printerType === 'zebra') {
    // ZPL format for Zebra printers
    const dims = settings.labelSize === '50x30' ? { w: 200, h: 120 } : settings.labelSize === '70x40' ? { w: 280, h: 160 } : { w: 400, h: 240 }
    zpl = `^XA
^FO10,10^A0N,30,30^FD${production.recipeTitle.substring(0, 20)}^FS
^FO10,45^A0N,20,20^FDLote: ${production.id.substring(0, 12)}^FS
^FO10,70^A0N,20,20^FDFecha: ${formatDate(production.createdAt)}^FS
^FO10,95^A0N,20,20^FDCant: ${production.quantity} porciones^FS
^FO150,90^BCN,60,Y,N,N^FD${barcodeValue}^FS
^XZ`
  } else {
    // Generic text format (ESC/POS or plain)
    zpl = `ETIQUETA DE PRODUCCION
========================
Receta: ${production.recipeTitle}
Lote: ${production.id}
Fecha: ${formatDate(production.createdAt)}
Cantidad: ${production.quantity} porciones
Lugar: ${production.placeName}
Cocinero: ${production.cookName || 'N/A'}
Barcode: ${barcodeValue}
========================`
  }

  return NextResponse.json({
    label: zpl,
    format: settings.printerType,
    labelSize: settings.labelSize,
    barcode: barcodeValue,
    production: {
      id: production.id,
      recipeTitle: production.recipeTitle,
      quantity: production.quantity,
      createdAt: production.createdAt,
      placeName: production.placeName,
      cookName: production.cookName,
    },
    settings,
  })
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
}
