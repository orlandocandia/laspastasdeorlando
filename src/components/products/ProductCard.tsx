'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface ProductCardProps {
  producto: {
    id: number
    nombre: string
    descripcion: string | null
    precio_venta: number
    peso_unitario_aprox: number
    unidades?: number | null
    imagen: string | null
    stock_actual: number
    destacado: boolean
    tipo_harina?: string | null
    modo_coccion?: string | null
    texto_frente?: string | null
    texto_reverso?: string | null
    categoria: {
      id: number
      nombre: string
      imagen?: string | null
    }
  }
}

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

/**
 * Render modo_coccion text preserving:
 * - Bold: **text** → <strong>text</strong>
 * - Line breaks: \n → <br />
 */
function renderizarModoCoccion(texto: string | null) {
  if (!texto) return null
  const html = texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
  return html
}

export default function ProductCard({ producto }: ProductCardProps) {
  const sinStock = producto.stock_actual <= 0
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const formatPeso = (kg: number) => {
    if (kg >= 1) return `${kg} kg`
    return `${Math.round(kg * 1000)}g`
  }

  // Handle flip via click/tap — ALWAYS enabled
  const handleFlip = () => {
    setIsFlipped((prev) => !prev)
  }

  // Close on click outside (mobile UX)
  useEffect(() => {
    if (!isFlipped) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsFlipped(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isFlipped])

  const hasModoCoccion = !!producto.modo_coccion?.trim()

  // Detectar si la categoría es de "uso" (tapas, empanadas, etc.) vs "cocción" (pastas)
  const categoriaNombre = producto.categoria.nombre.toLowerCase()
  const esTapa = /tapa|empanada|pastelito|pascualina|tarta/i.test(categoriaNombre)

  // Prioridad: texto personalizado > fallback por categoría
  const defaultFrente = esTapa ? '📦 Uso y Conservación' : '🍝 Modo de cocción'
  const defaultReverso = esTapa ? '📦 Uso y Conservación' : '🍝 Modo de cocción'
  const textoFrente = producto.texto_frente?.trim() || defaultFrente
  const tituloReverso = producto.texto_reverso?.trim() || defaultReverso

  return (
    <div
      ref={cardRef}
      className="product-card group rounded-xl border border-border bg-card shadow-md hover:shadow-xl transition-shadow duration-150"
      style={{ perspective: '1000px' }}
    >
      <div
        className="card-inner relative w-full"
        style={{
          transition: 'transform 0.6s ease-in-out',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ===== FRONT FACE — relative so it determines card height ===== */}
        <div
          className="card-front relative rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div
            className="flex flex-col cursor-pointer min-h-[340px] sm:min-h-[360px]"
            onClick={handleFlip}
          >
            {/* Image */}
            <div
              className="aspect-[4/3] relative bg-gray-100 rounded-t-lg overflow-hidden flex-shrink-0"
              onContextMenu={(e) => e.preventDefault()}
            >
              <Image
                src={producto.imagen || '/images/placeholder-producto.jpg'}
                alt={producto.nombre}
                fill
                loading="lazy"
                className="object-contain p-2 group-hover:scale-105 select-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                draggable={false}
              />

              {/* Watermark overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[url('/images/logo.png')] bg-center bg-no-repeat bg-[length:60px_60px] opacity-15 select-none"
                aria-hidden="true"
              />

              {/* Destacado Badge */}
              {producto.destacado && !sinStock && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-mostaza text-marron text-xs font-bold px-3 py-1 shadow-md border-0">
                    ⭐ Destacado
                  </Badge>
                </div>
              )}

              {/* Cooking/usage hint overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100">
                <span className="bg-white/90 text-marron text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                  {textoFrente}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-mostaza/20 text-marron text-xs hover:bg-mostaza/30 border-0">
                    {formatPeso(producto.peso_unitario_aprox)}
                  </Badge>
                  {producto.unidades && producto.unidades > 0 && (
                    <Badge className="bg-crema text-marron text-xs hover:bg-crema/80 border border-mostaza/20">
                      Contiene: {producto.unidades} unidades
                    </Badge>
                  )}
                </div>
                {producto.tipo_harina && (
                  <Badge
                    className={`
                      text-xs border-0
                      ${producto.tipo_harina === 'sin_gluten'
                        ? 'bg-oliva/15 text-oliva'
                        : producto.tipo_harina === 'integral'
                        ? 'bg-mostaza/15 text-mostaza'
                        : 'bg-marron/8 text-marron/60'
                      }
                    `}
                  >
                    {producto.tipo_harina === 'con_gluten'
                      ? 'Con Gluten'
                      : producto.tipo_harina === 'integral'
                      ? 'Integral'
                      : 'Sin Gluten'}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-marron text-base mb-1 line-clamp-1 text-center">
                {producto.nombre}
              </h3>
              {producto.descripcion && (
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  {producto.descripcion}
                </p>
              )}
              <div className="flex items-center justify-between mt-auto pt-2">
                <p className="text-mostaza font-bold text-lg">
                  {priceFormatter.format(producto.precio_venta)}
                </p>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    const contactoSection = document.getElementById('contacto')
                    if (contactoSection) {
                      contactoSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold gap-1.5 transition-colors duration-300"
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BACK FACE ===== */}
        <div
          className="card-back absolute inset-0 bg-white rounded-xl flex flex-col overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2 border-b border-marron/10 flex-shrink-0">
            <h3 className="font-bold text-marron text-sm line-clamp-1 flex-1 mr-2">
              {tituloReverso}
            </h3>
            <button
              onClick={handleFlip}
              className="text-marron/50 hover:text-marron text-lg font-medium flex-shrink-0 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-marron/5"
              aria-label="Volver al frente"
            >
              ✕
            </button>
          </div>

          {/* Body — scrollable if text is long */}
          <div className="flex-1 overflow-y-auto p-4 pt-3 text-sm sm:text-sm md:text-sm lg:text-base">
            {hasModoCoccion ? (
              <div
                className="text-marron/80 leading-relaxed [&_strong]:text-marron [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: renderizarModoCoccion(producto.modo_coccion!) || '' }}
              />
            ) : (
              <div className="coccion-default text-center flex flex-col items-center justify-center h-full">
                <p className="text-2xl mb-2">📖</p>
                <p className="font-semibold text-marron mb-2">{tituloReverso}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Consultános por WhatsApp para más información.
                </p>
                <a
                  href="https://wa.me/543754419324"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded-full text-sm hover:bg-green-700 transition-colors"
                >
                  📲 Preguntar ahora
                </a>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
