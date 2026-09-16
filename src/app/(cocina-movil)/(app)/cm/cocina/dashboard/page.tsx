'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChefHat, Factory, TrendingUp, Package, Plus, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCmUserFromStorage } from '@/lib/cocina-movil/auth-client'

const fmtCurrency = (v: number) => `$${Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
const fmtDate = (ts: number) => { const d = new Date(ts); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` }

const STATUS_META: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-[#8A7E70]' },
  en_proceso: { label: 'En Proceso', color: 'bg-[#E1AD01]' },
  finalizado: { label: 'Finalizado', color: 'bg-[#708238]' },
  cancelado: { label: 'Cancelado', color: 'bg-[#B91C1C]' },
}

export default function CookDashboardPage() {
  const [user, setUser] = React.useState<{ firstName?: string; role?: string } | null>(null)
  const [stats, setStats] = React.useState({ recipes: 0, productionsToday: 0, estimatedProfit: 0, lowStock: 0 })
  const [recentProductions, setRecentProductions] = React.useState<Array<{ id: string; recipeTitle: string; placeName: string; quantity: number; cost: number; status: string; productionDate: number }>>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const u = getCmUserFromStorage()
    setUser(u)
    // Fetch dashboard data
    Promise.all([
      fetch('/api/cocina-movil/recipes?isActive=true&pageSize=200').then(r => r.json()).catch(() => ({})),
      fetch('/api/cocina-movil/productions?pageSize=5&sortBy=productionDate&sortOrder=desc').then(r => r.json()).catch(() => ({})),
      fetch('/api/cocina-movil/ingredients?isActive=true&pageSize=200').then(r => r.json()).catch(() => ({})),
      fetch('/api/cocina-movil/supplies?isActive=true&pageSize=200').then(r => r.json()).catch(() => ({})),
    ]).then(([rData, pData, iData, sData]) => {
      const recipes = rData.recipes || []
      const productions = pData.productions || []
      const today = new Date(); today.setHours(0,0,0,0)
      const todayMs = today.getTime()
      const todayProductions = productions.filter((p: { productionDate: number }) => p.productionDate >= todayMs)
      const profit = todayProductions.reduce((sum: number, p: { cost: number }) => sum + (p.cost || 0), 0)
      const lowStockItems = [
        ...(iData.ingredients || []).filter((i: { gramsPerUnit: number | null }) => !i.gramsPerUnit || i.gramsPerUnit < 500),
        ...(sData.supplies || []).filter((s: { purchasePrice: number }) => s.purchasePrice < 100),
      ]
      setStats({ recipes: recipes.length, productionsToday: todayProductions.length, estimatedProfit: profit, lowStock: lowStockItems.length })
      setRecentProductions(productions.slice(0, 5))
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E1AD01] border-t-transparent" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#5C3A21]">¡Hola, {user?.firstName || 'Cocinero'}! 👨‍🍳</h1>
        <p className="text-sm text-[#8A7E70]">Bienvenido a tu panel de trabajo.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#E1AD01]/10 flex items-center justify-center"><ChefHat className="h-6 w-6 text-[#E1AD01]" /></div>
            <div><p className="text-xs text-[#8A7E70]">Mis Recetas</p><p className="text-2xl font-bold text-[#5C3A21]">{stats.recipes}</p></div>
          </CardContent>
        </Card>
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#708238]/10 flex items-center justify-center"><Factory className="h-6 w-6 text-[#708238]" /></div>
            <div><p className="text-xs text-[#8A7E70]">Producciones Hoy</p><p className="text-2xl font-bold text-[#5C3A21]">{stats.productionsToday}</p></div>
          </CardContent>
        </Card>
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#5C3A21]/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-[#5C3A21]" /></div>
            <div><p className="text-xs text-[#8A7E70]">Producción Hoy</p><p className="text-2xl font-bold text-[#5C3A21]">{fmtCurrency(stats.estimatedProfit)}</p></div>
          </CardContent>
        </Card>
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#B91C1C]/10 flex items-center justify-center"><Package className="h-6 w-6 text-[#B91C1C]" /></div>
            <div><p className="text-xs text-[#8A7E70]">Stock Crítico</p><p className="text-2xl font-bold text-[#5C3A21]">{stats.lowStock}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Recent productions */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-[#5C3A21]/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2"><Factory className="h-4 w-4" />Últimas Producciones</h3>
            <Link href="/cm/cocina/producciones" className="text-xs text-[#E1AD01] hover:underline flex items-center gap-1"><Eye className="h-3 w-3" />Ver todas</Link>
          </div>
          {recentProductions.length === 0 ? (
            <p className="text-sm text-[#8A7E70] text-center py-8">No hay producciones registradas.</p>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                <TableHead>Fecha</TableHead><TableHead>Receta</TableHead><TableHead className="hidden md:table-cell">Lugar</TableHead>
                <TableHead className="text-center">Cant.</TableHead><TableHead className="text-right">Costo</TableHead><TableHead className="text-center">Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {recentProductions.map((p) => {
                  const meta = STATUS_META[p.status] || { label: p.status, color: 'bg-gray-500' }
                  return (
                    <TableRow key={p.id} className="border-[#5C3A21]/8">
                      <TableCell className="text-sm text-[#4A3F36] whitespace-nowrap">{fmtDate(p.productionDate)}</TableCell>
                      <TableCell className="text-sm font-medium text-[#5C3A21]">{p.recipeTitle}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{p.placeName}</TableCell>
                      <TableCell className="text-center text-sm text-[#4A3F36]">{p.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-[#5C3A21]">{fmtCurrency(p.cost)}</TableCell>
                      <TableCell className="text-center"><Badge className={`text-[10px] ${meta.color} text-white`}>{meta.label}</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
