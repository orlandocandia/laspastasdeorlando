'use client'

import { Layers } from 'lucide-react'
import DescuentosVolumenManager from '@/components/admin/DescuentosVolumenManager'

export default function DescuentosVolumenPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <Layers className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Descuentos por Volumen</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los descuentos escalonados por cantidad para ventas mayoristas
          </p>
        </div>
      </div>
      <DescuentosVolumenManager />
    </div>
  )
}
