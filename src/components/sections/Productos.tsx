'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { PackageOpen, ArrowLeft, Wheat, Leaf, Sparkles } from 'lucide-react'
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
  categoria: {
    id: number
    nombre: string
    descripcion: string | null
    imagen: string | null
  }
}

export type FiltroHarina = 'con_gluten' | 'integral' | 'sin_gluten'

interface Familia {
  nombre: string
  imagen: string | null
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

// Imagen dinámica según filtro para familias con variante integral
function getFamiliaImagen(familia: Familia, filtro: FiltroHarina): string {
  if (familia.nombre === 'Tallarines' && filtro === 'integral') {
    return '/images/familias/tallarinesintegrales.png'
  }
  if (familia.nombre === 'Cintas Anchas' && filtro === 'integral') {
    return '/images/familias/cintasanchasintegrales.png'
  }
  // Si la categoría tiene imagen propia (subida desde el dashboard), usarla
  if (familia.imagen) {
    return familia.imagen
  }
  // Si no, usar la imagen por defecto hardcodeada
  return IMAGENES_DEFAULT[familia.nombre] || '/images/placeholder-producto.jpg'
}

const FILTROS: { key: FiltroHarina; label: string; icon: React.ReactNode }[] = [
  { key: 'con_gluten', label: 'CON GLUTEN', icon: <Wheat className="h-3.5 w-3.5" /> },
  { key: 'integral', label: 'INTEGRALES', icon: <Leaf className="h-3.5 w-3.5" /> },
  { key: 'sin_gluten', label: 'SIN GLUTEN', icon: <Sparkles className="h-3.5 w-3.5" /> },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const expandedVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
}

interface ProductosProps {
  filtroActivo?: FiltroHarina
  onFiltroChange?: (filtro: FiltroHarina) => void
}

export default function Productos({ filtroActivo = 'con_gluten', onFiltroChange }: ProductosProps) {
  const [productos, setProductos] = useState<ProductoPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<FiltroHarina>(filtroActivo)
  const [familiaActiva, setFamiliaActiva] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProductos() {
      try {
        setError('')
        const params = new URLSearchParams()
        if (filtro) params.set('tipo', filtro)
        const res = await fetch(`/api/productos-terminados/public?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setProductos(data.productos || [])
        } else {
          setError('No se pudieron cargar los productos. Intentá más tarde.')
        }
      } catch {
        setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
      } finally {
        setLoading(false)
      }
    }
    fetchProductos()
  }, [filtro])

  // Sync with parent filtro state
  useEffect(() => {
    if (filtroActivo !== filtro) {
      setFiltro(filtroActivo ?? 'con_gluten')
      setFamiliaActiva(null)
    }
  }, [filtroActivo])

  // When changing filter, reset active family and notify parent
  const handleFiltroChange = (nuevoFiltro: FiltroHarina) => {
    setFiltro(nuevoFiltro)
    setFamiliaActiva(null)
    onFiltroChange?.(nuevoFiltro)
  }

  // Build families dynamically from product categories
  const familias: Familia[] = useMemo(() => {
    const seen = new Map<string, Familia>()
    for (const p of productos) {
      const catNombre = p.categoria.nombre
      if (!seen.has(catNombre)) {
        seen.set(catNombre, {
          nombre: catNombre,
          imagen: p.categoria.imagen || null,
          descripcion: p.categoria.descripcion || DESCRIPCIONES_DEFAULT[catNombre] || `Productos de ${catNombre.toLowerCase()}`,
          descripcionDB: p.categoria.descripcion,
          categoriaId: p.categoria.id,
        })
      }
    }
    // Sort by known order, then alphabetically
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

  // Compute product counts per family (considering the current filter)
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

  // Products for the active family
  const productosFamilia = useMemo(() => {
    if (!familiaActiva) return []
    return productos.filter((p) => p.categoria.nombre === familiaActiva)
  }, [productos, familiaActiva])

  const handleFamiliaClick = (nombre: string) => {
    setFamiliaActiva((prev) => (prev === nombre ? null : nombre))
  }

  // Filter out families with no products for current filter
  const familiasVisibles = familias.filter(
    (f) => familiaData[f.nombre]?.hasProducts
  )

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
            Pastas artesanales elaboradas con ingredientes frescos y de calidad. Filtrá por tipo de harina y explorá nuestras familias.
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
                transition-all duration-200 border
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
              onClick={() => {
                setLoading(true)
                setError('')
                const params = new URLSearchParams()
                if (filtro) params.set('tipo', filtro)
                fetch(`/api/productos-terminados/public?${params.toString()}`)
                  .then((res) => res.json())
                  .then((data) => {
                    setProductos(data.productos || [])
                  })
                  .catch(() => setError('Error de conexión.'))
                  .finally(() => setLoading(false))
              }}
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
            {/* Family Cards Grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={`familias-${filtro}`}
            >
              {familiasVisibles.map((familia) => {
                const data = familiaData[familia.nombre]
                const count = data?.count ?? 0
                const isActive = familiaActiva === familia.nombre

                return (
                  <motion.div key={familia.nombre} variants={cardVariants}>
                    <button
                      onClick={() => handleFamiliaClick(familia.nombre)}
                      className={`
                        w-full group relative rounded-2xl border bg-white p-6 sm:p-8
                        flex flex-col items-center justify-between text-center min-h-[240px]
                        transition-all duration-300
                        border-marron/10 hover:scale-[1.03] hover:shadow-lg cursor-pointer
                        ${isActive ? 'ring-2 ring-mostaza shadow-lg scale-[1.03]' : ''}
                      `}
                    >
                      {/* Imagen representativa */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-crema border-2 border-mostaza/20 transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                        <Image
                          src={getFamiliaImagen(familia, filtro)}
                          alt={familia.nombre}
                          width={96}
                          height={96}
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

                      {/* Active indicator dot */}
                      {isActive && (
                        <motion.div
                          layoutId="activeFamilia"
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-mostaza"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Expanded Family Products */}
            <AnimatePresence mode="wait">
              {familiaActiva && (() => {
                const familiaHeader = familias.find((f) => f.nombre === familiaActiva)
                const imagenHeader = familiaHeader ? getFamiliaImagen(familiaHeader, filtro) : '/images/placeholder-producto.jpg'
                return (
                <motion.div
                  key={familiaActiva}
                  variants={expandedVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <div className="bg-crema/50 rounded-2xl p-6 mt-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFamiliaActiva(null)}
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
                            className="object-cover w-full h-full"
                          />
                        </span>
                        {familiaActiva}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        — {productosFamilia.length} {productosFamilia.length === 1 ? 'variedad' : 'variedades'}
                      </span>
                    </div>

                    {/* Products Grid */}
                    {productosFamilia.length === 0 ? (
                      <div className="text-center py-8">
                        <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">
                          No hay productos para este filtro en esta familia
                        </p>
                      </div>
                    ) : (
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {productosFamilia.map((producto) => (
                          <motion.div key={producto.id} variants={cardVariants}>
                            <ProductCard producto={producto} />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )})()}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  )
}
