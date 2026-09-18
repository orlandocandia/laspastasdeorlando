/**
 * ============================================================
 * Layout — SuperAdmin routes (/cm/superadmin/*)
 * ============================================================
 * Reuses CmAdminShell so the SuperAdmin gets the same sidebar
 * navigation. The role guard is enforced at the API layer
 * (requireSuperAdmin) and at the page level.
 * ============================================================
 */
import CmAdminShell from '@/components/(cocina-movil)/admin/admin-shell'

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <CmAdminShell>{children}</CmAdminShell>
}
