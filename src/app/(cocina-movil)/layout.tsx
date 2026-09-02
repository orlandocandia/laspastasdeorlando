/**
 * ============================================================
 * Layout raíz — Subsistema Cocina Móvil
 * ============================================================
 *
 * Este layout envuelve TODAS las páginas de la cocina móvil.
 * Aplica el branding propio (paleta marron/mostaza/crema) y
 * prepara el contenedor mobile-first para tablets y celulares.
 *
 * Marca:
 *  - Nombre comercial: "El Amigo de las Pastas"
 *  - Subsistema: "Cocina Móvil"
 *  - Tagline: "Pastas artesanales con sabor a tradición"
 *  - Logo: /images/(cocina-movil)/logo.png (food truck con chef hat)
 *  - Favicon: /images/(cocina-movil)/favicon.ico
 *  - Paleta: marron #5C3A21, mostaza #E1AD01, crema #FFF8E7,
 *            oliva #708238, rojo #B91C1C
 * ============================================================
 */
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Cocina Móvil — El Amigo de las Pastas',
    template: '%s · Cocina Móvil',
  },
  description:
    'Sistema de gestión para la cocina móvil de El Amigo de las Pastas. Pastas artesanales con sabor a tradición.',
  keywords: [
    'cocina móvil',
    'pastas',
    'el amigo de las pastas',
    'gestión',
    'posadas',
    'misiones',
  ],
  authors: [{ name: 'El Amigo de las Pastas' }],
  applicationName: 'Cocina Móvil',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/images/(cocina-movil)/favicon.ico', sizes: 'any' },
      { url: '/images/(cocina-movil)/logo.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/images/(cocina-movil)/favicon.ico',
    apple: '/images/(cocina-movil)/logo.png',
  },
  openGraph: {
    title: 'Cocina Móvil — El Amigo de las Pastas',
    description: 'Gestión de la cocina móvil',
    siteName: 'Cocina Móvil',
    type: 'website',
    images: [{ url: '/images/(cocina-movil)/logo.png', width: 512, height: 512 }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5C3A21',
}

export default function CocinaMovilLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="cocina-movil-root min-h-screen flex flex-col bg-[#FFF8E7] text-[#1F1611] antialiased">
      {children}
    </div>
  )
}
