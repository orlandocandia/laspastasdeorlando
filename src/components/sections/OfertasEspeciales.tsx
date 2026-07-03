'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Flame, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProductoPromo {
  id: number
  nombre: string
  precio_venta: number
  imagen: string | null
  peso_unitario_aprox: number
  descripcion: string | null
  stock_actual: number
  categoria: { id: number; nombre: string }
}

interface PromocionPublica {
  id: number
  nombre: string
  descripcion: string | null
  tipo: string
  valor_descuento: number
  fecha_fin: string | null
  descuento_label: string
  productos: ProductoPromo[]
}

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function calcularPrecioFinal(precioOriginal: number, tipo: string, valorDescuento: number): number {
  switch (tipo) {
    case 'porcentual':
    case 'tiempo_limitado':
      return precioOriginal * (1 - valorDescuento / 100)
    case 'fijo':
      return Math.max(0, precioOriginal - valorDescuento)
    case '2x1':
      return precioOriginal / 2
    default:
      return precioOriginal
  }
}

function formatPeso(kg: number): string {
  if (kg >= 1) return `${kg} kg`
  return `${Math.round(kg * 1000)}g`
}

export default function OfertasEspeciales() {
  const [promociones, setPromociones] = useState<PromocionPublica[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchPromociones() {
      try {
        const res = await fetch('/api/promociones/public')
        if (res.ok) {
          const data = await res.json()
          setPromociones(data.promociones || [])
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchPromociones()
  }, [])

  // Don't render anything if no promotions
  if (loading || promociones.length === 0) return null

  // Flatten all promo products into a single list for the horizontal scroll
  const productosEnOferta: (ProductoPromo & { descuento_label: string; tipo: string; valor_descuento: number; promocionNombre: string })[] = []
  for (const promo of promociones) {
    for (const prod of promo.productos) {
      // Avoid duplicates if a product is in multiple promos
      if (productosEnOferta.some((p) => p.id === prod.id)) continue
      productosEnOferta.push({
        ...prod,
        descuento_label: promo.descuento_label,
        tipo: promo.tipo,
        valor_descuento: promo.valor_descuento,
        promocionNombre: promo.nombre,
      })
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 300
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="bg-gradient-to-r from-rojo/5 via-mostaza/5 to-rojo/5 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rojo/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-rojo" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-marron">
                Ofertas <span className="text-rojo">Especiales</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                {promociones.length} promoción{promociones.length !== 1 ? 'es' : ''} activa{promociones.length !== 1 ? 's' : ''} — ¡aprovechá!
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="h-9 w-9 rounded-full border-marron/20 hover:bg-mostaza/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="h-9 w-9 rounded-full border-marron/20 hover:bg-mostaza/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Horizontal scroll of promo product cards */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {productosEnOferta.map((prod) => {
            const precioFinal = calcularPrecioFinal(prod.precio_venta, prod.tipo, prod.valor_descuento)
            return (
              <div
                key={prod.id}
                className="flex-shrink-0 w-56 sm:w-64 snap-start bg-white rounded-xl border border-rojo/10 shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-square relative bg-gray-50">
                  <Image
                    src={prod.imagen || '/images/placeholder-producto.jpg'}
                    alt={prod.nombre}
                    fill
                    loading="lazy"
                    className="object-contain p-3"
                    sizes="256px"
                  />
                  {/* Promo badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-rojo text-white text-xs font-bold px-2.5 py-0.5 shadow-md border-0">
                      🔥 {prod.descuento_label}
                    </Badge>
                  </div>
                  {/* Category badge */}
                  <div className="absolute bottom-2 right-2">
                    <Badge className="bg-white/90 text-marron text-[10px] border border-marron/10">
                      {prod.categoria.nombre}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="font-bold text-marron text-sm line-clamp-1 mb-1">
                    {prod.nombre}
                  </h4>
                  <div className="flex items-center gap-1 mb-2">
                    <Badge className="bg-mostaza/15 text-marron text-[10px] border-0">
                      {formatPeso(prod.peso_unitario_aprox)}
                    </Badge>
                    {prod.stock_actual <= 0 && (
                      <Badge className="bg-rojo/10 text-rojo text-[10px] border-0">
                        Sin stock
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground text-xs line-through">
                      {priceFormatter.format(prod.precio_venta)}
                    </span>
                    <span className="text-rojo font-bold text-lg">
                      {priceFormatter.format(precioFinal)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const contactoSection = document.getElementById('contacto')
                      if (contactoSection) {
                        contactoSection.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className="w-full mt-3 bg-green-600 text-white text-xs py-1.5 rounded-full hover:bg-green-700 transition-colors font-semibold h-9"
                  >
                    📝 Consultar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
