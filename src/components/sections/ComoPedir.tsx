'use client'

import { useState, Fragment } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Truck,
  ThumbsUp,
  ImageIcon,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { MercadoPagoIcon } from '@/components/icons/MercadoPagoIcon'

interface Step {
  icons: React.ReactNode
  title: string
  image: string
  imageAlt: string
  description: string
}

const steps: Step[] = [
  {
    icons: (
      <div className="flex justify-center gap-3 items-center">
        <WhatsAppIcon className="w-12 h-12" />
        <span className="text-2xl font-light text-gray-400">+</span>
        <MercadoPagoIcon className="w-12 h-12" />
      </div>
    ),
    title: 'Hacé tu consulta y reservá tu pedido',
    image: '/images/pasos/pedido-sena.jpg',
    imageAlt: 'Pedido y seña por WhatsApp y Mercado Pago',
    description:
      'Consultanos por WhatsApp, email, redes sociales o mediante nuestro formulario web. Te confirmamos al instante si hay stock disponible o cuánto tiempo llevará la elaboración. Una vez confirmada la disponibilidad, abonás la seña por Mercado Pago y reservamos tu pedido.',
  },
  {
    icons: (
      <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300">
        <Truck size={40} className="text-mostaza" />
      </div>
    ),
    title: 'Coordinamos la entrega',
    image: '/images/pasos/coordinacion.jpg',
    imageAlt: 'Coordinación de entrega a domicilio',
    description:
      'Con la seña abonada, coordinamos el lugar, horario de entrega y la persona que recibirá el pedido. ¡El envío es GRATIS!',
  },
  {
    icons: (
      <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300">
        <ThumbsUp size={40} className="text-rojo" />
      </div>
    ),
    title: 'Disfrutás y volvé a elegirnos',
    image: '/images/pasos/disfrute.jpg',
    imageAlt: 'Persona disfrutando pastas caseras',
    description:
      'Recibís tu pedido, abonás el saldo restante, cocinás y disfrutás de unas pastas caseras listas para compartir. Si te gustó la experiencia, ¡dejános tu opinión y te esperamos nuevamente para seguir compartiendo el sabor de lo casero!',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

function StepImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 gap-2">
        <ImageIcon className="h-8 w-8" strokeWidth={1.2} />
        <span className="text-xs">Imagen no disponible</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading="lazy"
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 33vw"
      onError={() => setError(true)}
    />
  )
}

export default function ComoPedir() {
  return (
    <section id="como-pedir" className="min-h-screen flex flex-col justify-center py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-marron">
            Tu pedido <span className="text-rojo">paso a paso</span>
          </h2>
          <div className="h-1 w-20 bg-mostaza mx-auto mt-4 rounded-full" />
        </div>

        {/* Steps with arrows — flex wrapper for horizontal alignment */}
        <motion.div
          className="flex flex-wrap md:flex-nowrap justify-center items-stretch gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {steps.map((step, index) => (
            <Fragment key={index}>
              {/* Tarjeta — flex column layout for proper text allocation */}
              <motion.div
                variants={cardVariants}
                className="flex flex-col bg-crema rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 w-full md:flex-1"
              >
                {/* Bloque superior: Número + Ícono + Título */}
                <div className="flex-shrink-0 text-center pb-3">
                  {/* Numeración */}
                  <div className="w-8 h-8 mx-auto mb-2 bg-mostaza rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  {/* Ícono — cada paso define su propio contenedor */}
                  <div className="mx-auto mb-3 flex items-center justify-center min-h-[80px]">
                    {step.icons}
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-marron whitespace-nowrap px-2">
                    {step.title}
                  </h3>
                </div>

                {/* Imagen — altura fija, no se encoge */}
                <div className="relative h-40 sm:h-48 w-full my-3 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <StepImage src={step.image} alt={step.imageAlt} />
                </div>

                {/* Texto — ocupa el espacio restante, siempre visible */}
                <div className="flex-grow mt-2">
                  <p className="text-gray-600 text-sm text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>

              {/* Flecha horizontal en desktop — no después de la última */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center text-marron/50">
                  <ChevronRight className="h-8 w-8" />
                </div>
              )}

              {/* Flecha vertical en mobile — no después de la última */}
              {index < steps.length - 1 && (
                <div className="flex md:hidden items-center justify-center text-marron/50 w-full">
                  <ChevronDown className="h-8 w-8" />
                </div>
              )}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
