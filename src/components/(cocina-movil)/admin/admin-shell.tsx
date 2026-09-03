'use client'

/**
 * ============================================================
 * Cocina Móvil — Admin Shell (Sidebar + Header)
 * ============================================================
 * Componente cliente que renderiza:
 *  - Sidebar fijo a la izquierda con navegación a módulos
 *  - Header superior con logo, nombre de usuario, botón logout
 *  - Área central donde se renderiza el children (página actual)
 *
 * El sidebar es responsive:
 *  - Desktop (md+): sidebar fijo visible
 *  - Mobile: sidebar colapsable (toggle con botón hamburguesa)
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  MapPin,
  Package,
  FlaskConical,
  ChefHat,
  Factory,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logoutCm, getCmUserFromStorage, type CmUser } from '@/lib/cocina-movil/auth-client'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  enabled: boolean
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/cm/admin/dashboard', icon: LayoutDashboard, enabled: true },
  { title: 'Usuarios', href: '/cm/admin/users', icon: Users, enabled: true },
  { title: 'Lugares', href: '/cm/admin/lugares', icon: MapPin, enabled: true },
  { title: 'Materias Primas', href: '/cm/admin/materias-primas', icon: Package, enabled: false },
  { title: 'Insumos', href: '/cm/admin/insumos', icon: FlaskConical, enabled: false },
  { title: 'Recetas', href: '/cm/admin/recetas', icon: ChefHat, enabled: false },
  { title: 'Producciones', href: '/cm/admin/producciones', icon: Factory, enabled: false },
  { title: 'Presupuestos', href: '/cm/admin/presupuestos', icon: FileText, enabled: false },
]

export default function CmAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<CmUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const u = getCmUserFromStorage()
    if (!u) {
      // No hay sesión → redirect a login
      router.push('/login')
      return
    }
    setUser(u)
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    await logoutCm()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8E7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E1AD01] border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-[#8A7E70]">Cargando dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8E7]">
      {/* ====== Header ====== */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#5C3A21]/15 bg-[#5C3A21] text-[#FFF8E7] px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="md:hidden p-1.5 rounded hover:bg-[#FFF8E7]/10"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link href="/cm/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg overflow-hidden bg-[#FFF8E7] ring-1 ring-[#E1AD01]/40">
              <Image
                src="/images/(cocina-movil)/logo.png"
                alt="Cocina Móvil"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight text-[#E1AD01]">COCINA MÓVIL</div>
              <div className="text-[10px] leading-tight text-[#FFF8E7]/60 italic">
                El Amigo de las Pastas
              </div>
            </div>
          </Link>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-[#FFF8E7]">{user?.name}</div>
            <div className="text-[10px] text-[#FFF8E7]/60 capitalize">{user?.role}</div>
          </div>
          <Link
            href="/cm/profile"
            className="h-8 w-8 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-sm font-bold ring-2 ring-[#FFF8E7]/20 hover:ring-[#FFF8E7]/40 transition-all overflow-hidden"
            title="Mi Perfil"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name || 'Perfil'} className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || '?'
            )}
          </Link>
          <Button
            onClick={handleLogout}
            size="icon"
            variant="ghost"
            className="text-[#FFF8E7] hover:bg-[#FFF8E7]/10 hover:text-[#E1AD01]"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ====== Body: Sidebar + Main ====== */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={cn(
            'fixed md:sticky top-0 md:top-[57px] left-0 z-40 md:z-auto h-full md:h-[calc(100vh-57px)] w-64 shrink-0 border-r border-[#5C3A21]/15 bg-[#FBF1DC] transition-transform duration-200',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          <nav className="p-3 space-y-1 overflow-y-auto h-full">
            <div className="px-2 py-2 mb-1">
              <p className="text-[10px] font-bold text-[#8A7E70] uppercase tracking-wider">
                Módulos
              </p>
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <div key={item.href}>
                  {item.enabled ? (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[#5C3A21] text-[#FFF8E7] shadow-sm'
                          : 'text-[#5C3A21] hover:bg-[#5C3A21]/8'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {isActive && <ChevronRight className="h-3 w-3" />}
                    </Link>
                  ) : (
                    <div
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#8A7E70]/50 cursor-not-allowed"
                      title="Próximamente"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      <span className="text-[9px] uppercase bg-[#5C3A21]/8 px-1.5 py-0.5 rounded">
                        Soon
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Profile link */}
          <div className="px-2 pt-2 mt-2 border-t border-[#5C3A21]/10">
            <Link
              href="/cm/profile"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === '/cm/profile'
                  ? 'bg-[#5C3A21] text-[#FFF8E7]'
                  : 'text-[#5C3A21] hover:bg-[#5C3A21]/8'
              )}
            >
              <UserCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">Mi Perfil</span>
            </Link>
          </div>

          {/* Footer del sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[#5C3A21]/10 bg-[#F3E8D0]">
            <p className="text-[10px] text-[#8A7E70] text-center italic">
              Pastas artesanales con sabor a tradición
            </p>
            <p className="text-[9px] text-[#8A7E70]/60 text-center mt-0.5">
              Posadas · Misiones
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
