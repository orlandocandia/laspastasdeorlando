'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, PackagePlus } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import ProductoTerminadoForm from '@/components/admin/ProductoTerminadoForm'
import { StockInitialLoadDialog } from '@/components/admin/StockInitialLoadDialog'

export default function ProductoTerminadoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [producto, setProducto] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stockInitialOpen, setStockInitialOpen] = useState(false)

  const fetchProducto = useCallback(async () => {
    if (params.id === 'nuevo') return
    try {
      const res = await fetch(`/api/productos-terminados/${params.id}`)
      if (!res.ok) throw new Error('No encontrado')
      const data = await res.json()
      setProducto(data)
    } catch {
      router.push('/admin/productos-terminados')
    }
  }, [params.id, router])

  useEffect(() => {
    if (params.id === 'nuevo') {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchProducto().finally(() => setLoading(false))
  }, [params.id, fetchProducto])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/productos-terminados">
          <Button variant="ghost" size="icon" className="hover:bg-mostaza/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-marron">
            {producto ? `Editar: ${producto.nombre}` : 'Nuevo Producto Terminado'}
          </h1>
        </div>
        {producto && (
          <Button
            onClick={() => setStockInitialOpen(true)}
            className="bg-oliva hover:bg-oliva/90 text-white font-semibold"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Cargar Stock
          </Button>
        )}
      </div>

      <ProductoTerminadoForm
        productoTerminado={producto}
        onSuccess={() => router.push('/admin/productos-terminados')}
      />

      {/* Stock Initial Load Dialog — from detail page header */}
      {producto && (
        <StockInitialLoadDialog
          open={stockInitialOpen}
          onClose={() => setStockInitialOpen(false)}
          preselectedProduct={{
            id: producto.id,
            nombre: producto.nombre,
            stock_actual: producto.stock_actual ?? 0,
            stock_minimo: producto.stock_minimo ?? 0,
          }}
          onSuccess={fetchProducto}
        />
      )}
    </div>
  )
}
