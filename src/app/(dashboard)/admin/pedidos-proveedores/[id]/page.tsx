'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import FichaPrintMenu from '@/components/admin/FichaPrintMenu'
import OrdenPedidoProveedorDocument, { type PedidoProveedorDocData } from '@/components/print/OrdenPedidoProveedorPDFDocument'

interface DetallePedido {
  id: number
  id_materia_prima: number | null
  id_insumo: number | null
  cantidad_pedida: number
  precio_estimado: number
  materiaPrima?: { id: number; nombre: string; codigo: string | null } | null
  insumo?: { id: number; nombre: string; codigo: string | null } | null
  unidad: { id: number; codigo: string; nombre: string }
}

interface Pedido {
  id: number
  fecha_pedido: string
  fecha_entrega_estimada: string | null
  fecha_entrega_real: string | null
  observaciones: string | null
  total_estimado: number
  createdAt: string
  proveedor: { id: number; nombre: string; apellido: string; razon_social: string | null; numero_documento: string | null; tipo_persona: string | null }
  estado: { id: number; nombre_estado: string; es_final: boolean }
  detalle: DetallePedido[]
}

export default function PedidoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPedido() {
      try {
        const res = await fetch(`/api/pedidos-proveedores/${params.id}`)
        if (!res.ok) throw new Error('Error al cargar pedido')
        const data = await res.json()
        setPedido(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchPedido()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/pedidos-proveedores')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    )
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-mostaza/10 text-mostaza'
      case 'confirmado': return 'bg-blue-100 text-blue-700'
      case 'completado': case 'recibido': return 'bg-oliva/10 text-oliva'
      case 'anulado': return 'bg-rojo/10 text-rojo'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/pedidos-proveedores">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-marron">Pedido #{pedido.id}</h1>
          <p className="text-sm text-muted-foreground">Detalle del pedido a proveedor</p>
        </div>
        <div className="ml-auto">
          <FichaPrintMenu<PedidoProveedorDocData>
            data={pedido}
            DocumentComponent={OrdenPedidoProveedorDocument}
            filename={`orden-pedido-proveedor-${pedido.id}`}
            label="Orden de Pedido"
            size="sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-marron/10 bg-card p-4 space-y-2">
          <h3 className="font-semibold text-marron">Información General</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Proveedor:</span>
            <span className="font-medium">{pedido.proveedor.razon_social || `${pedido.proveedor.nombre} ${pedido.proveedor.apellido}`}</span>
            <span className="text-muted-foreground">Fecha Pedido:</span>
            <span className="font-medium">{new Date(pedido.fecha_pedido).toLocaleDateString('es-AR')}</span>
            <span className="text-muted-foreground">Entrega Estimada:</span>
            <span className="font-medium">{pedido.fecha_entrega_estimada ? new Date(pedido.fecha_entrega_estimada).toLocaleDateString('es-AR') : '-'}</span>
            <span className="text-muted-foreground">Entrega Real:</span>
            <span className="font-medium">{pedido.fecha_entrega_real ? new Date(pedido.fecha_entrega_real).toLocaleDateString('es-AR') : '-'}</span>
            <span className="text-muted-foreground">Estado:</span>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoColor(pedido.estado.nombre_estado)}`}>
              {pedido.estado.nombre_estado}
            </span>
          </div>
          {pedido.observaciones && (
            <div className="pt-2 border-t">
              <span className="text-muted-foreground text-sm">Observaciones:</span>
              <p className="text-sm">{pedido.observaciones}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-marron/10 bg-card p-4 space-y-2">
          <h3 className="font-semibold text-marron">Total Estimado</h3>
          <div className="text-3xl font-bold text-marron">{formatCurrency(pedido.total_estimado)}</div>
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
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantidad</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Unidad</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">P. Estimado</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalle.map((d) => (
                <tr key={d.id} className="border-t hover:bg-mostaza/5">
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.id_materia_prima ? 'bg-oliva/10 text-oliva' : 'bg-mostaza/10 text-mostaza'}`}>
                      {d.id_materia_prima ? 'MP' : 'Ins'}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-marron">
                    {d.materiaPrima?.nombre || d.insumo?.nombre || '-'}
                  </td>
                  <td className="px-4 py-2 text-right">{d.cantidad_pedida}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d.unidad?.nombre || '-'}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(d.precio_estimado)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(d.cantidad_pedida * d.precio_estimado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
