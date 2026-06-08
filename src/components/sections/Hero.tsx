'use client'

import Image from 'next/image'
import { ChevronDown, Sparkles, Truck, MessageSquare, Home } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Beneficio {
  icon: LucideIcon
  texto: string
}

const beneficios: Beneficio[] = [
  { icon: Sparkles, texto: 'Pastas artesanales' },
  { icon: Truck, texto: 'Envío GRATIS con seña' },
  { icon: MessageSquare, texto: 'Opiniones reales' },
  { icon: Home, texto: 'De puerta en puerta' },
]

const HERO_BG_IMAGE = '/images/hero-bg.jpg'

export default function Hero() {
  const bgImage = HERO_BG_IMAGE

  return (
    <section
      id="inicio"
      className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax Background */}
      <div
        className="parallax-bg absolute inset-0 z-0 transition-all duration-1000"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-1 bg-black/50" />

      {/* Content */}
      <div className="hero-content relative z-10 flex flex-col items-center text-center px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        {/* 1. Logo — responsive: smallest on phone, scales up */}
        <div className="hero-logo mb-2 sm:mb-3 flex justify-center">
          <Image
            src="/images/logo.png"
            alt="Pastas Orlando"
            width={800}
            height={800}
            className="h-44 w-44 sm:h-56 sm:w-56 md:h-72 md:w-72 lg:h-96 lg:w-96 object-contain drop-shadow-2xl hero-logo-img"
            priority
          />
        </div>

        {/* 2. Línea dorada + Título agrupados */}
        <div className="inline-flex flex-col items-center hero-linea-titulo">
          <div className="gold-line-animate h-1.5 bg-mostaza w-full rounded-full hero-linea-dorada" />
          <div className="h-3 sm:h-4 md:h-6 hero-line-gap" />
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-crema mb-2 sm:mb-3 hero-titulo">
            Pastas artesanales
          </h1>
        </div>

        {/* 3. Subtítulo */}
        <p className="text-crema/80 text-base sm:text-lg md:text-xl lg:text-2xl font-light mb-6 sm:mb-8 md:mb-10 hero-subtitulo">
          Hechas con amor y tradición
        </p>

        {/* 4. Íconos de beneficios — Mobile: grid 3+2 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:hidden max-w-[240px] mx-auto mb-4 hero-iconos-mobile">
          {beneficios.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 hero-icono-item group"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-mostaza/15 hero-icono-circulo transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  <Icon className="h-5 w-5 text-mostaza hero-icono-svg" strokeWidth={1.8} />
                </div>
                <span className="text-crema text-center leading-tight text-[11px] hero-icono-texto">
                  {b.texto}
                </span>
              </div>
            )
          })}
        </div>

        {/* Desktop/Tablet: flex row */}
        <div className="hidden sm:flex sm:flex-row sm:flex-nowrap sm:justify-center sm:gap-4 md:gap-6 lg:gap-10 max-w-4xl mx-auto mb-4 sm:mb-6 hero-iconos">
          {beneficios.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 flex-shrink-0 hero-icono-item group"
              >
                <div className="flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full bg-mostaza/15 hero-icono-circulo transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  <Icon className="h-6 w-6 md:h-7 md:w-7 text-mostaza hero-icono-svg" strokeWidth={1.8} />
                </div>
                <span className="text-crema text-center leading-tight max-w-[100px] md:max-w-[120px] text-xs md:text-sm hero-icono-texto">
                  {b.texto}
                </span>
              </div>
            )
          })}
        </div>

        {/* 5. Flecha hacia abajo */}
        <a
          href="#productos"
          className="animate-bounce-arrow mt-4 sm:mt-6 md:mt-8 text-mostaza/70 hover:text-mostaza transition-colors hero-flecha"
          aria-label="Ver productos"
        >
          <ChevronDown className="h-7 w-7 sm:h-8 sm:w-8" />
        </a>
      </div>
    </section>
  )
}
