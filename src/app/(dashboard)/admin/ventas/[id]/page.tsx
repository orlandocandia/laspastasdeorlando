'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import VentasPrintMenu from '@/components/admin/VentasPrintMenu'
import EnviarEmailDocumento from '@/components/admin/EnviarEmailDocumento'

interface DetalleVenta {
  id: number
  id_producto_terminado: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  productoTerminado: { id: number; nombre: string; precio_venta: number }
}

interface Venta {
  id: number
  id_cliente: number
  id_vendedor: number
  id_forma_pago: number
  id_pedido: number | null
  numero_comprobante: string | null
  fecha_venta: string
  subtotal: number
  iva: number
  total: number
  id_estado: number
  createdAt: string
  updatedAt: string | null
  cliente: { id: number; nombre: string; apellido: string; razon_social: string | null; numero_documento?: string | null; tipo_persona?: string | null }
  vendedor: { id: number; persona: { nombre: string; apellido: string } }
  formaPago: { id: number; nombre_forma: string }
  pedido: { id: number } | null
  estado: { id: number; nombre_estado: string; entidad_aplicable: string | null }
  detalle: DetalleVenta[]
}

export default function VentaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVenta() {
      try {
        const res = await fetch(`/api/ventas/${params.id}`)
        if (!res.ok) throw new Error('Error al cargar venta')
        const data = await res.json()
        setVenta(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchVenta()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  if (!venta) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Venta no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/ventas')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    )
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)

  const getClienteNombre = (v: Venta) =>
    v.cliente?.razon_social || `${v.cliente?.nombre || ''} ${v.cliente?.apellido || ''}`.trim()

  const getEstadoBadgeClass = (nombreEstado: string) => {
    const key = nombreEstado.toLowerCase().replace(/ /g, '_')
    const map: Record<string, string> = {
      pendiente: 'bg-mostaza/15 text-mostaza hover:bg-mostaza/25',
      confirmado: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      completado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
      entregado: 'bg-oliva/15 text-oliva hover:bg-oliva/25',
      anulado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
      cancelado: 'bg-rojo/15 text-rojo hover:bg-rojo/25',
    }
    return map[key] || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/ventas">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-marron">Venta #{venta.id}</h1>
            <p className="text-sm text-muted-foreground">
              {venta.numero_comprobante ? `Comprobante: ${venta.numero_comprobante}` : 'Sin comprobante'}
            </p>
          </div>
        </div>

        {/* Print menu */}
        <VentasPrintMenu
          venta={{
            ...venta,
            cliente: {
              nombre: venta.cliente?.nombre || '',
              apellido: venta.cliente?.apellido || '',
              razon_social: venta.cliente?.razon_social || null,
              numero_documento: venta.cliente?.numero_documento || null,
              tipo_persona: venta.cliente?.tipo_persona || null,
            },
            detalle: (venta.detalle || []).map((d) => ({
              nombre: d.productoTerminado?.nombre || '',
              codigo: null,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
              subtotal: d.subtotal,
            })),
          }}
        />
        <EnviarEmailDocumento
          tipo="factura"
          id={venta.id}
          label={`Factura ${venta.numero_comprobante || `V-${String(venta.id).padStart(6, '0')}`}`}
          variant="sm"
        />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-marron/10 bg-card p-4 space-y-2">
          <h3 className="font-semibold text-marron">Información General</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{getClienteNombre(venta)}</span>
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">{format(new Date(venta.fecha_venta), 'dd/MM/yyyy')}</span>
            <span className="text-muted-foreground">Comprobante:</span>
            <span className="font-medium">{venta.numero_comprobante || '-'}</span>
            <span className="text-muted-foreground">Forma de Pago:</span>
            <span className="font-medium">{venta.formaPago?.nombre_forma || '-'}</span>
            <span className="text-muted-foreground">Vendedor:</span>
            <span className="font-medium">
              {venta.vendedor?.persona
                ? `${venta.vendedor.persona.nombre} ${venta.vendedor.persona.apellido}`
                : '-'}
            </span>
            <span className="text-muted-foreground">Estado:</span>
            <span>
              <Badge className={getEstadoBadgeClass(venta.estado?.nombre_estado || '')}>
                {venta.estado?.nombre_estado || '-'}
              </Badge>
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-marron/10 bg-card p-4 space-y-2">
          <h3 className="font-semibold text-marron">Totales</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(venta.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (21%):</span>
              <span>{formatCurrency(venta.iva)}</span>
            </div>
            <div className="flex justify-between font-bold text-marron text-base pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(venta.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle table */}
      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-marron">Detalle de Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Producto</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantidad</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">P. Unit.</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalle?.map((d) => (
                <tr key={d.id} className="border-t hover:bg-mostaza/5">
                  <td className="px-4 py-2 font-medium text-marron">
                    {d.productoTerminado?.nombre || '-'}
                  </td>
                  <td className="px-4 py-2 text-right">{d.cantidad}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(d.precio_unitario)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
