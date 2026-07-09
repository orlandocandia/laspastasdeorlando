'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import MateriaPrimaForm from '@/components/admin/MateriaPrimaForm'
import FichaPrintMenu from '@/components/admin/FichaPrintMenu'
import FichaMateriaPrimaPDFDocument, { type FichaMateriaPrimaData } from '@/components/print/FichaMateriaPrimaPDFDocument'

export default function MateriaPrimaDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [materiaPrima, setMateriaPrima] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id === 'nueva') {
      setLoading(false)
      return
    }

    async function fetchMateriaPrima() {
      try {
        const res = await fetch(`/api/materias-primas/${params.id}`)
        if (!res.ok) throw new Error('No encontrada')
        const data = await res.json()
        setMateriaPrima(data)
      } catch {
        router.push('/admin/materias-primas')
      } finally {
        setLoading(false)
      }
    }

    fetchMateriaPrima()
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
        <Link href="/admin/materias-primas">
          <Button variant="ghost" size="icon" className="hover:bg-mostaza/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-marron">
            {materiaPrima ? `Editar: ${materiaPrima.nombre}` : 'Nueva Materia Prima'}
          </h1>
        </div>
        {materiaPrima && (
          <FichaPrintMenu<FichaMateriaPrimaData>
            data={{
              id: materiaPrima.id,
              codigo: materiaPrima.codigo ?? null,
              nombre: materiaPrima.nombre,
              descripcion: materiaPrima.descripcion ?? null,
              id_categoria: materiaPrima.id_categoria,
              id_unidad_base: materiaPrima.id_unidad_base,
              stock_actual: materiaPrima.stock_actual ?? 0,
              stock_minimo: materiaPrima.stock_minimo ?? 0,
              precio_compra_referencia: materiaPrima.precio_compra_referencia ?? 0,
              imagen: materiaPrima.imagen ?? null,
              estado: materiaPrima.estado ?? true,
              categoria: materiaPrima.categoria ?? null,
              unidadBase: materiaPrima.unidadBase ?? null,
            }}
            DocumentComponent={FichaMateriaPrimaPDFDocument}
            filename={`ficha-materia-prima-${materiaPrima.codigo || materiaPrima.id}`}
            label="Ficha de Materia Prima"
            size="sm"
          />
        )}
      </div>

      <MateriaPrimaForm
        materiaPrima={materiaPrima}
        onSuccess={() => router.push('/admin/materias-primas')}
      />
    </div>
  )
}
