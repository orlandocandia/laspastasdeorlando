'use client'

/**
 * ============================================================
 * Ayuda — Cocina Móvil
 * ============================================================
 * URL: /cm/ayuda
 * Manual interactivo con índice lateral, buscador y contenido dinámico.
 * ============================================================
 */

import * as React from 'react'
import { Search, BookOpen, ChevronRight, Lightbulb, CheckCircle2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AYUDA_SECCIONES, buscarSecciones, type AyudaSeccion } from '@/lib/cocina-movil/ayuda-data'

export default function CmAyudaPage() {
  const [search, setSearch] = React.useState('')
  const [activeId, setActiveId] = React.useState(AYUDA_SECCIONES[0]?.id || '')
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  const filtered = React.useMemo(() => buscarSecciones(search), [search])
  const active = React.useMemo(() => AYUDA_SECCIONES.find((s) => s.id === activeId) || filtered[0], [activeId, filtered])

  const selectSection = (id: string) => {
    setActiveId(id)
    setMobileSidebarOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#5C3A21] text-[#E1AD01] flex items-center justify-center">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21]">Ayuda</h1>
          <p className="text-sm text-[#8A7E70]">Manual interactivo del sistema</p>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setMobileSidebarOpen((s) => !s)}
        className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm text-[#5C3A21] bg-[#FBF1DC] rounded-lg border border-[#5C3A21]/15"
      >
        {mobileSidebarOpen ? <X className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {mobileSidebarOpen ? 'Cerrar índice' : 'Ver índice de módulos'}
      </button>

      <div className="flex gap-4">
        {/* Sidebar (índice) */}
        <aside className={`${mobileSidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
          <div className="sticky top-4 space-y-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar en el manual…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>

            {/* Índice */}
            <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSection(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active?.id === s.id
                      ? 'bg-[#5C3A21] text-[#FFF8E7]'
                      : 'text-[#5C3A21] hover:bg-[#5C3A21]/8'
                  }`}
                >
                  {s.titulo}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-[#8A7E70] text-center py-4">Sin resultados</p>
              )}
            </nav>
          </div>
        </aside>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {active && <AyudaContenido seccion={active} />}
        </div>
      </div>
    </div>
  )
}

function AyudaContenido({ seccion }: { seccion: AyudaSeccion }) {
  return (
    <Card className="border-[#5C3A21]/10 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#E1AD01]/15 flex items-center justify-center text-[#7a5c00]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl text-[#5C3A21]">{seccion.titulo}</CardTitle>
            <p className="text-sm text-[#8A7E70] mt-0.5">{seccion.descripcion}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pasos */}
        <div>
          <h3 className="text-sm font-bold text-[#5C3A21] mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#708238]" />
            Cómo usar este módulo
          </h3>
          <ol className="space-y-2">
            {seccion.pasos.map((paso, i) => (
              <li key={i} className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-[#4A3F36] pt-0.5">{paso}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Ejemplos */}
        {seccion.ejemplos && seccion.ejemplos.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#5C3A21] mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#E1AD01]" />
              Ejemplos prácticos
            </h3>
            <div className="space-y-2">
              {seccion.ejemplos.map((ej, i) => (
                <div key={i} className="bg-[#FBF1DC] border border-[#5C3A21]/10 rounded-lg px-3 py-2 text-sm text-[#4A3F36]">
                  {ej}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {seccion.tips && seccion.tips.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#5C3A21] mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#E1AD01]" />
              Tips importantes
            </h3>
            <div className="space-y-2">
              {seccion.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 bg-[#E1AD01]/5 border border-[#E1AD01]/20 rounded-lg px-3 py-2 text-sm text-[#7a5c00]">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
