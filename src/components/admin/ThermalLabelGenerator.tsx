'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { toast } from 'sonner'
import {
  Loader2,
  Search,
  Printer,
  FileDown,
  Code2,
  Copy,
  Check,
  Plus,
  Minus,
  Trash2,
  Tag,
  Package,
  Settings2,
  Eye,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ==================== Types ====================

interface ProductoTerminado {
  id: number
  nombre: string
  codigo: string | null
  codigo_barras: string | null
  precio_venta: number
  peso_unitario_aprox: number
  categoria?: { nombre: string } | null
  estado: boolean
}

interface BatchItem {
  producto: ProductoTerminado
  cantidad: number
}

type LabelSizeId =
  | '50x30'
  | '70x40'
  | '80x50'
  | '100x60'
  | '40x30'
  | '60x40'

interface LabelSize {
  id: LabelSizeId
  label: string
  width_mm: number
  height_mm: number
  descripcion: string
}

type ExportFormat = 'pdf' | 'zpl'

interface FieldConfig {
  nombre: boolean
  precio: boolean
  peso: boolean
  codigo_barras: boolean
  fecha_elaboracion: boolean
  fecha_vencimiento: boolean
  categoria: boolean
}

// ==================== Constants ====================

const LABEL_SIZES: LabelSize[] = [
  { id: '40x30', label: '40 × 30 mm', width_mm: 40, height_mm: 30, descripcion: 'Etiqueta pequeña (Zebra 50mm roll)' },
  { id: '50x30', label: '50 × 30 mm', width_mm: 50, height_mm: 30, descripcion: 'Térmica estándar chica' },
  { id: '60x40', label: '60 × 40 mm', width_mm: 60, height_mm: 40, descripcion: 'Térmica mediana' },
  { id: '70x40', label: '70 × 40 mm', width_mm: 70, height_mm: 40, descripcion: 'Térmica estándar' },
  { id: '80x50', label: '80 × 50 mm', width_mm: 80, height_mm: 50, descripcion: 'Térmica grande' },
  { id: '100x60', label: '100 × 60 mm', width_mm: 100, height_mm: 60, descripcion: 'Etiqueta grande' },
]

const DEFAULT_FIELDS: FieldConfig = {
  nombre: true,
  precio: true,
  peso: false,
  codigo_barras: true,
  fecha_elaboracion: false,
  fecha_vencimiento: false,
  categoria: false,
}

const FIELD_LABELS: Record<keyof FieldConfig, string> = {
  nombre: 'Nombre del producto',
  precio: 'Precio',
  peso: 'Peso',
  codigo_barras: 'Código de barras',
  fecha_elaboracion: 'Fecha elaboración',
  fecha_vencimiento: 'Fecha vencimiento',
  categoria: 'Categoría',
}

// mm → pt (1mm = 2.834645669pt)
const MM_TO_PT = 2.834645669

// ==================== Helpers ====================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

/** Generate barcode as PNG data URL using canvas */
function generateBarcodeDataUrl(code: string, options?: { height?: number; width?: number; fontSize?: number }): string | null {
  try {
    const canvas = document.createElement('canvas')
    const format = code.length === 13 ? 'EAN13' : 'CODE128'
    JsBarcode(canvas, code, {
      format,
      width: options?.width ?? 2,
      height: options?.height ?? 40,
      displayValue: true,
      fontSize: options?.fontSize ?? 12,
      margin: 2,
      background: '#FFFFFF',
    })
    return canvas.toDataURL('image/png')
  } catch {
    try {
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, code, {
        format: 'CODE128',
        width: options?.width ?? 2,
        height: options?.height ?? 40,
        displayValue: true,
        fontSize: options?.fontSize ?? 12,
        margin: 2,
        background: '#FFFFFF',
      })
      return canvas.toDataURL('image/png')
    } catch (err) {
      console.error('Error generando código de barras:', err)
      return null
    }
  }
}

/**
 * Generate ZPL (Zebra Programming Language) code for a thermal label.
 * ZPL uses dots as units. Default 203 DPI = 8 dots/mm.
 */
function generateZPL(
  items: BatchItem[],
  size: LabelSize,
  fields: FieldConfig,
  fechaElaboracion: string,
  fechaVencimiento: string,
): string {
  const DPI = 203 // dots per inch (8 dots/mm)
  const dpmm = Math.round(DPI / 25.4)
  const widthDots = Math.round(size.width_mm * dpmm)
  const heightDots = Math.round(size.height_mm * dpmm)
  const margin = Math.round(2 * dpmm) // 2mm margin

  const labels: string[] = []

  for (const item of items) {
    const { producto, cantidad } = item
    for (let i = 0; i < cantidad; i++) {
      const lines: string[] = []
      // Start label
      lines.push(`^XA`)
      // Set label size (width × height × gap)
      lines.push(`^PW${widthDots}`)
      lines.push(`^LL${heightDots}`)
      // Set print direction (normal)
      lines.push(`^FWN`)
      // Home position
      lines.push(`^LH${margin},${margin}`)

      let yPos = 0
      const contentWidth = widthDots - margin * 2

      // Nombre del producto
      if (fields.nombre) {
        const fontSize = Math.max(18, Math.round(size.height_mm * 1.5))
        lines.push(`^FO0,${yPos}^A0N,${fontSize},${Math.round(fontSize * 0.6)}^FB${contentWidth},2,0,C^FD${escapeZPL(producto.nombre)}^FS`)
        yPos += fontSize * 2 + 4
      }

      // Categoría
      if (fields.categoria && producto.categoria?.nombre) {
        const fontSize = 16
        lines.push(`^FO0,${yPos}^A0N,${fontSize},${fontSize}^FB${contentWidth},1,0,C^FD${escapeZPL(producto.categoria.nombre)}^FS`)
        yPos += fontSize + 2
      }

      // Precio
      if (fields.precio) {
        const fontSize = Math.max(24, Math.round(size.height_mm * 2.2))
        lines.push(`^FO0,${yPos}^A0N,${fontSize},${Math.round(fontSize * 0.7)}^FB${contentWidth},1,0,C^FD${formatCurrency(producto.precio_venta)}^FS`)
        yPos += fontSize + 4
      }

      // Peso
      if (fields.peso && producto.peso_unitario_aprox > 0) {
        const fontSize = 16
        lines.push(`^FO0,${yPos}^A0N,${fontSize},${fontSize}^FB${contentWidth},1,0,C^FD${producto.peso_unitario_aprox} kg^FS`)
        yPos += fontSize + 2
      }

      // Fechas
      const fechaLineas: string[] = []
      if (fields.fecha_elaboracion && fechaElaboracion) {
        fechaLineas.push(`Elab: ${formatDateDisplay(fechaElaboracion)}`)
      }
      if (fields.fecha_vencimiento && fechaVencimiento) {
        fechaLineas.push(`Venc: ${formatDateDisplay(fechaVencimiento)}`)
      }
      if (fechaLineas.length > 0) {
        const fontSize = 14
        lines.push(`^FO0,${yPos}^A0N,${fontSize},${fontSize}^FB${contentWidth},2,0,C^FD${escapeZPL(fechaLineas.join('  '))}^FS`)
        yPos += fontSize * fechaLineas.length + 2
      }

      // Código de barras
      if (fields.codigo_barras && producto.codigo_barras) {
        const barcodeHeight = Math.round(size.height_mm * 2)
        const barcodeY = Math.min(yPos, heightDots - margin - barcodeHeight - 20)
        const format = producto.codigo_barras.length === 13 ? 'EAN13' : 'CODE128'
        if (format === 'EAN13') {
          lines.push(`^FO${Math.round((widthDots - 150) / 2)},${barcodeY}^BY2,2,${barcodeHeight}^BEN,${barcodeHeight},Y,N^FD${producto.codigo_barras}^FS`)
        } else {
          // CODE128
          lines.push(`^FO${margin},${barcodeY}^BY2,2,${barcodeHeight}^BCN,${barcodeHeight},Y,N,N^FD${producto.codigo_barras}^FS`)
        }
      }

      // End label
      lines.push(`^XZ`)
      labels.push(lines.join('\n'))
    }
  }

  return labels.join('\n\n')
}

function escapeZPL(text: string): string {
  return text.replace(/\^/g, '').replace(/~/g, '')
}

/**
 * Generate ESC/POS commands for a label (simplified, for thermal receipt printers).
 */
function generateESCPOS(
  items: BatchItem[],
  fields: FieldConfig,
  fechaElaboracion: string,
  fechaVencimiento: string,
): string {
  const commands: string[] = []
  commands.push('\x1B\x40') // Initialize printer

  for (const item of items) {
    const { producto, cantidad } = item
    for (let i = 0; i < cantidad; i++) {
      if (fields.nombre) {
        commands.push('\x1B\x61\x01') // Center
        commands.push('\x1D\x21\x11') // Double size
        commands.push(producto.nombre)
        commands.push('\x1D\x21\x00') // Reset size
        commands.push('\n')
      }
      if (fields.categoria && producto.categoria?.nombre) {
        commands.push(`[${producto.categoria.nombre}]\n`)
      }
      if (fields.precio) {
        commands.push('\x1D\x21\x22') // Quadruple size
        commands.push(formatCurrency(producto.precio_venta))
        commands.push('\x1D\x21\x00')
        commands.push('\n')
      }
      if (fields.peso && producto.peso_unitario_aprox > 0) {
        commands.push(`Peso: ${producto.peso_unitario_aprox} kg\n`)
      }
      const fechas: string[] = []
      if (fields.fecha_elaboracion && fechaElaboracion) fechas.push(`Elab: ${formatDateDisplay(fechaElaboracion)}`)
      if (fields.fecha_vencimiento && fechaVencimiento) fechas.push(`Venc: ${formatDateDisplay(fechaVencimiento)}`)
      if (fechas.length > 0) {
        commands.push(fechas.join('  ') + '\n')
      }
      if (fields.codigo_barras && producto.codigo_barras) {
        // ESC/POS barcode command
        commands.push('\x1D\x68\x50') // Barcode height
        commands.push('\x1D\x77\x02') // Barcode width
        commands.push('\x1D\x6B\x49') // CODE128
        commands.push(`${String(producto.codigo_barras.length)}${producto.codigo_barras}`)
        commands.push('\n')
      }
      commands.push('\n\n')
    }
  }
  commands.push('\x1D\x56\x00') // Cut paper
  return commands.join('')
}

// ==================== Component ====================

export default function ThermalLabelGenerator() {
  const [productos, setProductos] = useState<ProductoTerminado[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Config
  const [labelSizeId, setLabelSizeId] = useState<LabelSizeId>('50x30')
  const [fields, setFields] = useState<FieldConfig>(DEFAULT_FIELDS)
  const [fechaElaboracion, setFechaElaboracion] = useState<string>(formatDateForInput(new Date()))
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')

  // Batch selection
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [copiasRapidas, setCopiasRapidas] = useState<number>(1)

  // ZPL output
  const [zplOutput, setZplOutput] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const previewRef = useRef<HTMLDivElement>(null)

  const labelSize = useMemo(() => LABEL_SIZES.find((s) => s.id === labelSizeId)!, [labelSizeId])

  // Load products
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/productos-terminados?limite=500&estado=true')
        if (res.ok) {
          const result = await res.json()
          setProductos(result.data || result.productos || result || [])
        }
      } catch (err) {
        console.error('Error cargando productos:', err)
        toast.error('Error al cargar productos')
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Set default vencimiento (30 days from elaboración)
  useEffect(() => {
    if (fechaElaboracion && !fechaVencimiento) {
      const elab = new Date(fechaElaboracion + 'T12:00:00')
      elab.setDate(elab.getDate() + 30)
      setFechaVencimiento(formatDateForInput(elab))
    }
  }, [fechaElaboracion, fechaVencimiento])

  const filteredProductos = useMemo(() => {
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo_barras && p.codigo_barras.includes(searchTerm)) ||
        (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [productos, searchTerm])

  const totalEtiquetas = useMemo(() => {
    return batch.reduce((sum, item) => sum + item.cantidad, 0)
  }, [batch])

  // Add product to batch
  const addToBatch = useCallback((producto: ProductoTerminado) => {
    setBatch((prev) => {
      const existing = prev.find((b) => b.producto.id === producto.id)
      if (existing) {
        return prev.map((b) =>
          b.producto.id === producto.id ? { ...b, cantidad: b.cantidad + 1 } : b,
        )
      }
      return [...prev, { producto, cantidad: copiasRapidas }]
    })
  }, [copiasRapidas])

  // Update quantity in batch
  const updateBatchCantidad = (productoId: number, cantidad: number) => {
    setBatch((prev) =>
      prev.map((b) =>
        b.producto.id === productoId ? { ...b, cantidad: Math.max(1, cantidad) } : b,
      ),
    )
  }

  // Remove from batch
  const removeFromBatch = (productoId: number) => {
    setBatch((prev) => prev.filter((b) => b.producto.id !== productoId))
  }

  // Clear batch
  const clearBatch = () => setBatch([])

  // Toggle field
  const toggleField = (field: keyof FieldConfig) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  // Preview product (first in batch, or a placeholder)
  const previewItem = batch[0] || null

  // Generate PDF (one label per page, exact label size)
  const handleGeneratePDF = useCallback(async () => {
    if (batch.length === 0) {
      toast.error('Agregá al menos un producto al lote')
      return
    }

    setGenerating(true)
    try {
      const { Document, Page, Text, View, Image, StyleSheet } = await import('@react-pdf/renderer')
      const { pdf } = await import('@react-pdf/renderer')

      const widthPt = labelSize.width_mm * MM_TO_PT
      const heightPt = labelSize.height_mm * MM_TO_PT

      // Scale factor: base font size on label height
      const scale = labelSize.height_mm / 30 // 30mm is reference
      const baseFont = Math.max(5, 7 * scale)
      const titleFont = Math.max(7, 10 * scale)
      const priceFont = Math.max(9, 13 * scale)
      const barcodeHeight = Math.max(20, 30 * scale)

      const styles = StyleSheet.create({
        page: {
          width: widthPt,
          height: heightPt,
          padding: 4 * MM_TO_PT * scale,
          fontFamily: 'Helvetica',
          backgroundColor: '#FFFFFF',
        },
        container: {
          flex: 1,
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        nombre: {
          fontSize: titleFont,
          fontFamily: 'Helvetica-Bold',
          textAlign: 'center',
          color: '#1a1a1a',
          lineHeight: 1.1,
        },
        categoria: {
          fontSize: baseFont * 0.8,
          color: '#666666',
          textAlign: 'center',
          marginTop: 1,
        },
        precio: {
          fontSize: priceFont,
          fontFamily: 'Helvetica-Bold',
          color: '#C41E3A',
          textAlign: 'center',
          marginTop: 2,
        },
        peso: {
          fontSize: baseFont * 0.85,
          color: '#444444',
          textAlign: 'center',
        },
        fechas: {
          fontSize: baseFont * 0.75,
          color: '#666666',
          textAlign: 'center',
        },
        barcode: {
          width: '85%',
          alignItems: 'center',
        },
        barcodeImg: {
          width: '100%',
          height: barcodeHeight,
          objectFit: 'contain' as const,
        },
      })

      // Build all labels
      const allLabels: React.ReactNode[] = []
      let labelIndex = 0

      for (const item of batch) {
        const { producto, cantidad } = item
        const barcodeDataUrl = fields.codigo_barras && producto.codigo_barras
          ? generateBarcodeDataUrl(producto.codigo_barras, {
              height: Math.round(barcodeHeight),
              width: Math.max(1, Math.round(2 * scale)),
              fontSize: Math.max(6, Math.round(8 * scale)),
            })
          : null

        for (let i = 0; i < cantidad; i++) {
          allLabels.push(
            <Page key={`label-${labelIndex}`} size={[widthPt, heightPt]} style={styles.page}>
              <View style={styles.container}>
                {/* Top section: name + category */}
                <View style={{ alignItems: 'center', width: '100%' }}>
                  {fields.nombre && (
                    <Text style={styles.nombre}>{producto.nombre}</Text>
                  )}
                  {fields.categoria && producto.categoria?.nombre && (
                    <Text style={styles.categoria}>{producto.categoria.nombre}</Text>
                  )}
                </View>

                {/* Middle section: barcode */}
                {barcodeDataUrl && (
                  <View style={styles.barcode}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image style={styles.barcodeImg} src={barcodeDataUrl} />
                  </View>
                )}

                {/* Bottom section: price + weight + dates */}
                <View style={{ alignItems: 'center', width: '100%' }}>
                  {fields.precio && (
                    <Text style={styles.precio}>{formatCurrency(producto.precio_venta)}</Text>
                  )}
                  {fields.peso && producto.peso_unitario_aprox > 0 && (
                    <Text style={styles.peso}>{producto.peso_unitario_aprox} kg</Text>
                  )}
                  {(fields.fecha_elaboracion || fields.fecha_vencimiento) && (
                    <Text style={styles.fechas}>
                      {[
                        fields.fecha_elaboracion && fechaElaboracion ? `Elab: ${formatDateDisplay(fechaElaboracion)}` : '',
                        fields.fecha_vencimiento && fechaVencimiento ? `Venc: ${formatDateDisplay(fechaVencimiento)}` : '',
                      ].filter(Boolean).join('  ')}
                    </Text>
                  )}
                </View>
              </View>
            </Page>,
          )
          labelIndex++
        }
      }

      const doc = <Document>{allLabels}</Document>
      const blob = await pdf(doc).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      link.download = `etiquetas-thermal-${labelSize.width_mm}x${labelSize.height_mm}-${dateStr}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`${totalEtiquetas} etiqueta(s) generada(s)`, {
        description: `PDF ${labelSize.width_mm}×${labelSize.height_mm}mm — lista para imprimir en etiquetadora térmica`,
      })
    } catch (err) {
      console.error('Error generando PDF:', err)
      toast.error('Error al generar el PDF')
    } finally {
      setGenerating(false)
    }
  }, [batch, fields, labelSize, fechaElaboracion, fechaVencimiento, totalEtiquetas])

  // Generate ZPL
  const handleGenerateZPL = useCallback(() => {
    if (batch.length === 0) {
      toast.error('Agregá al menos un producto al lote')
      return
    }

    try {
      const zpl = generateZPL(batch, labelSize, fields, fechaElaboracion, fechaVencimiento)
      setZplOutput(zpl)
      toast.success('Código ZPL generado', {
        description: `${totalEtiquetas} etiqueta(s) — copialo o descargalo como .zpl`,
      })
    } catch (err) {
      console.error('Error generando ZPL:', err)
      toast.error('Error al generar ZPL')
    }
  }, [batch, fields, labelSize, fechaElaboracion, fechaVencimiento, totalEtiquetas])

  // Download ZPL file
  const handleDownloadZPL = () => {
    if (!zplOutput) return
    const blob = new Blob([zplOutput], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    link.download = `etiquetas-${labelSize.width_mm}x${labelSize.height_mm}-${dateStr}.zpl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Archivo .zpl descargado')
  }

  // Copy ZPL to clipboard
  const handleCopyZPL = async () => {
    if (!zplOutput) return
    try {
      await navigator.clipboard.writeText(zplOutput)
      setCopied(true)
      toast.success('ZPL copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
        <span className="ml-3 text-muted-foreground">Cargando productos...</span>
      </div>
    )
  }

  // Preview scale: fit label in preview area (max 200px wide)
  const previewScale = Math.min(200 / labelSize.width_mm, 150 / labelSize.height_mm)
  const previewWidthPx = labelSize.width_mm * previewScale
  const previewHeightPx = labelSize.height_mm * previewScale

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-mostaza/10 rounded-lg">
          <Printer className="h-6 w-6 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Impresión Térmica de Etiquetas</h1>
          <p className="text-sm text-muted-foreground">
            Generá etiquetas para impresoras térmicas (Zebra, Brother, etc.) · PDF + ZPL
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product selection + Batch */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-mostaza" />
                Seleccionar Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, código o código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Copias:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={copiasRapidas}
                    onChange={(e) => setCopiasRapidas(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredProductos.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No se encontraron productos
                  </div>
                ) : (
                  filteredProductos.map((producto) => {
                    const inBatch = batch.find((b) => b.producto.id === producto.id)
                    return (
                      <div
                        key={producto.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-mostaza/5 transition-colors border-b last:border-b-0',
                          inBatch && 'bg-mostaza/5',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-marron truncate">{producto.nombre}</div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            {producto.codigo && <span>Cód: {producto.codigo}</span>}
                            {producto.codigo_barras && (
                              <span className="font-mono">{producto.codigo_barras}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-rojo text-sm">
                            {formatCurrency(producto.precio_venta)}
                          </div>
                          {producto.categoria && (
                            <Badge variant="secondary" className="text-[10px] h-4 mt-0.5">
                              {producto.categoria.nombre}
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 h-7"
                          onClick={() => addToBatch(producto)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Batch list */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4 text-mostaza" />
                  Lote de Impresión
                  {batch.length > 0 && (
                    <Badge className="ml-1 bg-mostaza/20 text-marron">
                      {batch.length} producto{batch.length !== 1 ? 's' : ''} · {totalEtiquetas} etiqueta{totalEtiquetas !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                {batch.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearBatch} className="text-rojo hover:text-rojo hover:bg-rojo/10">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Vaciar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {batch.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>Agregá productos al lote desde la lista superior</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {batch.map((item) => (
                    <div
                      key={item.producto.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-marron/10 bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-marron truncate">
                          {item.producto.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.producto.codigo_barras ? (
                            <span className="font-mono">{item.producto.codigo_barras}</span>
                          ) : (
                            <span className="text-amber-600">Sin código de barras</span>
                          )}
                          {' · '}
                          {formatCurrency(item.producto.precio_venta)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateBatchCantidad(item.producto.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          value={item.cantidad}
                          onChange={(e) => updateBatchCantidad(item.producto.id, parseInt(e.target.value) || 1)}
                          className="w-14 text-center h-7"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateBatchCantidad(item.producto.id, item.cantidad + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 hover:bg-rojo/10"
                        onClick={() => removeFromBatch(item.producto.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rojo" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ZPL Output */}
          {zplOutput && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-mostaza" />
                    Código ZPL generado
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyZPL}>
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadZPL}>
                      <FileDown className="h-3.5 w-3.5 mr-1" />
                      Descargar .zpl
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted/50 p-3 rounded-lg max-h-64 overflow-auto whitespace-pre-wrap break-all">
                  {zplOutput}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Para imprimir: enviá este código a tu impresora Zebra vía USB, Bluetooth o red.
                  También podés usar <a href="https://labelary.com/viewer.html" target="_blank" rel="noopener noreferrer" className="text-mostaza underline">Labelary</a> para previsualizarlo online.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Config + Preview + Actions */}
        <div className="space-y-4">
          {/* Label Size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-mostaza" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Label size */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tamaño de etiqueta</Label>
                <Select value={labelSizeId} onValueChange={(v) => setLabelSizeId(v as LabelSizeId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LABEL_SIZES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label} — {s.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export format */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Formato de exportación</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF (imprimir desde cualquier PC)</SelectItem>
                    <SelectItem value="zpl">ZPL (impresoras Zebra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fields */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Campos a incluir</Label>
                <div className="space-y-1.5">
                  {(Object.keys(FIELD_LABELS) as Array<keyof FieldConfig>).map((field) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={fields[field]}
                        onCheckedChange={() => toggleField(field)}
                      />
                      <span className="text-sm">{FIELD_LABELS[field]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dates */}
              {(fields.fecha_elaboracion || fields.fecha_vencimiento) && (
                <div className="space-y-2">
                  {fields.fecha_elaboracion && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Fecha elaboración</Label>
                      <Input
                        type="date"
                        value={fechaElaboracion}
                        onChange={(e) => setFechaElaboracion(e.target.value)}
                      />
                    </div>
                  )}
                  {fields.fecha_vencimiento && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Fecha vencimiento</Label>
                      <Input
                        type="date"
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-mostaza" />
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3">
                {/* Size indicator */}
                <div className="text-xs text-muted-foreground">
                  {labelSize.width_mm} × {labelSize.height_mm} mm · escala 1:{Math.round(1 / previewScale)}
                </div>

                {/* Label preview */}
                <div
                  ref={previewRef}
                  className="bg-white border-2 border-gray-300 rounded-sm overflow-hidden flex items-center justify-center"
                  style={{
                    width: `${previewWidthPx}px`,
                    height: `${previewHeightPx}px`,
                  }}
                >
                  {previewItem ? (
                    <div
                      className="flex flex-col items-center justify-between w-full h-full text-center"
                      style={{
                        padding: `${2 * previewScale}px`,
                        fontSize: `${6 * previewScale}px`,
                        lineHeight: 1.1,
                      }}
                    >
                      {/* Top: name */}
                      <div className="w-full">
                        {fields.nombre && (
                          <div className="font-bold text-gray-900 truncate" style={{ fontSize: `${8 * previewScale}px` }}>
                            {previewItem.producto.nombre}
                          </div>
                        )}
                        {fields.categoria && previewItem.producto.categoria?.nombre && (
                          <div className="text-gray-500" style={{ fontSize: `${5 * previewScale}px` }}>
                            {previewItem.producto.categoria.nombre}
                          </div>
                        )}
                      </div>

                      {/* Middle: barcode placeholder */}
                      {fields.codigo_barras && (
                        <div className="flex flex-col items-center w-full">
                          {previewItem.producto.codigo_barras ? (
                            <>
                              <div className="flex gap-px items-end" style={{ height: `${20 * previewScale}px` }}>
                                {Array.from({ length: 30 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="bg-black"
                                    style={{
                                      width: i % 3 === 0 ? `${1.2 * previewScale}px` : `${0.6 * previewScale}px`,
                                      height: `${(12 + (i % 4) * 3) * previewScale}px`,
                                    }}
                                  />
                                ))}
                              </div>
                              <div className="font-mono text-gray-700" style={{ fontSize: `${4 * previewScale}px` }}>
                                {previewItem.producto.codigo_barras}
                              </div>
                            </>
                          ) : (
                            <div className="text-amber-500" style={{ fontSize: `${5 * previewScale}px` }}>
                              Sin código
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom: price + weight + dates */}
                      <div className="w-full">
                        {fields.precio && (
                          <div className="font-bold text-rojo" style={{ fontSize: `${10 * previewScale}px` }}>
                            {formatCurrency(previewItem.producto.precio_venta)}
                          </div>
                        )}
                        {fields.peso && previewItem.producto.peso_unitario_aprox > 0 && (
                          <div className="text-gray-600" style={{ fontSize: `${5 * previewScale}px` }}>
                            {previewItem.producto.peso_unitario_aprox} kg
                          </div>
                        )}
                        {(fields.fecha_elaboracion || fields.fecha_vencimiento) && (
                          <div className="text-gray-500" style={{ fontSize: `${4.5 * previewScale}px` }}>
                            {fields.fecha_elaboracion && fechaElaboracion && `Elab: ${formatDateDisplay(fechaElaboracion)}`}
                            {fields.fecha_elaboracion && fields.fecha_vencimiento && ' '}
                            {fields.fecha_vencimiento && fechaVencimiento && `Venc: ${formatDateDisplay(fechaVencimiento)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400" style={{ fontSize: `${6 * previewScale}px` }}>
                      <Tag className="mx-auto mb-1 opacity-30" style={{ width: `${20 * previewScale}px`, height: `${20 * previewScale}px` }} />
                      Seleccioná un producto
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            {exportFormat === 'pdf' ? (
              <Button
                className="w-full bg-mostaza hover:bg-mostaza/90 text-white h-12 text-base"
                onClick={handleGeneratePDF}
                disabled={batch.length === 0 || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="h-5 w-5 mr-2" />
                    GENERAR PDF ({totalEtiquetas})
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full bg-mostaza hover:bg-mostaza/90 text-white h-12 text-base"
                onClick={handleGenerateZPL}
                disabled={batch.length === 0}
              >
                <Code2 className="h-5 w-5 mr-2" />
                GENERAR ZPL ({totalEtiquetas})
              </Button>
            )}

            {batch.length === 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Agregá productos al lote para generar etiquetas
              </p>
            )}

            {batch.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                📄 {totalEtiquetas} etiqueta(s) · {labelSize.width_mm}×{labelSize.height_mm}mm ·{' '}
                {exportFormat === 'pdf' ? 'PDF una etiqueta por página' : 'ZPL para Zebra'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
