'use client'

/**
 * ============================================================
 * SuperAdmin — Comparativa / Ranking de Admins
 * ============================================================
 * URL: /cm/superadmin/comparativa
 *
 * Shows top 5 admins by sales, productions, and recipes.
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Trophy, Loader2, TrendingUp, Factory, ChefHat, ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { clearCmSession } from '@/lib/cocina-movil/auth-client'

interface RankingEntry {
  ownerId: string
  ownerName: string
  ownerEmail: string
  value: number
  label: string
}

interface Rankings {
  bySales: RankingEntry[]
  byProductions: RankingEntry[]
  byRecipes: RankingEntry[]
}

const fmtCurrency = (v: number) => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

const medalColors = ['bg-[#E1AD01] text-[#1F1611]', 'bg-[#8A7E70] text-[#FFF8E7]', 'bg-[#5C3A21] text-[#FFF8E7]']

export default function ComparativaPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" /></div>}>
      <ComparativaContent />
    </React.Suspense>
  )
}

function ComparativaContent() {
  const router = useRouter()
  const [rankings, setRankings] = React.useState<Rankings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cocina-movil/superadmin/ranking')
        if (res.status === 401) { clearCmSession(); router.push('/login'); return }
        if (!res.ok) throw new Error('HTTP ' + res.status)
        setRankings(await res.json())
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
  if (!rankings) return null

  const sections = [
    { title: 'Top 5 por Ventas', icon: TrendingUp, data: rankings.bySales, format: fmtCurrency, color: 'text-[#708238]' },
    { title: 'Top 5 por Producciones', icon: Factory, data: rankings.byProductions, format: (v: number) => v.toString(), color: 'text-[#5C3A21]' },
    { title: 'Top 5 por Recetas', icon: ChefHat, data: rankings.byRecipes, format: (v: number) => v.toString(), color: 'text-[#B91C1C]' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cm/superadmin/dashboard" className="p-2 rounded-lg hover:bg-[#5C3A21]/8 text-[#5C3A21]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#E1AD01]" />
            Ranking de Admins
          </h1>
          <p className="text-sm text-[#8A7E70]">Comparativa de rendimiento entre Administradores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const SectionIcon = section.icon
          return (
            <Card key={section.title} className="border-[#5C3A21]/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
                  <SectionIcon className={`h-4 w-4 ${section.color}`} />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.data.length === 0 ? (
                  <p className="text-sm text-[#8A7E70] text-center py-4">Sin datos</p>
                ) : (
                  section.data.map((entry, i) => (
                    <Link
                      key={entry.ownerId}
                      href={`/cm/superadmin/admins/${entry.ownerId}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#FBF1DC]/50 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i < 3 ? medalColors[i] : 'bg-[#5C3A21]/8 text-[#5C3A21]'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#5C3A21] truncate">{entry.ownerName}</p>
                        <p className="text-[10px] text-[#8A7E70] truncate">{entry.ownerEmail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${section.color}`}>{section.format(entry.value)}</p>
                        <p className="text-[9px] text-[#8A7E70]">{entry.label}</p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
