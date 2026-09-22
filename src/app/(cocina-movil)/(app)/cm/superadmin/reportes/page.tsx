'use client'

/**
 * ============================================================
 * SuperAdmin — Reportes Globales
 * ============================================================
 * URL: /cm/superadmin/reportes
 *
 * Shows a global report with totals per admin and
 * export buttons (PDF, Word, Excel — placeholder for now,
 * returns the data as downloadable JSON/CSV).
 * ============================================================
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Loader2, ArrowLeft, Download, FileSpreadsheet, FileDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { clearCmSession } from '@/lib/cocina-movil/auth-client'

interface AdminReport {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  stats: {
    places: number
    ingredients: number
    supplies: number
    suppliers: number
    recipes: number
    productions: number
    budgets: number
    sales: number
    salesAmount: number
    salesProfit: number
    purchases: number
    purchasesAmount: number
    clients: number
  }
}

interface ReportData {
  admins: AdminReport[]
  totals: AdminReport['stats']
}

const fmtCurrency = (v: number) => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

export default function ReportesPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <ReportesContent />
    </React.Suspense>
  )
}

function ReportesContent() {
  const router = useRouter()
  const [data, setData] = React.useState<ReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cocina-movil/superadmin/reportes')
        if (res.status === 401) { clearCmSession(); router.push('/login'); return }
        if (!res.ok) throw new Error('HTTP ' + res.status)
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>
  if (error) return <div className="py-20 text-center"><p className="text-sm text-[#B91C1C]">{error}</p></div>
  if (!data) return null

  const exportCSV = () => {
    const headers = ['Admin', 'Email', 'Rol', 'Ventas', 'Monto Ventas', 'Ganancia', 'Producciones', 'Recetas', 'Compras', 'Clientes']
    const rows = data.admins.map((a) => [a.name, a.email, a.role, a.stats.sales, a.stats.salesAmount, a.stats.salesProfit, a.stats.productions, a.stats.recipes, a.stats.purchases, a.stats.clients])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-global-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Reporte CSV exportado')
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-global-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Reporte JSON exportado')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/cm/superadmin/dashboard" className="p-2 rounded-lg hover:bg-[#5C3A21]/8 text-[#5C3A21]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#5C3A21]">Reportes Globales</h1>
            <p className="text-sm text-[#8A7E70]">Estadísticas de todos los Admins</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <FileSpreadsheet className="h-4 w-4" /> Excel/CSV
          </Button>
          <Button onClick={exportJSON} variant="outline" size="sm" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <FileDown className="h-4 w-4" /> JSON
          </Button>
        </div>
      </div>

      {/* Totals card */}
      <Card className="border-[#5C3A21]/10 shadow-sm bg-[#FBF1DC]/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21]">Totales Globales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div><p className="text-lg font-bold text-[#5C3A21]">{data.totals.sales}</p><p className="text-[10px] text-[#8A7E70]">Ventas</p></div>
          <div><p className="text-lg font-bold text-[#708238]">{fmtCurrency(data.totals.salesAmount)}</p><p className="text-[10px] text-[#8A7E70]">Monto</p></div>
          <div><p className="text-lg font-bold text-[#708238]">{fmtCurrency(data.totals.salesProfit)}</p><p className="text-[10px] text-[#8A7E70]">Ganancia</p></div>
          <div><p className="text-lg font-bold text-[#5C3A21]">{data.totals.productions}</p><p className="text-[10px] text-[#8A7E70]">Producciones</p></div>
          <div><p className="text-lg font-bold text-[#5C3A21]">{data.totals.recipes}</p><p className="text-[10px] text-[#8A7E70]">Recetas</p></div>
          <div><p className="text-lg font-bold text-[#5C3A21]">{data.totals.clients}</p><p className="text-[10px] text-[#8A7E70]">Clientes</p></div>
        </CardContent>
      </Card>

      {/* Per-admin table */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21]">Detalle por Admin</CardTitle>
          <CardDescription className="text-xs">Datos de cada Administrador</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                <TableHead>Admin</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Rol</TableHead>
                <TableHead className="text-center">Ventas</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right hidden md:table-cell">Ganancia</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Producc.</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Recetas</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Clientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.admins.map((a) => (
                <TableRow key={a.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                  <TableCell>
                    <Link href={`/cm/superadmin/admins/${a.id}`} className="text-sm font-medium text-[#5C3A21] hover:underline">
                      {a.name}
                    </Link>
                    <p className="text-[10px] text-[#8A7E70]">{a.email}</p>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <span className="text-[10px] capitalize">{a.role}</span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-[#4A3F36]">{a.stats.sales}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-[#5C3A21] whitespace-nowrap">{fmtCurrency(a.stats.salesAmount)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-[#708238] whitespace-nowrap hidden md:table-cell">{fmtCurrency(a.stats.salesProfit)}</TableCell>
                  <TableCell className="text-center text-sm text-[#4A3F36] hidden lg:table-cell">{a.stats.productions}</TableCell>
                  <TableCell className="text-center text-sm text-[#4A3F36] hidden lg:table-cell">{a.stats.recipes}</TableCell>
                  <TableCell className="text-center text-sm text-[#4A3F36] hidden sm:table-cell">{a.stats.clients}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
