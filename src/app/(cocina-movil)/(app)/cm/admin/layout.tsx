/**
 * ============================================================
 * Layout — Dashboard de la Cocina Móvil (rutas autenticadas)
 * ============================================================
 * Envuelve todas las páginas bajo /cm/admin/* con:
 *  - Sidebar de navegación (módulos)
 *  - Header con logo + usuario + logout
 *  - Área central para el contenido
 * ============================================================
 */
import type { Metadata } from 'next'
import CmAdminShell from '@/components/(cocina-movil)/admin/admin-shell'

export const metadata: Metadata = {
  title: 'Dashboard — Cocina Móvil',
  description: 'Panel de administración de la Cocina Móvil',
  robots: { index: false, follow: false },
}

export default function CmAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CmAdminShell>{children}</CmAdminShell>
}
