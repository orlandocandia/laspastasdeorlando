'use client'

/**
 * ============================================================
 * Cocina Móvil — Cook Shell (Sidebar + Header)
 * ============================================================
 * Layout para el rol Cocinero. Similar al AdminShell pero con
 * menú reducido: Dashboard, Recetas, Producciones, Lugares,
 * Stock, Perfil.
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, ChefHat, Factory, MapPin, Package,
  UserCircle, LogOut, Menu, X,
} from 'lucide-react'
import { logoutCm, getCmUserFromStorage, type CmUser } from '@/lib/cocina-movil/auth-client'
import { cn } from '@/lib/utils'

interface NavItem { title: string; href: string; icon: React.ElementType }

const NAV_ITEMS: NavItem[] = [
  { title: 'Mi Dashboard', href: '/cm/cocina/dashboard', icon: LayoutDashboard },
  { title: 'Mis Recetas', href: '/cm/cocina/recetas', icon: ChefHat },
  { title: 'Mis Producciones', href: '/cm/cocina/producciones', icon: Factory },
  { title: 'Mis Lugares', href: '/cm/cocina/lugares', icon: MapPin },
  { title: 'Consultar Stock', href: '/cm/cocina/stock', icon: Package },
  { title: 'Mi Perfil', href: '/cm/cocina/perfil', icon: UserCircle },
]

export default function CmCookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<CmUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const u = getCmUserFromStorage()
    if (!u) { router.push('/login'); return }
    // Role guard: only cocinero can access /cm/cocina/*.
    // Redirect admin/supervisor to their own dashboards to avoid
    // accidental cross-role rendering (mirrors admin-shell pattern).
    if (u.role === 'admin') {
      router.push('/cm/admin/dashboard')
      return
    }
    if (u.role !== 'cocinero') {
      // supervisor or unknown role → send to fallback dashboard
      router.push('/cm/dashboard')
      return
    }
    setUser(u)
    setLoading(false)
  }, [router])

  const handleLogout = async () => { await logoutCm(); router.push('/login') }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8E7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E1AD01] border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-[#8A7E70]">Cargando…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8E7]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#5C3A21]/15 bg-[#5C3A21] text-[#FFF8E7] px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen((s) => !s)} className="md:hidden p-1.5 rounded hover:bg-[#FFF8E7]/10" aria-label="Toggle sidebar">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/cm/cocina/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg overflow-hidden bg-[#FFF8E7] ring-1 ring-[#E1AD01]/40">
              <Image src="/images/(cocina-movil)/logo.png" alt="Cocina Móvil" width={36} height={36} className="h-full w-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight text-[#E1AD01]">COCINA MÓVIL</div>
              <div className="text-[10px] leading-tight text-[#FFF8E7]/60 italic">El Amigo de las Pastas</div>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cm/cocina/perfil" className="flex items-center gap-2 text-sm hover:text-[#E1AD01] transition-colors">
            <UserCircle className="h-5 w-5" />
            <span className="hidden sm:inline">{user?.firstName || 'Cocinero'}</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm hover:text-[#E1AD01] transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          'fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#FBF1DC] border-r border-[#5C3A21]/15 flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 pt-4">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (pathname.startsWith(item.href + '/'))
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active ? 'bg-[#5C3A21] text-[#FFF8E7]' : 'text-[#5C3A21] hover:bg-[#5C3A21]/8'
                  )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
          <div className="p-3 border-t border-[#5C3A21]/10">
            <p className="text-xs text-[#8A7E70] text-center">Cocina Móvil v1.0</p>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
