'use client'

/**
 * ============================================================
 * Cocina Móvil — Owner Selector (SuperAdmin only)
 * ============================================================
 * Dropdown que aparece en cada página de listado del Admin.
 * Solo se renderiza para SuperAdmin.
 *
 * - "Todos los dueños" → ver datos de todos los Admins
 * - Cada Admin por nombre → ver solo los datos de ese Admin
 *
 * La selección persiste en localStorage (via useOwnerFilter)
 * para que se mantenga al navegar entre páginas.
 * ============================================================
 */

import * as React from 'react'
import { Users } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useOwnerFilter } from '@/lib/cocina-movil/owner-filter'

export default function OwnerSelector() {
  const { isSuperadmin, selectedOwner, setSelectedOwner, owners } = useOwnerFilter()

  if (!isSuperadmin) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-[#8A7E70]">
        <Users className="h-3.5 w-3.5" />
        <span>Ver datos de:</span>
      </div>
      <Select value={selectedOwner} onValueChange={setSelectedOwner}>
        <SelectTrigger className="h-8 text-xs border-[#5C3A21]/15 bg-white w-48 sm:w-64">
          <SelectValue placeholder="Todos los dueños" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los dueños</SelectItem>
          {owners.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
              {o.role === 'superadmin' ? ' (SuperAdmin)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
