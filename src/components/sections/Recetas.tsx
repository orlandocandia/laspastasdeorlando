'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Clock, ChefHat, X, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface Receta {
  id: number
  titulo: string
  descripcion: string | null
  ingredientes: string
  pasos: string
  tiempo_preparacion: string | null
  tiempo_coccion: string | null
  dificultad: string
  imagen: string | null
  categoria: string | null
  destacado: boolean
  createdAt: string
}

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: 'Fácil', media: 'Media', dificil: 'Difícil',
}
const DIFICULTAD_COLOR: Record<string, string> = {
  facil: 'bg-oliva/15 text-oliva',
  media: 'bg-mostaza/15 text-mostaza',
  dificil: 'bg-rojo/15 text-rojo',
}
const CATEGORIA_LABEL: Record<string, string> = {
  salsas: 'Salsas', pastas: 'Pastas', postres: 'Postres',
  aperitivos: 'Aperitivos', bebidas: 'Bebidas', otros: 'Otros',
}

export default function Recetas() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null)

  useEffect(() => {
    fetch('/api/recetas-cocina/public')
      .then((r) => r.json())
      .then((data) => {
        setRecetas(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtrarRecetas = () => {
    return recetas.filter((r) => {
      const matchSearch = !search ||
        r.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (r.descripcion || '').toLowerCase().includes(search.toLowerCase())
      const matchCat = filtroCategoria === 'all' || r.categoria === filtroCategoria
      return matchSearch && matchCat
    })
  }

  const recetasFiltradas = filtrarRecetas()

  return (
    <section id="recetas" className="py-16 md:py-24 bg-crema">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="bg-mostaza/15 text-mostaza mb-3">Recetas de Cocina</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-marron mb-3">
            Nuestras Recetas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre cómo preparar deliciosos platos con nuestros productos.
            Recetas caseras, fáciles y para todos los gustos.
          </p>
        </div>

        {/* Filtros */}
        {recetas.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar receta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full sm:w-44 bg-white">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Grid de recetas */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-white shadow-sm animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recetasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {recetas.length === 0
                ? 'Próximamente nuevas recetas para ti.'
                : 'No se encontraron recetas con esos criterios.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recetasFiltradas.map((receta) => (
              <article
                key={receta.id}
                onClick={() => setSelectedReceta(receta)}
                className="group rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer border border-marron/5"
              >
                {/* Imagen */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  {receta.imagen ? (
                    <Image
                      src={receta.imagen}
                      alt={receta.titulo}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-mostaza/10">
                      <ChefHat className="h-12 w-12 text-mostaza/50" />
                    </div>
                  )}
                  {receta.destacado && (
                    <Badge className="absolute top-2 right-2 bg-mostaza text-marron">
                      ★ Destacada
                    </Badge>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {receta.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIA_LABEL[receta.categoria] || receta.categoria}
                      </Badge>
                    )}
                    <Badge className={`text-xs ${DIFICULTAD_COLOR[receta.dificultad] || ''}`}>
                      {DIFICULTAD_LABEL[receta.dificultad] || receta.dificultad}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg text-marron line-clamp-1">
                    {receta.titulo}
                  </h3>
                  {receta.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {receta.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                    {receta.tiempo_preparacion && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Prep: {receta.tiempo_preparacion}
                      </span>
                    )}
                    {receta.tiempo_coccion && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Cocción: {receta.tiempo_coccion}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <Dialog open={!!selectedReceta} onOpenChange={(open) => !open && setSelectedReceta(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedReceta && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-marron">{selectedReceta.titulo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedReceta.imagen && (
                  <div className="relative h-56 rounded-lg overflow-hidden">
                    <Image
                      src={selectedReceta.imagen}
                      alt={selectedReceta.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {selectedReceta.descripcion && (
                  <p className="text-sm text-muted-foreground italic">{selectedReceta.descripcion}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  {selectedReceta.categoria && (
                    <Badge variant="outline">
                      {CATEGORIA_LABEL[selectedReceta.categoria] || selectedReceta.categoria}
                    </Badge>
                  )}
                  <Badge className={DIFICULTAD_COLOR[selectedReceta.dificultad] || ''}>
                    {DIFICULTAD_LABEL[selectedReceta.dificultad] || selectedReceta.dificultad}
                  </Badge>
                  {selectedReceta.tiempo_preparacion && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> Prep: {selectedReceta.tiempo_preparacion}
                    </Badge>
                  )}
                  {selectedReceta.tiempo_coccion && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> Cocción: {selectedReceta.tiempo_coccion}
                    </Badge>
                  )}
                </div>

                {/* Ingredientes */}
                <div>
                  <h3 className="font-bold text-marron mb-2 border-b border-marron/10 pb-1">
                    Ingredientes
                  </h3>
                  <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-lg p-4">
                    {selectedReceta.ingredientes}
                  </pre>
                </div>

                {/* Pasos */}
                <div>
                  <h3 className="font-bold text-marron mb-2 border-b border-marron/10 pb-1">
                    Preparación
                  </h3>
                  <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-lg p-4">
                    {selectedReceta.pasos}
                  </pre>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
