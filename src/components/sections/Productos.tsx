'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { PackageOpen, ArrowLeft, Wheat, Leaf, Sparkles, ChevronDown, ChevronRight, Flame, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ProductCard from '@/components/products/ProductCard'
import type { PromocionInfo } from '@/components/products/ProductCard'

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
  seccion: string | null
  modo_coccion: string | null
  texto_frente: string | null
  texto_reverso: string | null
  categoria: {
    id: number
    nombre: string
    descripcion: string | null
    seccion: string | null
    imagen: string | null
    imagen_integral: string | null
    imagen_sin_gluten: string | null
  }
}

export type FiltroHarina = 'con_gluten' | 'integral' | 'sin_gluten'
export type Seccion = 'pastas' | 'horneados'

interface Familia {
  nombre: string
  seccion: string | null
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
  'Facturas': 'Medialunas, vigilantes y más',
  'Chipás': 'De queso, tradicionales del litoral',
  'Pizzas': 'Muzzarella, fugazzeta y más',
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

// Sección config — with rich data for the hero cards
const SECCIONES: { key: Seccion; label: string; emoji: string; imagen: string; description: string; subtext: string }[] = [
  {
    key: 'pastas',
    label: 'Pastas',
    emoji: '🍝',
    imagen: '/images/productos/pastas-card.png',
    description: 'Pastas artesanales elaboradas con ingredientes frescos y de calidad',
    subtext: 'Sorrentinos, ravioles, ñoquis, tallarines y más',
  },
  {
    key: 'horneados',
    label: 'Horneados',
    emoji: '🔥',
    imagen: '/images/productos/horneados-card.png',
    description: 'Empanadas, tartas y más, listos para cocinar y disfrutar',
    subtext: 'Empanadas, tartas, facturas y más',
  },
]

// Imagen dinámica según filtro para familias con variante integral/sin gluten
function getFamiliaImagen(familia: Familia, filtro: FiltroHarina): string {
  if (filtro === 'integral' && familia.imagen_integral) return familia.imagen_integral
  if (filtro === 'sin_gluten' && familia.imagen_sin_gluten) return familia.imagen_sin_gluten

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

  if (familia.imagen) return familia.imagen
  return IMAGENES_DEFAULT[familia.nombre] || '/images/placeholder-producto.jpg'
}

const FILTROS: { key: FiltroHarina; label: string; icon: React.ReactNode }[] = [
  { key: 'con_gluten', label: 'CON GLUTEN', icon: <Wheat className="h-3.5 w-3.5" /> },
  { key: 'integral', label: 'INTEGRALES', icon: <Leaf className="h-3.5 w-3.5" /> },
  { key: 'sin_gluten', label: 'SIN GLUTEN', icon: <Sparkles className="h-3.5 w-3.5" /> },
]

const TODOS_FILTROS: FiltroHarina[] = ['con_gluten', 'integral', 'sin_gluten']

const PRODUCTS_PER_PAGE = 50

// Promo summary for banner display
interface PromoBanner {
  id: number
  nombre: string
  descripcion: string | null
  descuento_label: string
  tipo: string
  fecha_fin: string | null
}

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
  // null = no section selected (step 1), 'pastas'|'horneados' = section selected (step 2)
  const [seccionActiva, setSeccionActiva] = useState<Seccion | null>(null)
  const [familiaActiva, setFamiliaActiva] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE)
  const [productoPromociones, setProductoPromociones] = useState<Record<number, PromocionInfo>>({})
  const [promociones, setPromociones] = useState<PromoBanner[]>([])
  const [soloOfertas, setSoloOfertas] = useState(false)
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
        const [results, promoRes] = await Promise.all([
          Promise.all(
            TODOS_FILTROS.map(async (tipo) => {
              const res = await fetch(`/api/productos-terminados/public?tipo=${tipo}`)
              if (!res.ok) throw new Error(`Error cargando ${tipo}`)
              const data = await res.json()
              return { tipo, productos: (data.productos || []) as ProductoPublico[] }
            })
          ),
          fetch('/api/promociones/public').then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              return data
            }
            return { productoPromociones: {}, promociones: [] }
          }).catch(() => ({ productoPromociones: {}, promociones: [] })),
        ])
        setCache((prev) => {
          const next = { ...prev }
          for (const r of results) next[r.tipo] = r.productos
          return next
        })
        setProductoPromociones(promoRes.productoPromociones as Record<number, PromocionInfo> || {})
        setPromociones((promoRes.promociones || []) as PromoBanner[])
      } catch {
        setError('No se pudieron cargar los productos. Intentá más tarde.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Reset visible count when family, section, or soloOfertas changes
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE)
  }, [familiaActiva, seccionActiva, soloOfertas])

  // Sync with parent filtro state — instant, no refetch
  useEffect(() => {
    if (filtroActivo !== filtro) {
      setFiltro(filtroActivo ?? 'con_gluten')
      setFamiliaActiva(null)
    }
  }, [filtroActivo, filtro])

  // Ref for the filter bar area — scroll target when filters change
  const filterBarRef = useRef<HTMLDivElement>(null)

  // Smooth scroll to filter area when any filter or soloOfertas changes
  useEffect(() => {
    if (!seccionActiva || !filterBarRef.current) return
    const yOffset = -20
    const y = filterBarRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset
    // Only scroll if the filter bar is not already visible near the top of the viewport
    if (y < window.pageYOffset - 50 || y > window.pageYOffset + window.innerHeight - 200) {
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [filtro, soloOfertas, seccionActiva])

  const handleFiltroChange = useCallback((nuevoFiltro: FiltroHarina) => {
    setFiltro(nuevoFiltro)
    setFamiliaActiva(null)
    setSoloOfertas(false) // Filters are mutually exclusive — deactivate Solo Ofertas
    onFiltroChange?.(nuevoFiltro)
  }, [onFiltroChange])

  const handleSeccionChange = useCallback((nuevaSeccion: Seccion) => {
    setSeccionActiva(nuevaSeccion)
    setFamiliaActiva(null)
    setFiltro('con_gluten') // Reset flour filter when changing section
    setSoloOfertas(false)
    onFiltroChange?.('con_gluten')
  }, [onFiltroChange])

  const handleVolverASecciones = useCallback(() => {
    setSeccionActiva(null)
    setFamiliaActiva(null)
    setFiltro('con_gluten')
    setSoloOfertas(false)
    onFiltroChange?.('con_gluten')
  }, [onFiltroChange])

  // Current products from cache — instant swap, no network
  // When soloOfertas is active, merge ALL flour types (since it's an exclusive filter)
  const productos = useMemo(() => {
    if (soloOfertas) {
      // Merge all caches, dedup by product ID
      const seen = new Map<number, ProductoPublico>()
      for (const tipo of TODOS_FILTROS) {
        for (const p of cache[tipo]) {
          if (!seen.has(p.id)) seen.set(p.id, p)
        }
      }
      return Array.from(seen.values())
    }
    return cache[filtro]
  }, [cache, filtro, soloOfertas])

  // Build families dynamically from product categories, grouped by seccion
  const familiasBySeccion = useMemo(() => {
    const result: Record<string, Familia[]> = { pastas: [], horneados: [], other: [] }
    const seen = new Map<string, Familia>()

    for (const p of productos) {
      const catNombre = p.categoria.nombre
      const effectiveSeccion = p.seccion ?? p.categoria.seccion
      if (effectiveSeccion !== 'pastas' && effectiveSeccion !== 'horneados') continue

      const dedupKey = `${catNombre}__${effectiveSeccion}`
      if (!seen.has(dedupKey)) {
        seen.set(dedupKey, {
          nombre: catNombre,
          seccion: effectiveSeccion,
          imagen: p.categoria.imagen || null,
          imagen_integral: p.categoria.imagen_integral || null,
          imagen_sin_gluten: p.categoria.imagen_sin_gluten || null,
          descripcion: p.categoria.descripcion || DESCRIPCIONES_DEFAULT[catNombre] || `Productos de ${catNombre.toLowerCase()}`,
          descripcionDB: p.categoria.descripcion,
          categoriaId: p.categoria.id,
        })
      }
    }

    const knownOrder = ['Sorrentinos', 'Ñoquis', 'Tallarines', 'Cintas Anchas', 'Ravioles', 'Tapas', 'Empanadas', 'Tartas', 'Pastas frescas', 'Pastas secas', 'Salsas', 'Lasagnas y canelones', 'Postres', 'Facturas', 'Chipás', 'Pizzas']

    const sorted = Array.from(seen.values()).sort((a, b) => {
      const seccionOrder = { pastas: 0, horneados: 1 }
      const sa = seccionOrder[a.seccion as keyof typeof seccionOrder] ?? 2
      const sb = seccionOrder[b.seccion as keyof typeof seccionOrder] ?? 2
      if (sa !== sb) return sa - sb

      const ia = knownOrder.indexOf(a.nombre)
      const ib = knownOrder.indexOf(b.nombre)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.nombre.localeCompare(b.nombre)
    })

    for (const familia of sorted) {
      const sec = familia.seccion === 'pastas' ? 'pastas' : familia.seccion === 'horneados' ? 'horneados' : 'other'
      result[sec].push(familia)
    }

    return result
  }, [productos])

  // Current section families
  const familias = useMemo(() => {
    if (!seccionActiva) return []
    return familiasBySeccion[seccionActiva] || []
  }, [familiasBySeccion, seccionActiva])

  // Check which sections have products for current filter
  const seccionesConProductos = useMemo(() => {
    const result: Seccion[] = []
    for (const sec of SECCIONES) {
      const families = familiasBySeccion[sec.key] || []
      if (families.length > 0) result.push(sec.key)
    }
    return result
  }, [familiasBySeccion])

  // Compute product counts per family
  const familiaData = useMemo(() => {
    const data: Record<string, { count: number; hasProducts: boolean; hasPromos: boolean; promoCount: number }> = {}
    for (const familia of familias) {
      const prods = productos.filter((p) => {
        if (p.categoria.nombre !== familia.nombre) return false
        const effSec = p.seccion ?? p.categoria.seccion
        return effSec === familia.seccion
      })
      const promoProds = prods.filter((p) => !!productoPromociones[p.id])
      data[familia.nombre] = {
        count: prods.length,
        hasProducts: prods.length > 0,
        hasPromos: promoProds.length > 0,
        promoCount: promoProds.length,
      }
    }
    return data
  }, [productos, familias, productoPromociones])

  // All products in the active section (across all families)
  const productosSeccion = useMemo(() => {
    if (!seccionActiva) return []
    return productos.filter((p) => {
      const effSec = p.seccion ?? p.categoria.seccion
      return effSec === seccionActiva
    })
  }, [productos, seccionActiva])

  // Products for the active family — filtered by both family name and effective section
  // When soloOfertas is active and a family is selected, show only promo products in that family
  const productosFamilia = useMemo(() => {
    if (!seccionActiva || !familiaActiva) return []
    const base = productos.filter((p) => {
      if (p.categoria.nombre !== familiaActiva) return false
      const effSec = p.seccion ?? p.categoria.seccion
      return effSec === seccionActiva
    })
    // When soloOfertas is active, show only promo products within the family
    if (soloOfertas) {
      return base.filter((p) => !!productoPromociones[p.id])
    }
    return base
  }, [productos, familiaActiva, seccionActiva, soloOfertas, productoPromociones])

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
    if (y < window.pageYOffset || y > window.pageYOffset + window.innerHeight - 200) {
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [familiaActiva])

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE)
  }, [])

  // Filter out families with no products
  // When soloOfertas is active, also filter out families with no promos
  const familiasVisibles = useMemo(
    () => familias.filter((f) => {
      const data = familiaData[f.nombre]
      if (!data?.hasProducts) return false
      if (soloOfertas && !data.hasPromos) return false
      return true
    }),
    [familias, familiaData, soloOfertas]
  )

  // Get promos for the active section (across ALL flour types, not just current filter)
  const promosForSection = useMemo(() => {
    if (!seccionActiva) return []
    // Get product IDs in this section across ALL flour types
    const sectionProductIds = new Set<number>()
    for (const tipo of TODOS_FILTROS) {
      for (const p of cache[tipo]) {
        const effSec = p.seccion ?? p.categoria.seccion
        if (effSec === seccionActiva) {
          sectionProductIds.add(p.id)
        }
      }
    }
    // Filter promos that have products in this section
    return promociones.filter((promo) => {
      return Object.entries(productoPromociones).some(
        ([productId, pInfo]) =>
          pInfo.promocionId === promo.id && sectionProductIds.has(Number(productId))
      )
    })
  }, [seccionActiva, cache, promociones, productoPromociones])

  // How many products have promos in the active family
  const promoCountInFamily = useMemo(() => {
    if (!familiaActiva) return 0
    const base = productos.filter((p) => {
      if (p.categoria.nombre !== familiaActiva) return false
      const effSec = p.seccion ?? p.categoria.seccion
      return effSec === seccionActiva
    })
    return base.filter((p) => !!productoPromociones[p.id]).length
  }, [productos, familiaActiva, seccionActiva, productoPromociones])

  // How many products have promos in the entire active section (across all families)
  // Uses ALL flour types' caches — not just the current filter — so the Solo Ofertas
  // button stays visible regardless of which flour filter is active
  const promoCountInSection = useMemo(() => {
    if (!seccionActiva) return 0
    let count = 0
    for (const tipo of TODOS_FILTROS) {
      for (const p of cache[tipo]) {
        const effSec = p.seccion ?? p.categoria.seccion
        if (effSec === seccionActiva && productoPromociones[p.id]) {
          count++
        }
      }
    }
    return count
  }, [cache, seccionActiva, productoPromociones])

  // How many promo products for the CURRENT flour filter in the active section
  // Used for the button count label to show relevant number
  const promoCountForCurrentFilter = useMemo(() => {
    return productosSeccion.filter((p) => !!productoPromociones[p.id]).length
  }, [productosSeccion, productoPromociones])

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

  const seccionConfig = seccionActiva ? SECCIONES.find((s) => s.key === seccionActiva)! : null

  return (
    <section id="productos" className="min-h-screen flex flex-col justify-start py-12 sm:py-16 md:py-20 bg-crema">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-marron">
            Nuestros <span className="text-rojo">Productos</span>
          </h2>
          <div className="h-1 w-20 bg-mostaza mx-auto mt-4 rounded-full" />
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm sm:text-base">
            Elaborados con ingredientes frescos y de calidad. Elegí la sección que más te guste.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            STATE 1: No section selected → Show section hero cards
            ═══════════════════════════════════════════════════════════ */}
        {!seccionActiva && (
          <>
            {loading ? (
              <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-10 w-full max-w-5xl mx-auto">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-marron/10 bg-white animate-pulse flex-1 max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center p-6 sm:p-8 md:p-10 gap-5">
                    <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-muted rounded-full" />
                    <div className="h-7 w-32 bg-muted rounded" />
                    <div className="h-10 w-36 bg-muted rounded-full" />
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
            ) : (
              <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-10 w-full max-w-5xl mx-auto">
                {SECCIONES.map((sec) => {
                  const hasProducts = seccionesConProductos.includes(sec.key)
                  return (
                    <button
                      key={sec.key}
                      onClick={() => handleSeccionChange(sec.key)}
                      className={`
                        group relative rounded-2xl border-2 bg-white
                        flex flex-col items-center text-center
                        flex-1 max-w-sm md:max-w-md lg:max-w-lg
                        p-6 sm:p-8 md:p-10 gap-5
                        transition-all duration-300 cursor-pointer
                        border-marron/10 hover:border-mostaza hover:shadow-xl hover:scale-[1.02]
                        shadow-md
                      `}
                    >
                      {/* Imagen circular — responsive: 160 / 192 / 224 px */}
                      <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden border-4 border-mostaza/20 flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] group-hover:border-mostaza/40">
                        <Image
                          src={sec.imagen}
                          alt={sec.label}
                          width={224}
                          height={224}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>

                      {/* Título */}
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-marron">
                        {sec.label}
                      </h3>

                      {/* Botón CTA con efecto profesional al hover */}
                      <span className="inline-flex items-center gap-1.5 bg-mostaza text-marron text-sm md:text-base font-semibold rounded-full px-6 py-2.5 shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:brightness-105 group-hover:gap-2.5">
                        Ver productos
                        <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>

                      {/* "Próximamente" badge */}
                      {!hasProducts && (
                        <div className="absolute top-3 right-3 bg-mostaza/90 text-marron text-xs rounded-full px-3 py-1 font-bold shadow-sm">
                          Próximamente
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STATE 2: Section selected → Show filters + promo banner + products
            ═══════════════════════════════════════════════════════════ */}
        {seccionActiva && seccionConfig && (
          <>
            {/* Breadcrumb: Volver a secciones + Section title */}
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVolverASecciones}
                className="text-marron hover:bg-mostaza/20 gap-1.5 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div className="h-6 w-px bg-marron/20" />
              <h3 className="text-xl sm:text-2xl font-bold text-marron flex items-center gap-2">
                <span className="w-7 h-7 rounded-full overflow-hidden inline-block bg-crema border border-mostaza/20 flex-shrink-0">
                  <Image
                    src={seccionConfig.imagen}
                    alt={seccionConfig.label}
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                  />
                </span>
                {seccionConfig.label}
              </h3>
            </div>

            {/* ══════ Promo Banner for this Section ══════ */}
            {promosForSection.length > 0 && (
              <div className="mb-6 rounded-xl bg-gradient-to-r from-rojo/8 via-mostaza/8 to-rojo/8 border border-rojo/15 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rojo/10 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-rojo" />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {promosForSection.map((promo) => (
                      <Badge
                        key={promo.id}
                        className="bg-rojo text-white text-xs font-bold px-3 py-1 border-0 whitespace-nowrap"
                      >
                        🔥 {promo.descuento_label}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-marron/70 whitespace-nowrap">
                    {promosForSection.length === 1
                      ? `${promosForSection[0].nombre}${promosForSection[0].descripcion ? ` — ${promosForSection[0].descripcion}` : ''}`
                      : `${promosForSection.length} promociones activas en ${seccionConfig.label.toLowerCase()}`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Filter Buttons — Con Gluten / Integrales / Sin Gluten + Solo Ofertas */}
            <div ref={filterBarRef} className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {FILTROS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleFiltroChange(f.key)}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                    transition-colors duration-150 border
                    ${filtro === f.key && !soloOfertas
                      ? 'bg-mostaza text-marron border-mostaza shadow-md'
                      : 'bg-white text-marron/70 border-marron/10 hover:border-mostaza/50 hover:text-marron'
                    }
                  `}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}

              {/* Solo Ofertas toggle — mutually exclusive with flour filters */}
              {promoCountInSection > 0 && (
                <button
                  onClick={() => {
                    if (!soloOfertas) {
                      // Activating Solo Ofertas — deactivate flour filter, show all flour types
                      setSoloOfertas(true)
                      setFamiliaActiva(null)
                    } else {
                      // Deactivating Solo Ofertas — restore default flour filter
                      setSoloOfertas(false)
                      setFiltro('con_gluten')
                      onFiltroChange?.('con_gluten')
                    }
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                    transition-colors duration-150 border
                    ${soloOfertas
                      ? 'bg-rojo text-white border-rojo shadow-md'
                      : 'bg-white text-rojo/70 border-rojo/20 hover:border-rojo/50 hover:text-rojo'
                    }
                  `}
                >
                  <Tag className="h-3.5 w-3.5" />
                  {soloOfertas ? `Solo Ofertas (${promoCountForCurrentFilter})` : `Solo Ofertas`}
                </button>
              )}
            </div>

            {/* Section description */}
            {!loading && !error && familiasVisibles.length > 0 && (
              <p className="text-center text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                {seccionConfig.description}
              </p>
            )}

            {/* Loading */}
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
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-mostaza/20 mx-auto mb-4">
                  <Image
                    src={seccionConfig.imagen}
                    alt={seccionConfig.label}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                {soloOfertas ? (
                  <>
                    <h3 className="text-xl font-bold text-marron mb-2">
                      No hay productos en oferta
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      No hay productos con promoción activa en esta sección actualmente.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSoloOfertas(false)
                        setFiltro('con_gluten')
                        onFiltroChange?.('con_gluten')
                      }}
                      className="border-mostaza text-marron hover:bg-mostaza hover:text-marron mt-4"
                    >
                      Ver todos los productos
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-marron mb-2">
                      Próximamente {seccionConfig.label.toLowerCase()}
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Estamos trabajando para traerte los mejores {seccionConfig.label.toLowerCase()}. ¡Volvé pronto!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Family Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {familiasVisibles.map((familia) => {
                    const data = familiaData[familia.nombre]
                    const count = data?.count ?? 0
                    const promoCount = data?.promoCount ?? 0
                    const isActive = familiaActiva === familia.nombre
                    const hasPromos = data?.hasPromos

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
                          ${hasPromos && !isActive ? 'border-rojo/20' : ''}
                        `}
                      >
                        {/* Promo indicator on family card */}
                        {hasPromos && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-rojo/10 text-rojo text-[10px] font-bold px-2 py-0.5 border-0">
                              🔥 Oferta
                            </Badge>
                          </div>
                        )}

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
                        <span className={`text-xs rounded-full px-2 py-0.5 font-semibold flex-shrink-0 ${soloOfertas ? 'bg-rojo/10 text-rojo' : 'bg-mostaza/20 text-marron'}`}>
                          {soloOfertas
                            ? `${promoCount} ${promoCount === 1 ? 'en oferta' : 'en oferta'}`
                            : `${count} ${count === 1 ? 'variedad' : 'variedades'}`
                          }
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
                      <div className="flex items-center gap-3 mb-2">
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
                          {promoCountInFamily > 0 && (
                            <span className="text-rojo ml-1">({promoCountInFamily} en oferta)</span>
                          )}
                        </span>
                      </div>

                      {/* Solo Ofertas sub-filter (within family) — mutually exclusive with flour filters */}
                      {promoCountInFamily > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => {
                              if (!soloOfertas) {
                                setSoloOfertas(true)
                              } else {
                                setSoloOfertas(false)
                                setFiltro('con_gluten')
                                onFiltroChange?.('con_gluten')
                              }
                            }}
                            className={`
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                              transition-colors duration-150 border
                              ${soloOfertas
                                ? 'bg-rojo text-white border-rojo'
                                : 'bg-white text-rojo/70 border-rojo/20 hover:border-rojo/50 hover:text-rojo'
                              }
                            `}
                          >
                            <Tag className="h-3 w-3" />
                            {soloOfertas ? `Solo ofertas (${promoCountInFamily})` : `Ver solo ofertas (${promoCountInFamily})`}
                          </button>
                        </div>
                      )}

                      {/* Products Grid — paginated */}
                      {productosFamilia.length === 0 ? (
                        <div className="text-center py-8">
                          <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                          <p className="text-muted-foreground">
                            {soloOfertas
                              ? 'No hay productos en oferta para este filtro en esta familia'
                              : 'No hay productos para este filtro en esta familia'
                            }
                          </p>
                          {soloOfertas && (
                            <Button
                              variant="link"
                              onClick={() => setSoloOfertas(false)}
                              className="text-rojo mt-2"
                            >
                              Ver todos los productos
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {productosVisibles.map((producto) => (
                              <ProductCard key={producto.id} producto={producto} promocion={productoPromociones[producto.id] || null} />
                            ))}
                          </div>

                          {/* "Ver más" button */}
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
          </>
        )}
      </div>
    </section>
  )
}
