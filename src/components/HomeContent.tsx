'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'
import Hero from '@/components/sections/Hero'
import Productos from '@/components/sections/Productos'
import ComoPedir from '@/components/sections/ComoPedir'
import Nosotros from '@/components/sections/Nosotros'
import Opiniones from '@/components/sections/Opiniones'
import FAQ from '@/components/sections/FAQ'
import Contacto from '@/components/sections/Contacto'

export type FiltroHarina = 'todos' | 'con_gluten' | 'integral' | 'sin_gluten'

export default function HomeContent() {
  const [filtroActivo, setFiltroActivo] = useState<FiltroHarina>('todos')

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Hero filtroActivo={filtroActivo} />
        <Productos filtroActivo={filtroActivo} onFiltroChange={setFiltroActivo} />
        <ComoPedir />
        <Nosotros />
        <Opiniones />
        <FAQ />
        <Contacto />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}
