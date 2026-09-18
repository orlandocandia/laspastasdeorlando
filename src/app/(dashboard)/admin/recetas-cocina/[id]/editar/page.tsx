'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Utensils, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecetaCocinaForm from '@/components/admin/RecetaCocinaForm'

interface RecetaCocina {
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
  visible_en_landing: boolean
  destacado: boolean
}

export default function EditarRecetaCocinaPage() {
  const router = useRouter()
  const params = useParams()
  const [receta, setReceta] = useState<RecetaCocina | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/recetas-cocina/${params.id}`)
        .then((r) => {
          if (!r.ok) throw new Error('No encontrada')
          return r.json()
        })
        .then((data) => setReceta(data))
        .catch(() => {
          router.push('/admin/recetas-cocina')
        })
        .finally(() => setLoading(false))
    }
  }, [params, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  if (!receta) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/recetas-cocina')}
          className="hover:bg-mostaza/10"
        >
          <ArrowLeft className="h-5 w-5 text-marron" />
        </Button>
        <div className="rounded-lg bg-mostaza/10 p-2">
          <Utensils className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Editar Receta</h1>
          <p className="text-sm text-muted-foreground">{receta.titulo}</p>
        </div>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card p-6">
        <RecetaCocinaForm receta={receta} />
      </div>
    </div>
  )
}
