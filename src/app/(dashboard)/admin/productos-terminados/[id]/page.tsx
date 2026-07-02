'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, PackagePlus, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProductoTerminadoForm from '@/components/admin/ProductoTerminadoForm'
import { StockInitialLoadDialog } from '@/components/admin/StockInitialLoadDialog'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

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

      {/* Margen de Ganancia Card */}
      {producto?.costo_produccion !== undefined && (
        <Card className="border-marron/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-marron flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-mostaza" />
              Margen de Ganancia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!producto.tiene_receta && producto.costo_produccion === 0 ? (
              <div className="flex items-center gap-2 text-mostaza text-sm">
                <AlertCircle className="h-4 w-4" />
                Sin receta asignada — no se puede calcular el costo
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Costo Producción</p>
                  <p className="text-lg font-bold text-marron">{formatPrice(producto.costo_produccion || 0)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Precio Venta</p>
                  <p className="text-lg font-bold text-marron">{formatPrice(producto.precio_venta || 0)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Margen ($)</p>
                  <p className="text-lg font-bold text-marron">{formatPrice(producto.margen || 0)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Margen (%)</p>
                  <p className={`text-lg font-bold ${
                    (producto.margen_porcentaje || 0) > 50 ? 'text-oliva' :
                    (producto.margen_porcentaje || 0) >= 30 ? 'text-mostaza' : 'text-rojo'
                  }`}>
                    {(producto.margen_porcentaje || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
            {producto.receta_activa && (
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Basado en receta: <b>{producto.receta_activa.nombre_receta}</b> (rinde {producto.receta_activa.rendimiento_unidades} u.)</p>
                {producto.costo_mp > 0 && <p>Costo MP: {formatPrice(producto.costo_mp)} · Costo Insumos: {formatPrice(producto.costo_insumos)}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
