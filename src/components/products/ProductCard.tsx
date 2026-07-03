'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PromocionInfo {
  promocionId: number
  promocionNombre: string
  tipo: string
  valor_descuento: number
  precio_original: number
  precio_final: number
  descuento_label: string
}

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
  promocion?: PromocionInfo | null
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

export type { PromocionInfo }

export default function ProductCard({ producto, promocion }: ProductCardProps) {
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

  const tienePromocion = !!promocion

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

              {/* Watermark overlay — logo semi-transparente para identificación de marca */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[url('/images/logo.png')] bg-center bg-no-repeat bg-[length:60px_60px] sm:bg-[length:70px_70px] md:bg-[length:80px_80px] opacity-50 mix-blend-multiply select-none"
                aria-hidden="true"
              />

              {/* Destacado Badge */}
              {producto.destacado && !sinStock && !tienePromocion && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-mostaza text-marron text-xs font-bold px-3 py-1 shadow-md border-0">
                    ⭐ Destacado
                  </Badge>
                </div>
              )}

              {/* Promoción Badge — takes priority over Destacado */}
              {tienePromocion && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-rojo text-white text-xs font-bold px-3 py-1 shadow-lg border-0 animate-pulse">
                    🔥 {promocion.descuento_label}
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
                <div className="flex flex-col">
                  {tienePromocion ? (
                    <>
                      <span className="text-muted-foreground text-xs line-through">
                        {priceFormatter.format(promocion.precio_original)}
                      </span>
                      <span className="text-rojo font-bold text-lg leading-tight">
                        {priceFormatter.format(promocion.precio_final)}
                      </span>
                    </>
                  ) : (
                    <span className="text-mostaza font-bold text-lg">
                      {priceFormatter.format(producto.precio_venta)}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    const contactoSection = document.getElementById('contacto')
                    if (contactoSection) {
                      contactoSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="bg-green-600 text-white text-sm md:text-xs px-3 py-1.5 md:px-2 md:py-1 rounded-full hover:bg-green-700 hover:scale-105 transition-all cursor-pointer font-semibold gap-1 w-auto min-h-[44px] md:min-h-0"
                >
                  📝 Consultar Disponibilidad
                </Button>
              </div>
              {/* Mobile tap hint — solo visible en pantallas < 768px */}
              <div className="flex md:hidden items-center justify-center gap-1 mt-2 pt-1">
                <span className="text-xs">👆</span>
                <span className="text-[11px] text-muted-foreground">Tocá para ver {esTapa ? 'uso y conservación' : 'modo de cocción'}</span>
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
            {tienePromocion && (
              <div className="mb-4 bg-rojo/5 border border-rojo/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">🔥</span>
                  <span className="font-bold text-rojo text-sm">{promocion.descuento_label}</span>
                  <span className="text-xs text-muted-foreground">— {promocion.promocionNombre}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="line-through text-muted-foreground">
                    {priceFormatter.format(promocion.precio_original)}
                  </span>
                  <span className="font-bold text-rojo">
                    {priceFormatter.format(promocion.precio_final)}
                  </span>
                </div>
              </div>
            )}

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
