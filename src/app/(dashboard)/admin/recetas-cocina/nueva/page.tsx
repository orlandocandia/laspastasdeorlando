'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecetaCocinaForm from '@/components/admin/RecetaCocinaForm'

export default function NuevaRecetaCocinaPage() {
  const router = useRouter()

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
          <h1 className="text-2xl font-bold text-marron">Nueva Receta de Cocina</h1>
          <p className="text-sm text-muted-foreground">Crea una nueva receta independiente</p>
        </div>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card p-6">
        <RecetaCocinaForm />
      </div>
    </div>
  )
}
