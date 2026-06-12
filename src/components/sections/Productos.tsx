'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { PackageOpen, ArrowLeft, Wheat, Leaf, Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductCard from '@/components/products/ProductCard'

interface ProductoPublico {
  id: number
  nombre: string
  descripcion: string | null
  precio_venta: number
  peso_unitario_aprox: number
  unidades?: number | null
  imagen: string | null
  stock_actual: number
  destacado: boolean
  tipo_harina: string | null
  modo_coccion: string | null
  categoria: {
    id: number
    nombre: string
    descripcion: string | null
    imagen: string | null
    imagen_integral: string | null
    imagen_sin_gluten: string | null
  }
}

export type FiltroHarina = 'con_gluten' | 'integral' | 'sin_gluten'

interface Familia {
  nombre: string
  imagen: string | null
  imagen_integral: string | null
  imagen_sin_gluten: string | null
  descripcion: string
  categoriaId: number
  descripcionDB: string | null
}

// Descripciones por defecto para categorías conocidas
const DESCRIPCIONES_DEFAULT: Record<string, string> = {
  'Sorrentinos': 'Rellenos de jamón, queso, pollo y más',
  'Ñoquis': 'De papa, calabaza, espinaca y más',
  'Tallarines': 'Al huevo, al morrón, a la espinaca y más',
  'Cintas Anchas': 'Cintas anchas al huevo y más',
  'Ravioles': 'De ricotta, carne, jamón y más',
  'Tapas': 'Para empanadas, pascualinas y pastelitos',
  'Empanadas': 'Crudas y al horno, variedad de rellenos',
  'Tartas': 'De verduras, jamón, pollo y choclo',
  'Pastas frescas': 'Pastas frescas rellenas y al huevo',
  'Pastas secas': 'Pastas secas tipo fideos',
  'Salsas': 'Salsas para acompañar pastas',
  'Lasagnas y canelones': 'Platos armados listos para hornear',
  'Postres': 'Postres a base de pasta',
}

// Imagen por defecto para categorías sin imagen propia
const IMAGENES_DEFAULT: Record<string, string> = {
  'Sorrentinos': '/images/familias/sorrentinos.png',
  'Ñoquis': '/images/familias/noquis.png',
  'Tallarines': '/images/familias/tallarines.png',
  'Cintas Anchas': '/images/familias/cintasanchas.png',
  'Ravioles': '/images/familias/ravioles.png',
  'Tapas': '/images/familias/tapas.png',
  'Empanadas': '/images/familias/empanadas.png',
  'Tartas': '/images/familias/tartas.png',
}

// Imagen dinámica según filtro para familias con variante integral/sin gluten
function getFamiliaImagen(familia: Familia, filtro: FiltroHarina): string {
  // 1) Si la categoría tiene imagen de variante en la BD, usarla (definitivo)
  if (filtro === 'integral' && familia.imagen_integral) return familia.imagen_integral
  if (filtro === 'sin_gluten' && familia.imagen_sin_gluten) return familia.imagen_sin_gluten

  // 2) Fallback hardcodeado para familias con imágenes pre-existentes (hotfix)
  if (familia.nombre === 'Tallarines' && filtro === 'integral') {
    return '/images/familias/tallarinesintegrales.png'
  }
  if (familia.nombre === 'Cintas Anchas' && filtro === 'integral') {
    return '/images/familias/cintasanchasintegrales.png'
  }
  if (familia.nombre === 'Tapas' && filtro === 'integral') {
    return '/images/familias/tapasintegrales.png'
  }
  if (familia.nombre === 'Tapas' && filtro === 'sin_gluten') {
    return '/images/familias/tapassingluten.png'
  }

  // 3) Si la categoría tiene imagen propia (subida desde el dashboard), usarla
  if (familia.imagen) {
    return familia.imagen
  }
  // 4) Si no, usar la imagen por defecto hardcodeada
  return IMAGENES_DEFAULT[familia.nombre] || '/images/placeholder-producto.jpg'
}

const FILTROS: { key: FiltroHarina; label: string; icon: React.ReactNode }[] = [
  { key: 'con_gluten', label: 'CON GLUTEN', icon: <Wheat className="h-3.5 w-3.5" /> },
  { key: 'integral', label: 'INTEGRALES', icon: <Leaf className="h-3.5 w-3.5" /> },
  { key: 'sin_gluten', label: 'SIN GLUTEN', icon: <Sparkles className="h-3.5 w-3.5" /> },
]

const TODOS_FILTROS: FiltroHarina[] = ['con_gluten', 'integral', 'sin_gluten']

// Products per page in the expanded family view
// Show all products by default (no arbitrary limit)
const PRODUCTS_PER_PAGE = 50

interface ProductosProps {
  filtroActivo?: FiltroHarina
  onFiltroChange?: (filtro: FiltroHarina) => void
}

export default function Productos({ filtroActivo = 'con_gluten', onFiltroChange }: ProductosProps) {
  // Cache: productos pre-fetcheados por tipo de harina
  const [cache, setCache] = useState<Record<FiltroHarina, ProductoPublico[]>>({
    con_gluten: [],
    integral: [],
    sin_gluten: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<FiltroHarina>(filtroActivo)
  const [familiaActiva, setFamiliaActiva] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE)
  const fetchedRef = useRef(false)
  const productosGridRef = useRef<HTMLDivElement>(null)

  // Pre-fetch all 3 filter types in parallel on mount — no refetch on filter change
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const results = await Promise.all(
          TODOS_FILTROS.map(async (tipo) => {
            const res = await fetch(`/api/productos-terminados/public?tipo=${tipo}`)
            if (!res.ok) throw new Error(`Error cargando ${tipo}`)
            const data = await res.json()
            return { tipo, productos: (data.productos || []) as ProductoPublico[] }
          })
        )
        setCache((prev) => {
          const next = { ...prev }
          for (const r of results) next[r.tipo] = r.productos
          return next
        })
      } catch {
        setError('No se pudieron cargar los productos. Intentá más tarde.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Reset visible count when family changes
  // Show all products initially (PRODUCTS_PER_PAGE=50 covers all families)
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE)
  }, [familiaActiva])

  // Sync with parent filtro state — instant, no refetch
  useEffect(() => {
    if (filtroActivo !== filtro) {
      setFiltro(filtroActivo ?? 'con_gluten')
      setFamiliaActiva(null)
    }
  }, [filtroActivo, filtro])

  const handleFiltroChange = useCallback((nuevoFiltro: FiltroHarina) => {
    setFiltro(nuevoFiltro)
    setFamiliaActiva(null)
    onFiltroChange?.(nuevoFiltro)
  }, [onFiltroChange])

  // Current products from cache — instant swap, no network
  const productos = cache[filtro]

  // Build families dynamically from product categories
  const familias: Familia[] = useMemo(() => {
    const seen = new Map<string, Familia>()
    for (const p of productos) {
      const catNombre = p.categoria.nombre
      if (!seen.has(catNombre)) {
        seen.set(catNombre, {
          nombre: catNombre,
          imagen: p.categoria.imagen || null,
          imagen_integral: p.categoria.imagen_integral || null,
          imagen_sin_gluten: p.categoria.imagen_sin_gluten || null,
          descripcion: p.categoria.descripcion || DESCRIPCIONES_DEFAULT[catNombre] || `Productos de ${catNombre.toLowerCase()}`,
          descripcionDB: p.categoria.descripcion,
          categoriaId: p.categoria.id,
        })
      }
    }
    const knownOrder = ['Sorrentinos', 'Ñoquis', 'Tallarines', 'Cintas Anchas', 'Ravioles', 'Tapas', 'Empanadas', 'Tartas', 'Pastas frescas', 'Pastas secas', 'Salsas', 'Lasagnas y canelones', 'Postres']
    return Array.from(seen.values()).sort((a, b) => {
      const ia = knownOrder.indexOf(a.nombre)
      const ib = knownOrder.indexOf(b.nombre)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.nombre.localeCompare(b.nombre)
    })
  }, [productos])

  // Compute product counts per family
  const familiaData = useMemo(() => {
    const data: Record<string, { count: number; hasProducts: boolean }> = {}
    for (const familia of familias) {
      const prods = productos.filter(
        (p) => p.categoria.nombre === familia.nombre
      )
      data[familia.nombre] = {
        count: prods.length,
        hasProducts: prods.length > 0,
      }
    }
    return data
  }, [productos, familias])

  // Products for the active family — paginated
  const productosFamilia = useMemo(() => {
    if (!familiaActiva) return []
    return productos.filter((p) => p.categoria.nombre === familiaActiva)
  }, [productos, familiaActiva])

  // Only show the first `visibleCount` products — avoids rendering all images at once
  const productosVisibles = useMemo(() => {
    return productosFamilia.slice(0, visibleCount)
  }, [productosFamilia, visibleCount])

  const hasMore = visibleCount < productosFamilia.length

  const handleFamiliaClick = useCallback((nombre: string) => {
    setFamiliaActiva((prev) => (prev === nombre ? null : nombre))
  }, [])

  // Smooth scroll al contenedor de productos cuando se selecciona una familia
  useEffect(() => {
    if (!familiaActiva || !productosGridRef.current) return
    const yOffset = -100
    const y = productosGridRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset
    // Solo hacer scroll si el contenedor no está visible en el viewport
    if (y < window.pageYOffset || y > window.pageYOffset + window.innerHeight - 200) {
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [familiaActiva])

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE)
  }, [])

  // Filter out families with no products
  const familiasVisibles = useMemo(
    () => familias.filter((f) => familiaData[f.nombre]?.hasProducts),
    [familias, familiaData]
  )

  // Retry: re-fetch all
  const handleRetry = useCallback(async () => {
    fetchedRef.current = false
    setLoading(true)
    setError('')
    try {
      const results = await Promise.all(
        TODOS_FILTROS.map(async (tipo) => {
          const res = await fetch(`/api/productos-terminados/public?tipo=${tipo}`)
          if (!res.ok) throw new Error(`Error cargando ${tipo}`)
          const data = await res.json()
          return { tipo, productos: (data.productos || []) as ProductoPublico[] }
        })
      )
      setCache((prev) => {
        const next = { ...prev }
        for (const r of results) next[r.tipo] = r.productos
        return next
      })
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <section id="productos" className="min-h-screen flex flex-col justify-center py-12 sm:py-16 md:py-20 bg-crema">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-marron">
            Nuestros <span className="text-rojo">Productos</span>
          </h2>
          <div className="h-1 w-20 bg-mostaza mx-auto mt-4 rounded-full" />
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm sm:text-base">
            Pastas artesanales elaboradas con ingredientes frescos y de calidad. Elegí el tipo de pasta que más te guste.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFiltroChange(f.key)}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                transition-colors duration-150 border
                ${filtro === f.key
                  ? 'bg-mostaza text-marron border-mostaza shadow-md'
                  : 'bg-white text-marron/70 border-marron/10 hover:border-mostaza/50 hover:text-marron'
                }
              `}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading — only on initial mount */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-marron/10 bg-white p-8 animate-pulse flex flex-col items-center gap-4">
                <div className="h-20 w-20 bg-muted rounded-full" />
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">⚠️</span>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="border-mostaza text-marron hover:bg-mostaza hover:text-marron"
            >
              Reintentar
            </Button>
          </div>
        ) : familiasVisibles.length === 0 ? (
          <div className="text-center py-12">
            <PackageOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">
              No hay productos disponibles para este filtro.
            </p>
          </div>
        ) : (
          <>
            {/* Family Cards Grid — instant swap, no stagger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {familiasVisibles.map((familia) => {
                const data = familiaData[familia.nombre]
                const count = data?.count ?? 0
                const isActive = familiaActiva === familia.nombre

                return (
                  <button
                    key={familia.nombre}
                    onClick={() => handleFamiliaClick(familia.nombre)}
                    className={`
                      w-full group relative rounded-2xl border bg-white p-6 sm:p-8
                      flex flex-col items-center justify-between text-center min-h-[240px]
                      transition-shadow duration-200
                      border-marron/10 hover:shadow-lg cursor-pointer
                      ${isActive ? 'ring-2 ring-mostaza shadow-lg' : ''}
                    `}
                  >
                    {/* Imagen representativa */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-crema border-2 border-mostaza/20 flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                      <Image
                        src={getFamiliaImagen(familia, filtro)}
                        alt={familia.nombre}
                        width={96}
                        height={96}
                        loading="lazy"
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Name */}
                    <h3 className="text-lg sm:text-xl font-bold text-marron line-clamp-1">
                      {familia.nombre}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {familia.descripcion}
                    </p>

                    {/* Badge */}
                    <span className="bg-mostaza/20 text-marron text-xs rounded-full px-2 py-0.5 font-semibold flex-shrink-0">
                      {count} {count === 1 ? 'variedad' : 'variedades'}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-mostaza" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Expanded Family Products — paginated with "Ver más" */}
            {familiaActiva && (() => {
              const familiaHeader = familias.find((f) => f.nombre === familiaActiva)
              const imagenHeader = familiaHeader ? getFamiliaImagen(familiaHeader, filtro) : '/images/placeholder-producto.jpg'
              return (
                <div ref={productosGridRef} className="bg-crema/50 rounded-2xl p-6 mt-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFamiliaActiva(null)
                        const productosSection = document.getElementById('productos')
                        if (productosSection) {
                          const yOffset = -100
                          const y = productosSection.getBoundingClientRect().top + window.pageYOffset + yOffset
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                      }}
                      className="text-marron hover:bg-mostaza/20 gap-1.5 -ml-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </Button>
                    <div className="h-6 w-px bg-marron/20" />
                    <h3 className="text-xl font-bold text-marron flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full overflow-hidden inline-block bg-crema border border-mostaza/20 flex-shrink-0">
                        <Image
                          src={imagenHeader}
                          alt={familiaActiva}
                          width={28}
                          height={28}
                          loading="lazy"
                          className="object-cover w-full h-full"
                        />
                      </span>
                      {familiaActiva}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      — {productosFamilia.length} {productosFamilia.length === 1 ? 'variedad' : 'variedades'}
                    </span>
                  </div>

                  {/* Products Grid — paginated */}
                  {productosFamilia.length === 0 ? (
                    <div className="text-center py-8">
                      <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground">
                        No hay productos para este filtro en esta familia
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productosVisibles.map((producto) => (
                          <ProductCard key={producto.id} producto={producto} />
                        ))}
                      </div>

                      {/* "Ver más" button — loads next batch without new images */}
                      {hasMore && (
                        <div className="flex justify-center mt-8">
                          <Button
                            variant="outline"
                            onClick={handleLoadMore}
                            className="border-mostaza text-marron hover:bg-mostaza hover:text-marron gap-2"
                          >
                            <ChevronDown className="h-4 w-4" />
                            Ver más variedades ({productosFamilia.length - visibleCount} restantes)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()}
          </>
        )}
      </div>
    </section>
  )
}
