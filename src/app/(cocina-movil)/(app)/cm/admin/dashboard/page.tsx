'use client'

/**
 * ============================================================
 * Dashboard del Administrador — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/dashboard
 *
 * Muestra:
 *  - KPIs: Total usuarios, recetas, producciones, lugar más activo
 *  - Acciones rápidas: Nuevo Usuario, Ver Usuarios
 *  - Lista de usuarios recientes (mini preview)
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { Users, ChefHat, Factory, MapPin, Plus, ArrowRight, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface KpiData {
  totalUsers: number
  totalRecetas: number
  totalProducciones: number
  lugarMasActivo: string
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    lastLoginAt: number | null
  }>
}

export default function CmAdminDashboardPage() {
  const [data, setData] = React.useState<KpiData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cocina-movil/users?page=1&pageSize=5')
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const json = await res.json()
        setData({
          totalUsers: json.total || 0,
          totalRecetas: 0,
          totalProducciones: 0,
          lugarMasActivo: 'Sin datos',
          users: json.users || [],
        })
      } catch (err) {
        console.error('[CmDashboard] Error loading KPIs:', err)
        setData({
          totalUsers: 0,
          totalRecetas: 0,
          totalProducciones: 0,
          lugarMasActivo: 'Sin datos',
          users: [],
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpis = [
    {
      label: 'Total de Usuarios',
      value: data?.totalUsers ?? '—',
      icon: Users,
      color: 'bg-[#5C3A21] text-[#FFF8E7]',
      iconBg: 'bg-[#E1AD01]/20 text-[#E1AD01]',
    },
    {
      label: 'Total de Recetas',
      value: data?.totalRecetas ?? '—',
      icon: ChefHat,
      color: 'bg-[#708238]/10 text-[#708238]',
      iconBg: 'bg-[#708238]/20 text-[#708238]',
    },
    {
      label: 'Total de Producciones',
      value: data?.totalProducciones ?? '—',
      icon: Factory,
      color: 'bg-[#E1AD01]/10 text-[#7a5c00]',
      iconBg: 'bg-[#E1AD01]/20 text-[#7a5c00]',
    },
    {
      label: 'Lugar más activo',
      value: data?.lugarMasActivo ?? '—',
      icon: MapPin,
      color: 'bg-[#B91C1C]/10 text-[#B91C1C]',
      iconBg: 'bg-[#B91C1C]/20 text-[#B91C1C]',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E1AD01] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21]">Dashboard</h1>
          <p className="text-sm text-[#8A7E70]">
            Resumen general de la Cocina Móvil
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
            <Link href="/cm/admin/users">
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <Link href="/cm/admin/users">
              <Users className="h-4 w-4" />
              Ver Usuarios
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-[#5C3A21]/10 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#5C3A21]">{kpi.value}</p>
                  <p className="text-xs text-[#8A7E70] mt-0.5">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Acciones rápidas */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Acciones rápidas
          </CardTitle>
          <CardDescription className="text-xs">
            Atajos a las tareas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href="/cm/admin/users?action=new"
            className="flex items-center justify-between p-4 rounded-lg border border-[#5C3A21]/10 bg-[#FFF8E7] hover:bg-[#FBF1DC] hover:border-[#E1AD01]/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#E1AD01]/15 flex items-center justify-center text-[#7a5c00]">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5C3A21]">Nuevo Usuario</p>
                <p className="text-xs text-[#8A7E70]">Crear un cocinero o admin</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#8A7E70] group-hover:text-[#5C3A21] group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/cm/admin/users"
            className="flex items-center justify-between p-4 rounded-lg border border-[#5C3A21]/10 bg-[#FFF8E7] hover:bg-[#FBF1DC] hover:border-[#E1AD01]/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#5C3A21]/10 flex items-center justify-center text-[#5C3A21]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5C3A21]">Ver Usuarios</p>
                <p className="text-xs text-[#8A7E70]">Listado completo con filtros</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#8A7E70] group-hover:text-[#5C3A21] group-hover:translate-x-0.5 transition-all" />
          </Link>

          <div className="flex items-center justify-between p-4 rounded-lg border border-[#5C3A21]/10 bg-[#FFF8E7]/50 opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#8A7E70]/15 flex items-center justify-center text-[#8A7E70]">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5C3A21]">Nueva Receta</p>
                <p className="text-xs text-[#8A7E70]">Próximamente</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usuarios recientes */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-[#5C3A21]">Usuarios recientes</CardTitle>
              <CardDescription className="text-xs">
                Últimos {data?.users.length || 0} usuarios registrados
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-[#5C3A21]">
              <Link href="/cm/admin/users">
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.users.length === 0 ? (
            <p className="text-sm text-[#8A7E70] text-center py-6">
              No hay usuarios registrados.
            </p>
          ) : (
            <div className="space-y-2">
              {data?.users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#5C3A21]/8 bg-[#FFF8E7]/50 hover:bg-[#FBF1DC] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-sm font-bold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#5C3A21] truncate">{u.name}</p>
                      <p className="text-xs text-[#8A7E70] truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize border-[#5C3A21]/20"
                    >
                      {u.role}
                    </Badge>
                    <Badge
                      className={
                        u.isActive
                          ? 'text-[10px] bg-[#708238] hover:bg-[#708238]'
                          : 'text-[10px] bg-[#8A7E70] hover:bg-[#8A7E70]'
                      }
                    >
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
