'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  ShoppingCart,
  Eye,
  RotateCcw,
  FileDown,
  Phone,
} from 'lucide-react'
import { ReactElement } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import dynamic from 'next/dynamic'

const PresupuestoPDF = dynamic(() => import('@/components/print/PresupuestoPDF'), {
  ssr: false,
})

import { PresupuestoPDFDocument } from '@/components/print/PresupuestoPDFDocument'
import {
  downloadPresupuestoPDF,
  buildPresupuestoWhatsAppLink,
  normalizePhoneForWhatsApp,
} from '@/lib/presupuesto-utils'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('es-AR')
  } catch {
    return dateStr
  }
}

interface PresupuestoData {
  id: number
  numero: string
  fecha_creacion: string
  fecha_validez: string
  subtotal: number
  iva: number
  total: number
  observaciones?: string | null
  estado: string
  id_pedido?: number | null
  cliente: {
    id: number
    nombre: string
    apellido: string
    razon_social?: string | null
    cuit?: string | null
    condicion_iva?: string | null
    contactos?: Array<{
      id: number
      valor: string
      es_principal: boolean
      tipo: { id: number; nombre: string }
    }>
  }
  detalle: Array<{
    id: number
    cantidad: number
    precio_unitario: number
    subtotal: number
    productoTerminado: {
      id: number
      nombre: string
      precio_venta: number
    }
  }>
  pedido?: { id: number } | null
}

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
  aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle2 className="h-3 w-3" /> },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="h-3 w-3" /> },
  expirado: { label: 'Expirado', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: <AlertCircle className="h-3 w-3" /> },
  convertido: { label: 'Convertido', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <ArrowRightLeft className="h-3 w-3" /> },
}

export default function PresupuestoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const accionInicial = searchParams.get('accion') // 'pdf' | 'whatsapp' | null

  const [presupuesto, setPresupuesto] = useState<PresupuestoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrint, setShowPrint] = useState(false)
  const [cambioEstadoDialog, setCambioEstadoDialog] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Nuevos estados para PDF y WhatsApp
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [whatsAppDialog, setWhatsAppDialog] = useState(false)
  const [telefonoManual, setTelefonoManual] = useState('')

  const fetchPresupuesto = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/presupuestos/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPresupuesto(data)
    } catch {
      toast.error('Error al cargar presupuesto')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPresupuesto()
  }, [fetchPresupuesto])

  // Auto-trigger acción inicial (pdf o whatsapp) cuando llega desde "Guardar y ..."
  // y el presupuesto ya está cargado.
  const [accionEjecutada, setAccionEjecutada] = useState(false)
  useEffect(() => {
    if (!presupuesto || accionEjecutada || !accionInicial) return
    setAccionEjecutada(true)
    // Pequeño delay para asegurar que el componente esté completamente renderizado
    const timer = setTimeout(() => {
      if (accionInicial === 'pdf') {
        handleExportarPDF()
      } else if (accionInicial === 'whatsapp') {
        handleEnviarWhatsApp()
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [presupuesto, accionInicial, accionEjecutada])

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Presupuesto ${presupuesto?.numero || ''}</title>
              <style>
                body { margin: 0; font-family: sans-serif; color: #5C3A21; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #d1d5db; padding: 6px 12px; }
                .bg-marron { background-color: #5C3A21; color: white; }
                .bg-gray-50 { background-color: #f9fafb; }
                .text-mostaza { color: #E1AD01; }
                .text-marron { color: #5C3A21; }
                .font-bold { font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .border-marron { border-color: #5C3A21; }
                .border-gray-300 { border-color: #d1d5db; }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return
    setCambiandoEstado(true)
    try {
      const res = await fetch(`/api/presupuestos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) throw new Error()
      toast.success('Estado actualizado correctamente')
      setCambioEstadoDialog(false)
      fetchPresupuesto()
    } catch {
      toast.error('Error al cambiar estado')
    } finally {
      setCambiandoEstado(false)
    }
  }

  /**
   * Obtiene el teléfono principal del cliente desde sus contactos.
   * Busca en este orden: WhatsApp, teléfono, celular, móvil.
   */
  const getClienteTelefono = useCallback((): string | null => {
    if (!presupuesto?.cliente?.contactos) return null
    const contactos = presupuesto.cliente.contactos
    // Buscar primero contactos marcados como principal
    const principales = contactos.filter((c) => c.es_principal)
    const buscarTelefono = (lista: typeof contactos): string | null => {
      for (const c of lista) {
        const nombre = c.tipo?.nombre?.toLowerCase() || ''
        if (
          nombre.includes('whatsapp') ||
          nombre.includes('teléfono') ||
          nombre.includes('telefono') ||
          nombre.includes('celular') ||
          nombre.includes('móvil') ||
          nombre.includes('movil')
        ) {
          return c.valor
        }
      }
      return null
    }
    return buscarTelefono(principales) || buscarTelefono(contactos)
  }, [presupuesto])

  /**
   * Construye el elemento Document de react-pdf para el presupuesto actual.
   */
  const buildPDFDocument = useCallback((): ReactElement | null => {
    if (!presupuesto) return null
    return (
      <PresupuestoPDFDocument
        presupuesto={{
          numero: presupuesto.numero,
          fecha_creacion: presupuesto.fecha_creacion,
          fecha_validez: presupuesto.fecha_validez,
          subtotal: presupuesto.subtotal,
          iva: presupuesto.iva,
          total: presupuesto.total,
          observaciones: presupuesto.observaciones,
          estado: presupuesto.estado,
        }}
        cliente={{
          nombre: presupuesto.cliente.nombre,
          apellido: presupuesto.cliente.apellido,
          razon_social: presupuesto.cliente.razon_social,
          cuit: presupuesto.cliente.cuit,
          condicion_iva: presupuesto.cliente.condicion_iva,
          telefono: getClienteTelefono(),
        }}
        productos={presupuesto.detalle.map((d) => ({
          nombre: d.productoTerminado.nombre,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
        }))}
      />
    )
  }, [presupuesto, getClienteTelefono])

  /**
   * Genera y descarga el PDF del presupuesto.
   */
  const handleExportarPDF = async () => {
    const doc = buildPDFDocument()
    if (!doc) {
      toast.error('No se pudo generar el PDF')
      return
    }
    setGenerandoPDF(true)
    try {
      await downloadPresupuestoPDF(
        doc,
        `Presupuesto-${presupuesto?.numero || 'documento'}`
      )
      toast.success('PDF generado y descargado correctamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF. Intente nuevamente.')
    } finally {
      setGenerandoPDF(false)
    }
  }

  /**
   * Abre WhatsApp con el mensaje del presupuesto.
   * Si el cliente tiene teléfono, lo usa directamente.
   * Si no, abre un diálogo para ingresar el teléfono manualmente.
   */
  const handleEnviarWhatsApp = () => {
    if (!presupuesto) return
    const telefono = getClienteTelefono()
    if (telefono) {
      // Tiene teléfono: abrir directamente
      const { url } = buildPresupuestoWhatsAppLink({
        clienteNombre:
          presupuesto.cliente.razon_social ||
          `${presupuesto.cliente.nombre} ${presupuesto.cliente.apellido}`,
        clienteTelefono: telefono,
        numero: presupuesto.numero,
        total: presupuesto.total,
        fechaValidez: presupuesto.fecha_validez,
        detalles: presupuesto.detalle.map((d) => ({
          nombre: d.productoTerminado.nombre,
          cantidad: d.cantidad,
          subtotal: d.subtotal,
        })),
      })
      window.open(url, '_blank', 'noopener,noreferrer')
      toast.success('Abriendo WhatsApp...')
    } else {
      // Sin teléfono: abrir diálogo para ingresarlo manualmente
      setTelefonoManual('')
      setWhatsAppDialog(true)
    }
  }

  /**
   * Abre WhatsApp usando el teléfono ingresado manualmente.
   */
  const handleWhatsAppManual = () => {
    if (!presupuesto) return
    const telefonoLimpio = telefonoManual.trim()
    if (!telefonoLimpio) {
      toast.error('Debe ingresar un número de teléfono')
      return
    }
    const telefonoNormalizado = normalizePhoneForWhatsApp(telefonoLimpio)
    if (!telefonoNormalizado) {
      toast.error('El número de teléfono no es válido')
      return
    }
    const { url } = buildPresupuestoWhatsAppLink({
      clienteNombre:
        presupuesto.cliente.razon_social ||
        `${presupuesto.cliente.nombre} ${presupuesto.cliente.apellido}`,
      clienteTelefono: telefonoNormalizado,
      numero: presupuesto.numero,
      total: presupuesto.total,
      fechaValidez: presupuesto.fecha_validez,
      detalles: presupuesto.detalle.map((d) => ({
        nombre: d.productoTerminado.nombre,
        cantidad: d.cantidad,
        subtotal: d.subtotal,
      })),
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setWhatsAppDialog(false)
    toast.success('Abriendo WhatsApp...')
  }

  const getAcciones = (estado: string) => {
    switch (estado) {
      case 'pendiente': return [
        { label: 'Aprobar', estado: 'aprobado', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 text-white' },
        { label: 'Rechazar', estado: 'rechazado', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' as const, className: 'bg-rojo hover:bg-rojo/90 text-white' },
      ]
      case 'aprobado': return [
        { label: 'Convertir a Pedido', estado: 'convertido', icon: <ShoppingCart className="h-4 w-4" />, variant: 'default' as const, className: 'bg-mostaza hover:bg-mostaza/90 text-marron font-semibold' },
      ]
      case 'rechazado':
      case 'expirado': return [
        { label: 'Reabrir', estado: 'pendiente', icon: <RotateCcw className="h-4 w-4" />, variant: 'outline' as const, className: 'border-marron/30 text-marron' },
      ]
      default: return []
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Presupuesto no encontrado</p>
        <Button variant="link" className="text-mostaza mt-2" onClick={() => router.push('/admin/presupuestos')}>
          Volver a la lista
        </Button>
      </div>
    )
  }

  const estCfg = estadoConfig[presupuesto.estado] || estadoConfig.pendiente
  const acciones = getAcciones(presupuesto.estado)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/presupuestos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-marron">Presupuesto {presupuesto.numero}</h1>
              <Badge variant="outline" className={`${estCfg.color} gap-1`}>
                {estCfg.icon} {estCfg.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Creado el {formatDate(presupuesto.fecha_creacion)} — Válido hasta {formatDate(presupuesto.fecha_validez)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {acciones.map((accion) => (
            <Button
              key={accion.estado}
              variant={accion.variant}
              className={accion.className}
              onClick={() => { setNuevoEstado(accion.estado); setCambioEstadoDialog(true) }}
            >
              {accion.icon}
              <span className="ml-2">{accion.label}</span>
            </Button>
          ))}
          <Button
            variant="outline"
            className="border-marron/30"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button
            variant="outline"
            className="border-marron/30 text-marron hover:bg-marron/5"
            onClick={handleExportarPDF}
            disabled={generandoPDF}
          >
            {generandoPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            className="border-whatsapp/30 text-whatsapp hover:bg-whatsapp/10"
            onClick={handleEnviarWhatsApp}
          >
            <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
          </Button>
          {presupuesto.estado === 'convertido' && presupuesto.pedido && (
            <Button
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/admin/pedidos-clientes')}
            >
              <Eye className="h-4 w-4 mr-2" /> Ver Pedido #{presupuesto.pedido.id}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nombre / Razón Social</p>
                  <p className="font-semibold text-marron">
                    {presupuesto.cliente.razon_social || `${presupuesto.cliente.nombre} ${presupuesto.cliente.apellido}`}
                  </p>
                </div>
                {presupuesto.cliente.cuit && (
                  <div>
                    <p className="text-muted-foreground">CUIT</p>
                    <p className="font-semibold">{presupuesto.cliente.cuit}</p>
                  </div>
                )}
                {presupuesto.cliente.condicion_iva && (
                  <div>
                    <p className="text-muted-foreground">Condición IVA</p>
                    <p className="font-semibold">{presupuesto.cliente.condicion_iva}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron">Detalle de Productos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-marron/5">
                    <TableHead className="font-semibold text-marron">Producto</TableHead>
                    <TableHead className="font-semibold text-marron text-center">Cantidad</TableHead>
                    <TableHead className="font-semibold text-marron text-right">Precio Unit.</TableHead>
                    <TableHead className="font-semibold text-marron text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuesto.detalle.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.productoTerminado.nombre}</TableCell>
                      <TableCell className="text-center">{d.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCurrency(d.precio_unitario)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(d.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Observaciones */}
          {presupuesto.observaciones && (
            <Card className="border-marron/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-marron">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{presupuesto.observaciones}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha - Totales */}
        <div className="space-y-6">
          <Card className="border-mostaza/30 bg-crema/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron">Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(presupuesto.subtotal)}</span>
              </div>
              {presupuesto.iva > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA:</span>
                  <span className="font-semibold">{formatCurrency(presupuesto.iva)}</span>
                </div>
              )}
              <div className="border-t border-marron/20 pt-2 flex justify-between">
                <span className="font-bold text-marron text-lg">TOTAL:</span>
                <span className="font-bold text-mostaza text-lg">{formatCurrency(presupuesto.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full border-marron/30" onClick={() => setShowPrint(!showPrint)}>
            <Printer className="h-4 w-4 mr-2" />
            {showPrint ? 'Ocultar vista de impresión' : 'Vista de impresión'}
          </Button>
        </div>
      </div>

      {/* Área de impresión (oculta por defecto) */}
      {showPrint && (
        <Card className="border-marron/10">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-marron">Vista de Impresión</CardTitle>
            <Button size="sm" className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir
            </Button>
          </CardHeader>
          <CardContent>
            <PresupuestoPDF
              ref={printRef}
              presupuesto={{
                numero: presupuesto.numero,
                fecha_creacion: presupuesto.fecha_creacion,
                fecha_validez: presupuesto.fecha_validez,
                subtotal: presupuesto.subtotal,
                iva: presupuesto.iva,
                total: presupuesto.total,
                observaciones: presupuesto.observaciones,
                estado: presupuesto.estado,
              }}
              cliente={{
                nombre: presupuesto.cliente.nombre,
                apellido: presupuesto.cliente.apellido,
                razon_social: presupuesto.cliente.razon_social,
                cuit: presupuesto.cliente.cuit,
                condicion_iva: presupuesto.cliente.condicion_iva,
              }}
              productos={presupuesto.detalle.map(d => ({
                nombre: d.productoTerminado.nombre,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal,
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog confirmar cambio de estado */}
      <Dialog open={cambioEstadoDialog} onOpenChange={setCambioEstadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-marron">Confirmar cambio de estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              ¿Desea cambiar el estado del presupuesto <strong>{presupuesto.numero}</strong> a{' '}
              <strong>{estadoConfig[nuevoEstado]?.label || nuevoEstado}</strong>?
            </p>
            {nuevoEstado === 'convertido' && (
              <p className="text-sm text-oliva bg-oliva/10 p-3 rounded">
                Se creará un Pedido de Cliente automáticamente con los datos de este presupuesto.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCambioEstadoDialog(false)}>Cancelar</Button>
            <Button
              className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
              disabled={cambiandoEstado}
              onClick={handleCambiarEstado}
            >
              {cambiandoEstado ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ingresar teléfono manualmente para WhatsApp */}
      <Dialog open={whatsAppDialog} onOpenChange={setWhatsAppDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-marron flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Enviar por WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              El cliente <strong>{presupuesto.cliente.razon_social || `${presupuesto.cliente.nombre} ${presupuesto.cliente.apellido}`}</strong> no
              tiene un teléfono cargado. Ingresá el número al que querés enviar el presupuesto:
            </p>
            <div className="space-y-2">
              <Label htmlFor="telefono-manual">Número de teléfono</Label>
              <Input
                id="telefono-manual"
                type="tel"
                placeholder="Ej: 3754 419324 / +54 9 3754 419324"
                value={telefonoManual}
                onChange={(e) => setTelefonoManual(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleWhatsAppManual()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Se normalizará automáticamente el formato (se quitan espacios, guiones, etc.).
                Si no tiene código de país, se asume Argentina (54).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsAppDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-whatsapp hover:bg-whatsapp/90 text-white font-semibold"
              onClick={handleWhatsAppManual}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
