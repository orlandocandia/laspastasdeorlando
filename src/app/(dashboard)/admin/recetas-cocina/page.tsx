'use client'

import { Utensils } from 'lucide-react'
import RecetasCocinaTable from '@/components/admin/RecetasCocinaTable'

export default function RecetasCocinaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <Utensils className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Recetas de Cocina</h1>
          <p className="text-sm text-muted-foreground">
            Recetas independientes para mostrar en la landing page y exportar
          </p>
        </div>
      </div>

      <RecetasCocinaTable />
    </div>
  )
}
