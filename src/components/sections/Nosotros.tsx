'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Heart,
  Hand,
  Clock,
  Medal,
  Snowflake,
  Sun,
  ImageIcon,
} from 'lucide-react'

interface Cartel {
  icons: React.ReactNode
  title: string
  image: string
  imageAlt: string
  description: string
}

const carteles: Cartel[] = [
  {
    icons: (
      <>
        <Heart size={32} className="text-rojo" />
        <Hand size={32} className="text-rojo ml-1" />
      </>
    ),
    title: 'Artesanal',
    image: '/images/nosotros/artesanal.jpg',
    imageAlt: 'Elaboración artesanal de pastas',
    description:
      'Elaboramos nuestras pastas combinando la tradición familiar con el uso de maquinaria específica. Respetamos los tiempos de cada preparación para lograr la textura y el sabor que nos distinguen.',
  },
  {
    icons: <Clock size={40} className="text-mostaza" />,
    title: 'Tradición',
    image: '/images/nosotros/tradicion.jpg',
    imageAlt: 'Recetas tradicionales de pasta',
    description:
      'Recetas heredadas que se perfeccionan con cada vuelta de masa, manteniendo la esencia.',
  },
  {
    icons: <Medal size={40} className="text-mostaza" />,
    title: 'Calidad',
    image: '/images/nosotros/calidad.jpg',
    imageAlt: 'Ingredientes frescos y de calidad',
    description:
      'Seleccionamos cuidadosamente cada materia prima: harinas de primera calidad, huevos frescos, verduras de estación y productores locales. Creemos que una buena pasta empieza mucho antes de la mesa.',
  },
  {
    icons: (
      <>
        <Snowflake size={32} className="text-[#3B82F6]" />
        <Sun size={32} className="text-mostaza ml-1" />
      </>
    ),
    title: 'Fresco o congelado',
    image: '/images/nosotros/fresco-congelado.jpg',
    imageAlt: 'Pastas frescas o congeladas',
    description:
      'Trabajamos con pastas frescas, ideales para cocinar en el momento. También ofrecemos opciones freezadas, manteniendo intactos el sabor y la calidad, para que tengas siempre una comida casera lista cuando la necesites.',
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
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const textVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

function CartelImage({ src, alt }: { src: string; alt: string }) {
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
      sizes="(max-width: 768px) 100vw, 25vw"
      onError={() => setError(true)}
    />
  )
}

export default function Nosotros() {
  return (
    <section id="nosotros" className="min-h-screen flex flex-col justify-center py-12 sm:py-16 md:py-20 bg-crema">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-marron">
            Sobre <span className="text-rojo">Nosotros</span>
          </h2>
          <div className="h-1 w-20 bg-mostaza mx-auto mt-4 rounded-full" />
        </div>

        {/* Story */}
        <motion.div
          className="max-w-4xl mx-auto text-center mb-14"
          variants={textVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4">
            <strong className="text-marron">Hace más de diez años comenzamos este camino con una idea simple: salir adelante a través del trabajo, haciendo las cosas con dedicación, responsabilidad y pasión.</strong>
          </p>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4">
            Tras atravesar momentos difíciles y en la búsqueda de reinventarnos laboralmente, encontramos en la elaboración de pastas frescas un oficio que, con el tiempo, se convirtió en nuestra verdadera vocación. Gracias a las enseñanzas familiares, la capacitación constante y el esfuerzo de cada día, nació Las Pastas de Orlando.
          </p>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4">
            Hoy seguimos creciendo junto a un equipo comprometido con ofrecer productos frescos, artesanales y de calidad, manteniendo siempre el sabor casero y la atención cercana que nos distinguen desde nuestros comienzos.
          </p>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            <strong className="text-marron">Creemos en el valor del trabajo honesto, en el cuidado de cada detalle y en llevar a cada mesa una experiencia elaborada con dedicación, calidad y mucho cariño.</strong>
          </p>
        </motion.div>

        {/* 4 Carteles con íconos + imagen + texto */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {carteles.map((cartel, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="flex flex-col bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6"
            >
              {/* Ícono */}
              <div className="flex-shrink-0 text-center pb-3">
                <div className="w-20 h-20 mx-auto mb-3 bg-crema rounded-full shadow-md flex items-center justify-center">
                  {cartel.icons}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-marron">
                  {cartel.title}
                </h3>
              </div>

              {/* Imagen */}
              <div className="relative h-36 sm:h-44 w-full my-3 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <CartelImage src={cartel.image} alt={cartel.imageAlt} />
              </div>

              {/* Texto */}
              <div className="flex-grow mt-2">
                <p className="text-gray-600 text-sm text-center leading-relaxed">
                  {cartel.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
