'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Productos', href: '#productos' },
  { label: 'Cómo pedir', href: '#como-pedir' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Opiniones', href: '#opiniones' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contacto', href: '#contacto' },
]

const NAVBAR_HEIGHT = 64

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setOpen(false)

    const element = document.querySelector(href)
    if (element) {
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - NAVBAR_HEIGHT
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-crema/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo — always visible on mobile, hidden on desktop (nav links are centered) */}
          <div className="lg:hidden flex items-center">
            <span className={`font-bold text-sm transition-colors ${scrolled ? 'text-marron' : 'text-white'}`}>
              Pastas Orlando
            </span>
          </div>

          {/* Desktop Navigation - centered */}
          <div className="hidden lg:flex items-center justify-center w-full gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`nav-link relative px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-semibold transition-all duration-200 min-h-[44px] flex items-center
                  ${scrolled ? 'text-marron' : 'text-white'}
                  hover:text-mostaza hover:bg-mostaza/10
                `}
              >
                {link.label}
                {/* Hover underline - expands from center, mostaza */}
                <span className="nav-link-underline absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-mostaza rounded-full w-0 transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`min-w-[44px] min-h-[44px] transition-colors ${
                    scrolled
                      ? 'text-marron hover:text-mostaza'
                      : 'text-white hover:text-mostaza'
                  }`}
                  aria-label="Abrir menú"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-crema w-72">
                <SheetTitle className="text-marron font-bold text-xl px-4 pt-2">
                  Menú
                </SheetTitle>
                <div className="flex flex-col gap-1 px-2 mt-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="px-4 py-3 rounded-lg font-semibold text-base min-h-[44px] flex items-center transition-all duration-200 text-marron hover:bg-mostaza/10 hover:text-mostaza"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
