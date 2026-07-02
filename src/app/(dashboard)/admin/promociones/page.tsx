'use client'

import { Tag } from 'lucide-react'
import PromocionesManager from '@/components/admin/PromocionesManager'

export default function PromocionesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <Tag className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Promociones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las promociones y descuentos para tus productos
          </p>
        </div>
      </div>

      <PromocionesManager />
    </div>
  )
}
