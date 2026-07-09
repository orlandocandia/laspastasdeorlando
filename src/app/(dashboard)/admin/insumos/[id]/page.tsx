'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import InsumoForm from '@/components/admin/InsumoForm'
import FichaPrintMenu from '@/components/admin/FichaPrintMenu'
import FichaInsumoDocument, { type FichaInsumoData } from '@/components/print/FichaInsumoPDFDocument'

export default function InsumoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [insumo, setInsumo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id === 'nuevo') {
      setLoading(false)
      return
    }

    async function fetchInsumo() {
      try {
        const res = await fetch(`/api/insumos/${params.id}`)
        if (!res.ok) throw new Error('No encontrado')
        const data = await res.json()
        setInsumo(data)
      } catch {
        router.push('/admin/insumos')
      } finally {
        setLoading(false)
      }
    }

    fetchInsumo()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/insumos">
          <Button variant="ghost" size="icon" className="hover:bg-mostaza/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-marron">
            {insumo ? `Editar: ${insumo.nombre}` : 'Nuevo Insumo'}
          </h1>
        </div>
        {insumo ? (
          <div className="ml-auto">
            <FichaPrintMenu<FichaInsumoData>
              data={insumo}
              DocumentComponent={FichaInsumoDocument}
              filename={`ficha-insumo-${insumo.id}`}
              label="Ficha de Insumo"
              size="sm"
            />
          </div>
        ) : null}
      </div>

      <InsumoForm
        insumo={insumo}
        onSuccess={() => router.push('/admin/insumos')}
      />
    </div>
  )
}
