'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ComprasPrintButton from '@/components/admin/ComprasPrintButton'
import type { OrdenCompraData } from '@/components/print/OrdenCompraPDFDocument'

interface DetalleCompra {
  id: number
  id_materia_prima: number | null
  id_insumo: number | null
  id_marca: number | null
  cantidad_comprada: number
  precio_unitario: number
  precio_total: number
  fecha_vencimiento: string | null
  lote: string | null
  cantidad_base: number
  precio_por_unidad_base: number
  materiaPrima?: { id: number; nombre: string; codigo: string | null } | null
  insumo?: { id: number; nombre: string; codigo: string | null } | null
  marca?: { id: number; nombre: string } | null
  unidadCompra: { id: number; codigo: string; nombre: string }
}

interface Compra {
  id: number
  numero_factura: string | null
  fecha_compra: string
  subtotal: number
  iva: number
  total: number
  observaciones: string | null
  createdAt: string
  proveedor: { id: number; nombre: string; apellido: string; razon_social: string | null }
  formaPago: { id: number; nombre_forma: string }
  estado: { id: number; nombre_estado: string; es_final: boolean }
  detalle: DetalleCompra[]
}

// Transform Compra record to OrdenCompraData for PDF export
function toCompraData(compra: Compra): OrdenCompraData {
  return {
    id: compra.id,
    numero_factura: compra.numero_factura,
    fecha_compra: compra.fecha_compra,
    subtotal: compra.subtotal,
    iva: compra.iva,
    total: compra.total,
    observaciones: compra.observaciones,
    proveedor: compra.proveedor?.razon_social
      || `${compra.proveedor?.nombre || ''} ${compra.proveedor?.apellido || ''}`.trim()
      || '-',
    forma_pago: compra.formaPago?.nombre_forma || '-',
    estado: compra.estado?.nombre_estado || '-',
    detalle: (compra.detalle || []).map((d) => ({
      tipo: d.id_materia_prima ? 'materia_prima' as const : 'insumo' as const,
      nombre: d.materiaPrima?.nombre || d.insumo?.nombre || '-',
      marca: d.marca?.nombre || null,
      cantidad: d.cantidad_comprada,
      unidad: d.unidadCompra?.nombre || '-',
      precio_unitario: d.precio_unitario,
      precio_total: d.precio_total,
      vencimiento: d.fecha_vencimiento,
      lote: d.lote,
    })),
  }
}

export default function CompraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [compra, setCompra] = useState<Compra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCompra() {
      try {
        const res = await fetch(`/api/compras/${params.id}`)
        if (!res.ok) throw new Error('Error al cargar compra')
        const data = await res.json()
        setCompra(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchCompra()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  if (!compra) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Compra no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/compras')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    )
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-mostaza/10 text-mostaza'
      case 'en_proceso': return 'bg-blue-100 text-blue-700'
      case 'completado': case 'recibido': return 'bg-oliva/10 text-oliva'
      case 'anulado': return 'bg-rojo/10 text-rojo'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/compras">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
          <h1 className="text-2xl font-bold text-marron">Compra #{compra.id}</h1>
          <p className="text-sm text-muted-foreground">Detalle de la compra</p>
          </div>
        </div>
        <ComprasPrintButton compra={toCompraData(compra)} variant="full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-marron/10 bg-card p-4 space-y-2">
          <h3 className="font-semibold text-marron">Información General</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Proveedor:</span>
            <span className="font-medium">{compra.proveedor.razon_social || `${compra.proveedor.nombre} ${compra.proveedor.apellido}`}</span>
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">{new Date(compra.fecha_compra).toLocaleDateString('es-AR')}</span>
            <span className="text-muted-foreground">Factura:</span>
            <span className="font-medium">{compra.numero_factura || '-'}</span>
            <span className="text-muted-foreground">Forma de Pago:</span>
            <span className="font-medium">{compra.formaPago.nombre_forma}</span>
            <span className="text-muted-foreground">Estado:</span>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(compra.estado.nombre_estado)}`}>
              {compra.estado.nombre_estado}
            </span>
          </div>
          {compra.observaciones && (
            <div className="pt-2 border-t">
              <span className="text-muted-foreground text-sm">Observaciones:</span>
              <p className="text-sm">{compra.observaciones}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-marron/10 bg-card p-4 space-y-2">
          <h3 className="font-semibold text-marron">Totales</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(compra.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (21%):</span>
              <span>{formatCurrency(compra.iva)}</span>
            </div>
            <div className="flex justify-between font-bold text-marron text-base pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(compra.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-marron">Detalle de Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Producto</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Marca</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantidad</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Unidad</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">P. Unit.</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">P. Total</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Vencimiento</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Lote</th>
              </tr>
            </thead>
            <tbody>
              {compra.detalle.map((d) => (
                <tr key={d.id} className="border-t hover:bg-mostaza/5">
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.id_materia_prima ? 'bg-oliva/10 text-oliva' : 'bg-mostaza/10 text-mostaza'}`}>
                      {d.id_materia_prima ? 'MP' : 'Ins'}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-marron">
                    {d.materiaPrima?.nombre || d.insumo?.nombre || '-'}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{d.marca?.nombre || '-'}</td>
                  <td className="px-4 py-2 text-right">{d.cantidad_comprada}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d.unidadCompra?.nombre || '-'}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(d.precio_unitario)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(d.precio_total)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-AR') : '-'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d.lote || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
