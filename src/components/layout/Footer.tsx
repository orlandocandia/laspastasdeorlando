'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Facebook, Instagram, MessageCircle } from 'lucide-react'

const whatsappLink = 'https://wa.me/549376419324?text=Hola!%20Quiero%20hacer%20un%20pedido%20de%20pastas'

export default function Footer() {
  return (
    <footer className="bg-marron text-crema mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Logo + Copyright (misma línea) */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Pastas Orlando"
              width={52}
              height={52}
              loading="lazy"
              className="h-13 w-13 object-contain"
            />
            <p className="text-sm text-crema/70">
              &copy; {new Date().getFullYear()} Todos los derechos reservados
            </p>
          </div>

          {/* Frase con corazón integrado */}
          <p className="text-sm text-crema/50 text-center">
            Pastas artesanales hechas con amor y tradición en Posadas, Misiones{' '}
            <Link
              href="/admin/login"
              className="text-crema/40 hover:text-rojo transition-colors inline-flex align-middle"
              aria-label="Admin"
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
            </Link>
          </p>

          {/* Redes sociales */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-crema/70 hover:text-mostaza transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-crema/70 hover:text-mostaza transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-crema/70 hover:text-whatsapp transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
