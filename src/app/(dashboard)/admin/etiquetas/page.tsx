'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Search, Loader2, Tag, FileDown, Package, FileText, Printer } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ThermalLabelGenerator from '@/components/admin/ThermalLabelGenerator'

interface ProductoTerminado {
  id: number
  nombre: string
  descripcion: string | null
  codigo: string | null
  codigo_barras: string | null
  precio_venta: number
  peso_unitario_aprox: number
  categoria?: { nombre: string } | null
  estado: boolean
}

type TamanoEtiqueta = import('@/components/print/EtiquetaProductoPDF').TamanoEtiqueta

type EtiquetaProductoPDFType = React.ComponentType<{
  etiquetas: import('@/components/print/EtiquetaProductoPDF').EtiquetaData[]
  tamano?: TamanoEtiqueta
}>

const PESOS_PREDEFINIDOS = [
  { label: '380 g', value: '380g' },
  { label: '500 g', value: '500g' },
  { label: '1 kg', value: '1kg' },
  { label: '2 kg', value: '2kg' },
  { label: 'Personalizado', value: 'custom' },
]

const INFO_EXTRA_OPCIONES = [
  { id: 'sin_gluten', label: 'Sin gluten' },
  { id: 'con_gluten', label: 'Con gluten' },
  { id: 'integral', label: 'Integral' },
  { id: 'congelado', label: 'Congelado' },
  { id: 'artesanal', label: 'Producto artesanal' },
]

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateDisplay(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function generateBarcodeDataUrl(code: string): string | null {
  try {
    const canvas = document.createElement('canvas')
    const format = code.length === 13 ? 'EAN13' : 'CODE128'
    JsBarcode(canvas, code, {
      format,
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 5,
      background: '#FFFFFF',
    })
    return canvas.toDataURL('image/png')
  } catch {
    try {
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, code, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
        margin: 5,
        background: '#FFFFFF',
      })
      return canvas.toDataURL('image/png')
    } catch (err) {
      console.error('Error generando código de barras:', err)
      return null
    }
  }
}

function EtiquetasA4Tab() {
  const [productos, setProductos] = useState<ProductoTerminado[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [selectedProductoId, setSelectedProductoId] = useState<string>('')
  const [pesoOption, setPesoOption] = useState<string>('1kg')
  const [pesoCustom, setPesoCustom] = useState<string>('')
  const [cantidad, setCantidad] = useState<number>(24)
  const [fechaElaboracion, setFechaElaboracion] = useState<string>(formatDateForInput(new Date()))
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('')
  const [infoExtra, setInfoExtra] = useState<string[]>([])
  const [incluirLogo, setIncluirLogo] = useState<boolean>(true)
  const [incluirVencimiento, setIncluirVencimiento] = useState<boolean>(true)
  const [tamano, setTamano] = useState<TamanoEtiqueta>('grande')
  const [unidadesPorPaquete, setUnidadesPorPaquete] = useState<number>(12)

  // Data URLs
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [whatsappIconDataUrl, setWhatsappIconDataUrl] = useState<string | null>(null)

  // PDF component (lazy loaded)
  const [PDFComponent, setPDFComponent] = useState<EtiquetaProductoPDFType | null>(null)

  // Load products
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/productos-terminados?limite=200&estado=true')
        if (res.ok) {
          const result = await res.json()
          setProductos(result.data || result.productos || result || [])
        }
      } catch (err) {
        console.error('Error cargando productos:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Load logo as base64
  useEffect(() => {
    async function loadLogo() {
      try {
        const res = await fetch('/images/logoweb.png')
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onloadend = () => setLogoDataUrl(reader.result as string)
        reader.readAsDataURL(blob)
      } catch {
        setLogoDataUrl(null)
      }
    }
    loadLogo()
  }, [])

  // Generate QR code for WhatsApp (bigger for new design)
  useEffect(() => {
    async function generateQR() {
      try {
        const url = await QRCode.toDataURL(
          'https://wa.me/5493754419324?text=Hola%20Orlando%20quiero%20hacer%20un%20pedido',
          { width: 256, margin: 1, color: { dark: '#333333', light: '#FFFFFF' } }
        )
        setQrCodeDataUrl(url)
      } catch (err) {
        console.error('Error generando QR:', err)
        setQrCodeDataUrl(null)
      }
    }
    generateQR()
  }, [])

  // Load WhatsApp icon as base64
  useEffect(() => {
    async function loadWhatsappIcon() {
      try {
        const res = await fetch('/images/whatsapp-icon.png')
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onloadend = () => setWhatsappIconDataUrl(reader.result as string)
        reader.readAsDataURL(blob)
      } catch {
        setWhatsappIconDataUrl(null)
      }
    }
    loadWhatsappIcon()
  }, [])

  // Lazy load PDF component
  useEffect(() => {
    async function loadPDFComponent() {
      try {
        const mod = await import('@/components/print/EtiquetaProductoPDF')
        setPDFComponent(() => mod.EtiquetaProductoPDF)
      } catch (err) {
        console.error('Error cargando componente PDF:', err)
      }
    }
    loadPDFComponent()
  }, [])

  // Set default vencimiento (30 days from elaboración)
  useEffect(() => {
    if (fechaElaboracion && !fechaVencimiento) {
      const elab = new Date(fechaElaboracion + 'T12:00:00')
      elab.setDate(elab.getDate() + 30)
      setFechaVencimiento(formatDateForInput(elab))
    }
  }, [fechaElaboracion, fechaVencimiento])

  const selectedProducto = productos.find((p) => p.id === Number(selectedProductoId))

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.includes(searchTerm)) ||
      (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleInfoExtraToggle = (id: string) => {
    setInfoExtra((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const getPesoDisplay = (): string => {
    if (pesoOption === 'custom') return pesoCustom || '—'
    const found = PESOS_PREDEFINIDOS.find((p) => p.value === pesoOption)
    return found ? found.label : pesoOption
  }

  const getVencimientoDia = (): number => {
    if (!fechaVencimiento) return 1
    return new Date(fechaVencimiento + 'T12:00:00').getDate()
  }

  const getVencimientoMes = (): number => {
    if (!fechaVencimiento) return 1
    return new Date(fechaVencimiento + 'T12:00:00').getMonth() + 1
  }

  const etiquetasPorHoja = tamano === 'pequena' ? 70 : 24
  const maxCantidad = etiquetasPorHoja * 10
  const hojasNecesarias = Math.ceil(cantidad / etiquetasPorHoja)

  const handleGeneratePDF = useCallback(async () => {
    if (!selectedProducto || !PDFComponent) return

    // Usar el código de barras existente del producto
    const codigoBarras = selectedProducto.codigo_barras

    if (!codigoBarras) {
      alert('Este producto no tiene código de barras asignado. Asignale uno desde la edición del producto.')
      return
    }

    setGenerating(true)

    try {
      // Generar la imagen del código de barras a partir del código existente del producto
      const barcodeDataUrl = generateBarcodeDataUrl(codigoBarras)

      const infoExtraLabels = infoExtra.map((id) => {
        const option = INFO_EXTRA_OPCIONES.find((o) => o.id === id)
        return option ? option.label : id
      })

      const etiquetaData = {
        nombre: selectedProducto.nombre,
        codigo_barras: codigoBarras,
        precio_venta: selectedProducto.precio_venta,
        peso: getPesoDisplay(),
        fecha_elaboracion: formatDateDisplay(fechaElaboracion),
        fecha_vencimiento: formatDateDisplay(fechaVencimiento),
        incluir_logo: incluirLogo,
        incluir_vencimiento: incluirVencimiento,
        barcodeDataUrl,
        logoDataUrl,
        qrCodeDataUrl,
        whatsappIconDataUrl,
        vencimientoDia: getVencimientoDia(),
        vencimientoMes: getVencimientoMes(),
        info_extra: infoExtraLabels,
        unidades_por_paquete: tamano === 'pequena' ? unidadesPorPaquete : null,
        tamano,
      }

      const etiquetas = Array.from({ length: cantidad }, () => etiquetaData)
      const { pdf } = await import('@react-pdf/renderer')
      const blob = await pdf(<PDFComponent etiquetas={etiquetas} tamano={tamano} />).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `etiquetas-${selectedProducto.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el PDF. Intentá de nuevo.')
    } finally {
      setGenerating(false)
    }
  }, [
    selectedProducto,
    PDFComponent,
    cantidad,
    fechaElaboracion,
    fechaVencimiento,
    incluirLogo,
    incluirVencimiento,
    tamano,
    logoDataUrl,
    qrCodeDataUrl,
    whatsappIconDataUrl,
    infoExtra,
    pesoOption,
    pesoCustom,
    unidadesPorPaquete,
  ])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
        <span className="ml-3 text-muted-foreground">Cargando productos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-mostaza/10 rounded-lg">
          <Tag className="h-6 w-6 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Generador de Etiquetas</h1>
          <p className="text-sm text-muted-foreground">
            Generá etiquetas PDF · {etiquetasPorHoja} etiquetas por hoja A4 ({tamano === 'pequena' ? '5×14' : '3×8'})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-mostaza" />
                Seleccionar Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código o código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredProductos.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No se encontraron productos
                  </div>
                ) : (
                  filteredProductos.map((producto) => (
                    <button
                      key={producto.id}
                      onClick={() => setSelectedProductoId(String(producto.id))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-mostaza/5 transition-colors border-b last:border-b-0 ${
                        selectedProductoId === String(producto.id)
                          ? 'bg-mostaza/10 border-l-2 border-l-mostaza'
                          : ''
                      }`}
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
                          ${producto.precio_venta.toLocaleString('es-AR')}
                        </div>
                        {producto.categoria && (
                          <Badge variant="secondary" className="text-[10px] h-4 mt-0.5">
                            {producto.categoria.nombre}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Label Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-mostaza" />
                Opciones de Etiqueta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tamaño de etiqueta */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Tamaño de etiqueta</Label>
                  <Select value={tamano} onValueChange={(v) => {
                    const newTamano = v as TamanoEtiqueta
                    setTamano(newTamano)
                    setCantidad(newTamano === 'pequena' ? 70 : 24)
                    setPesoOption(newTamano === 'pequena' ? '380g' : '500g')
                    setUnidadesPorPaquete(12)
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grande">Grande (70×37mm) - 24 por hoja</SelectItem>
                      <SelectItem value="pequena">Pequeña (4×2cm) - 70 por hoja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Peso */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Peso</Label>
                  <Select value={pesoOption} onValueChange={setPesoOption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PESOS_PREDEFINIDOS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pesoOption === 'custom' && (
                    <Input
                      placeholder="Ej: 750g"
                      value={pesoCustom}
                      onChange={(e) => setPesoCustom(e.target.value)}
                      className="mt-1.5"
                    />
                  )}
                </div>

                {/* Cantidad */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Cantidad de etiquetas</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      disabled={cantidad <= 1}
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={maxCantidad}
                      value={cantidad}
                      onChange={(e) =>
                        setCantidad(Math.max(1, Math.min(maxCantidad, parseInt(e.target.value) || 1)))
                      }
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCantidad(Math.min(maxCantidad, cantidad + 1))}
                      disabled={cantidad >= maxCantidad}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Unidades por paquete (solo etiqueta pequeña) */}
                {tamano === 'pequena' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Unidades por paquete</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={unidadesPorPaquete}
                        onChange={(e) =>
                          setUnidadesPorPaquete(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-20 text-center"
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {[2, 6, 12, 24].map((val) => (
                        <Button
                          key={val}
                          variant={unidadesPorPaquete === val ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 text-xs px-2.5 ${unidadesPorPaquete === val ? 'bg-mostaza hover:bg-mostaza/90 text-white' : ''}`}
                          onClick={() => setUnidadesPorPaquete(val)}
                        >
                          {val}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fecha elaboración */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Fecha de elaboración</Label>
                  <Input
                    type="date"
                    value={fechaElaboracion}
                    onChange={(e) => setFechaElaboracion(e.target.value)}
                  />
                </div>

                {/* Fecha vencimiento */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Fecha de vencimiento</Label>
                  <Input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                </div>
              </div>

              {/* Info extra checkboxes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Información adicional</Label>
                <div className="flex flex-wrap gap-3">
                  {INFO_EXTRA_OPCIONES.map((opcion) => (
                    <label
                      key={opcion.id}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <Checkbox
                        checked={infoExtra.includes(opcion.id)}
                        onCheckedChange={() => handleInfoExtraToggle(opcion.id)}
                      />
                      <span className="text-sm">{opcion.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Incluir logo */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={incluirLogo}
                  onCheckedChange={(v) => setIncluirLogo(v === true)}
                />
                <span className="text-sm">Incluir logo en la etiqueta</span>
              </label>

              {/* Incluir fecha de vencimiento */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={incluirVencimiento}
                  onCheckedChange={(v) => setIncluirVencimiento(v === true)}
                />
                <span className="text-sm">Incluir fecha de vencimiento</span>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vista previa</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProducto ? (
                <div
                  className="mx-auto rounded-lg overflow-hidden bg-white border-2 border-gray-300 relative"
                  style={{
                    width: tamano === 'pequena' ? '120px' : '220px',
                    minHeight: tamano === 'pequena' ? '120px' : '280px',
                    padding: tamano === 'pequena' ? '4px' : '12px',
                  }}
                >
                  {/* Indicador de tamaño */}
                  <div className="absolute top-1 right-1.5 text-[8px] text-gray-400 font-medium">
                    {tamano === 'pequena' ? '4×2cm' : '70×37mm'}
                  </div>
                  <div className="flex flex-col" style={{ fontSize: tamano === 'pequena' ? '4px' : '8px' }}>
                    {/* FILA 1: Logo (izq) + Nombre (der del logo) */}
                    <div className="flex items-center mb-1">
                      {incluirLogo && (
                        <div className="w-[30%] flex items-center justify-center pr-1">
                          <Image
                            src="/images/logoweb.png"
                            alt="Logo"
                            width={tamano === 'pequena' ? 18 : 40}
                            height={tamano === 'pequena' ? 18 : 40}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className={incluirLogo ? 'w-[70%]' : 'w-full'} style={{ paddingLeft: tamano === 'pequena' ? '2px' : '6px' }}>
                        <div className="font-bold text-gray-800 leading-tight" style={{ fontSize: tamano === 'pequena' ? '5px' : '9px' }}>
                          {selectedProducto.nombre}
                        </div>
                      </div>
                    </div>

                    {/* FILA 2: Info extra (izq) + Precio/Peso (der) */}
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex flex-wrap flex-1">
                        {infoExtra.map((id) => {
                          const option = INFO_EXTRA_OPCIONES.find((o) => o.id === id)
                          return option ? (
                            <span
                              key={id}
                              className="text-gray-700 mr-1.5"
                              style={{ fontSize: tamano === 'pequena' ? '2.5px' : '4.5px' }}
                            >
                              {option.label}
                            </span>
                          ) : null
                        })}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-black" style={{ fontSize: tamano === 'pequena' ? '5px' : '9px' }}>
                          ${selectedProducto.precio_venta.toLocaleString('es-AR')}
                        </span>
                        <span className="text-gray-600" style={{ fontSize: tamano === 'pequena' ? '3px' : '5.5px' }}>
                          Peso: {getPesoDisplay()}
                        </span>
                        {tamano === 'pequena' && unidadesPorPaquete > 0 && (
                          <span className="font-bold" style={{ fontSize: tamano === 'pequena' ? '2.5px' : '5px', color: '#5C3A21' }}>
                            Contiene: {unidadesPorPaquete} unidades
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Texto "Vencimiento" sobre el calendario */}
                    <div className="text-gray-600 mb-0.5" style={{ fontSize: tamano === 'pequena' ? '2.5px' : '4.5px' }}>
                      Vencimiento
                    </div>

                    {/* Calendario (bordes negros finos, con resaltado si incluir_vencimiento) */}
                    <div className="border border-black overflow-hidden mb-1.5" style={{ borderWidth: '0.5px' }}>
                      {/* Días 1-31 */}
                      <div className="flex">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => {
                          const isHighlight = incluirVencimiento && dia === getVencimientoDia()
                          return (
                            <div
                              key={dia}
                              className="flex items-center justify-center leading-none"
                              style={{
                                width: '3.226%',
                                height: tamano === 'pequena' ? '3px' : '6px',
                                fontSize: tamano === 'pequena' ? '1.5px' : '3px',
                                borderRight: '0.25px solid black',
                                borderBottom: '0.25px solid black',
                                color: isHighlight ? '#C41E3A' : '#6b7280',
                                fontWeight: isHighlight ? 'bold' : 'normal',
                              }}
                            >
                              {dia}
                            </div>
                          )
                        })}
                      </div>
                      {/* Meses */}
                      <div className="flex">
                        {MESES_CORTOS.map((mes, idx) => {
                          const isHighlight = incluirVencimiento && (idx + 1) === getVencimientoMes()
                          return (
                            <div
                              key={mes}
                              className="flex items-center justify-center leading-none"
                              style={{
                                width: '8.333%',
                                height: tamano === 'pequena' ? '3px' : '6px',
                                fontSize: tamano === 'pequena' ? '1.5px' : '3px',
                                borderRight: '0.25px solid black',
                                borderBottom: '0.25px solid black',
                                color: isHighlight ? '#C41E3A' : '#6b7280',
                                fontWeight: isHighlight ? 'bold' : 'normal',
                              }}
                            >
                              {mes}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* FILA 4: Barras+Elab (izq) | QR+WhatsApp (der) */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {selectedProducto.codigo_barras ? (
                          <>
                            <div className="flex gap-px items-end" style={{ height: tamano === 'pequena' ? '10px' : '20px' }}>
                              {Array.from({ length: tamano === 'pequena' ? 25 : 45 }, (_, i) => (
                                <div
                                  key={i}
                                  className="bg-black"
                                  style={{
                                    width: i % 3 === 0 ? '0.8px' : '0.4px',
                                    height: `${(tamano === 'pequena' ? 5 : 10) + (i % 5) * (tamano === 'pequena' ? 1 : 2)}px`,
                                  }}
                                />
                              ))}
                            </div>
                            <div className="text-center" style={{ fontSize: tamano === 'pequena' ? '2px' : '4px', fontFamily: 'monospace' }}>
                              {selectedProducto.codigo_barras}
                            </div>
                          </>
                        ) : (
                          <span className="text-red-400" style={{ fontSize: tamano === 'pequena' ? '2.5px' : '5px' }}>Sin código de barras</span>
                        )}
                        <div className="text-gray-500 mt-0.5" style={{ fontSize: tamano === 'pequena' ? '2.5px' : '4.5px' }}>
                          Elab: {formatDateDisplay(fechaElaboracion)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0" style={{ width: tamano === 'pequena' ? '20px' : '36px', marginLeft: tamano === 'pequena' ? '3px' : '8px' }}>
                        <div className="border border-gray-200 rounded-sm bg-white flex items-center justify-center" style={{ width: tamano === 'pequena' ? '14px' : '28px', height: tamano === 'pequena' ? '14px' : '28px' }}>
                          <span className="text-gray-400 font-bold" style={{ fontSize: tamano === 'pequena' ? '2px' : '4px' }}>QR</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5 w-full justify-end">
                          <div className="rounded-full bg-[#25D366] flex items-center justify-center relative shrink-0" style={{ width: tamano === 'pequena' ? '5px' : '10px', height: tamano === 'pequena' ? '5px' : '10px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: tamano === 'pequena' ? '3px' : '6px', height: tamano === 'pequena' ? '3px' : '6px' }} className="fill-white">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.106 1.519 5.834L.526 23.5l5.855-.97A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.98 0-3.868-.528-5.527-1.526l-.397-.236-3.414.567.578-3.327-.259-.413A9.785 9.785 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/>
                            </svg>
                          </div>
                          <span className="text-green-600 font-bold leading-none" style={{ fontSize: tamano === 'pequena' ? '1.8px' : '3.5px' }}>3754-419324</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <Tag className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>Seleccioná un producto para ver la vista previa</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            className="w-full bg-mostaza hover:bg-mostaza/90 text-white h-12 text-base"
            onClick={handleGeneratePDF}
            disabled={!selectedProducto || generating || !PDFComponent}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <FileDown className="h-5 w-5 mr-2" />
                GENERAR ({cantidad}) · {hojasNecesarias} hoja{hojasNecesarias !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          {!selectedProducto && (
            <p className="text-xs text-center text-muted-foreground">
              Seleccioná un producto para generar las etiquetas
            </p>
          )}

          {selectedProducto && selectedProducto.codigo_barras && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <svg className="h-3.5 w-3.5 text-mostaza" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
              <span className="text-xs font-mono text-marron">{selectedProducto.codigo_barras}</span>
            </div>
          )}

          {selectedProducto && !selectedProducto.codigo_barras && (
            <p className="text-xs text-center text-red-500">
              ⚠️ Este producto no tiene código de barras asignado. Editá el producto para asignarle uno.
            </p>
          )}

          {selectedProducto && (
            <p className="text-xs text-center text-muted-foreground">
              📄 {cantidad} etiquetas en {hojasNecesarias} hoja{hojasNecesarias !== 1 ? 's' : ''} A4 ({etiquetasPorHoja} por hoja)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EtiquetasPage() {
  const [tab, setTab] = useState('a4')

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="a4" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Hoja A4 (24/70 por hoja)
          </TabsTrigger>
          <TabsTrigger value="thermal" className="gap-1.5">
            <Printer className="h-4 w-4" />
            Impresora Térmica (PDF/ZPL)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a4">
          <EtiquetasA4Tab />
        </TabsContent>
        <TabsContent value="thermal">
          <ThermalLabelGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
