/**
 * ============================================================
 * Cocina Móvil — Owner Filter Hook (client-side)
 * ============================================================
 * Hook reutilizable para el modelo multi-tenant:
 *  - Detecta si el usuario actual es SuperAdmin.
 *  - Si lo es, carga la lista de dueños (admins + superadmin).
 *  - Mantiene el "dueño seleccionado" en localStorage para que
 *    persista al navegar entre páginas.
 *  - Expone `ownerNameById()` para resolver ownerId → nombre.
 * ============================================================
 */
'use client'

import * as React from 'react'
import { getCmUserFromStorage } from '@/lib/cocina-movil/auth-client'

export interface OwnerInfo {
  id: string
  name: string
  role: string
}

const STORAGE_KEY = 'cm_owner_filter'

// Module-level cache for owners (shared across all useOwnerFilter calls)
let _ownersCache: OwnerInfo[] | null = null
let _ownersPromise: Promise<OwnerInfo[]> | null = null

async function fetchOwners(): Promise<OwnerInfo[]> {
  if (_ownersCache) return _ownersCache
  if (_ownersPromise) return _ownersPromise
  _ownersPromise = (async () => {
    try {
      const res = await fetch('/api/cocina-movil/users?pageSize=200')
      if (!res.ok) return []
      const data = await res.json()
      _ownersCache = (data.users || [])
        .filter((u: { role: string }) => u.role === 'admin' || u.role === 'superadmin')
        .map((u: { id: string; firstName: string; lastName: string; role: string }) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          role: u.role,
        }))
      return _ownersCache
    } catch {
      return []
    } finally {
      _ownersPromise = null
    }
  })()
  return _ownersPromise
}

export interface OwnerFilterResult {
  isSuperadmin: boolean
  selectedOwner: string // 'all' or a user id
  setSelectedOwner: (ownerId: string) => void
  owners: OwnerInfo[]
  ownerNameById: (id: string) => string
}

export function useOwnerFilter(): OwnerFilterResult {
  const [isSuperadmin, setIsSuperadmin] = React.useState(false)
  const [selectedOwner, setSelectedOwnerState] = React.useState<string>('all')
  const [owners, setOwners] = React.useState<OwnerInfo[]>([])

  React.useEffect(() => {
    const u = getCmUserFromStorage()
    if (!u) return
    const isSA = u.role === 'superadmin'
    setIsSuperadmin(isSA)
    if (isSA) {
      // Load persisted selection
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setSelectedOwnerState(stored)
      } catch {
        // ignore
      }
      // Fetch owners
      fetchOwners().then(setOwners)
    }
  }, [])

  const setSelectedOwner = React.useCallback((ownerId: string) => {
    setSelectedOwnerState(ownerId)
    try {
      localStorage.setItem(STORAGE_KEY, ownerId)
    } catch {
      // ignore
    }
  }, [])

  const ownerNameById = React.useCallback(
    (id: string): string => {
      if (!id) return '—'
      const owner = owners.find((o) => o.id === id)
      return owner ? owner.name : id
    },
    [owners]
  )

  return { isSuperadmin, selectedOwner, setSelectedOwner, owners, ownerNameById }
}

/**
 * Builds the `&ownerId=X` query string suffix for fetch URLs.
 * Returns empty string when ownerId is 'all' (no filter).
 */
export function ownerQueryParam(ownerId: string): string {
  if (ownerId === 'all') return ''
  return `&ownerId=${encodeURIComponent(ownerId)}`
}
