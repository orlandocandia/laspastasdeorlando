'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Utensils, Loader2, FileText, FileType2, FileDown,
  Printer, Pencil, Clock, ChefHat, Tag,
} from 'lucide-react'
import { pdf } from '@react-pdf/renderer'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RecetaCocinaPDFDocument } from '@/components/print/RecetaCocinaPDFDocument'
import { exportRecetaToWord, exportRecetaToTxt, type RecetaCocinaExportData } from '@/lib/receta-cocina-export'

interface RecetaCocina {
  id: number
  titulo: string
  descripcion: string | null
  ingredientes: string
  pasos: string
  tiempo_preparacion: string | null
  tiempo_coccion: string | null
  dificultad: string
  imagen: string | null
  categoria: string | null
  visible_en_landing: boolean
  destacado: boolean
  createdAt: string
}

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: 'Fácil', media: 'Media', dificil: 'Difícil',
}
const DIFICULTAD_BADGE: Record<string, string> = {
  facil: 'bg-oliva/15 text-oliva',
  media: 'bg-mostaza/15 text-mostaza',
  dificil: 'bg-rojo/15 text-rojo',
}
const CATEGORIA_LABEL: Record<string, string> = {
  salsas: 'Salsas', pastas: 'Pastas', postres: 'Postres',
  aperitivos: 'Aperitivos', bebidas: 'Bebidas', otros: 'Otros',
}

export default function RecetaCocinaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [receta, setReceta] = useState<RecetaCocina | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/recetas-cocina/${params.id}`)
        .then((r) => {
          if (!r.ok) throw new Error('No encontrada')
          return r.json()
        })
        .then((data) => setReceta(data))
        .catch(() => router.push('/admin/recetas-cocina'))
        .finally(() => setLoading(false))
    }
  }, [params, router])

  const handleExportPDF = async () => {
    if (!receta) return
    setExporting('pdf')
    try {
      const blob = await pdf(<RecetaCocinaPDFDocument receta={receta} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receta-${receta.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF generado')
    } catch {
      toast.error('Error al generar PDF')
    } finally {
      setExporting(null)
    }
  }

  const handleExportWord = async () => {
    if (!receta) return
    setExporting('word')
    try {
      const data: RecetaCocinaExportData = {
        titulo: receta.titulo,
        descripcion: receta.descripcion,
        ingredientes: receta.ingredientes,
        pasos: receta.pasos,
        tiempo_preparacion: receta.tiempo_preparacion,
        tiempo_coccion: receta.tiempo_coccion,
        dificultad: receta.dificultad,
        categoria: receta.categoria,
        createdAt: receta.createdAt,
      }
      await exportRecetaToWord(data)
      toast.success('Word generado')
    } catch {
      toast.error('Error al generar Word')
    } finally {
      setExporting(null)
    }
  }

  const handleExportTxt = () => {
    if (!receta) return
    setExporting('txt')
    try {
      exportRecetaToTxt(receta)
      toast.success('TXT generado')
    } catch {
      toast.error('Error al generar TXT')
    } finally {
      setExporting(null)
    }
  }

  const handlePrint = () => {
    if (!receta) return
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      toast.error('Permite las ventanas emergentes para imprimir')
      return
    }
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(receta.titulo)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica', Arial, sans-serif; color: #111827; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #E1AD01; padding-bottom: 14px; margin-bottom: 20px; }
          .empresa { font-size: 20px; font-weight: bold; color: #5C3A21; }
          .empresa-sub { font-size: 10px; color: #6B7280; margin-top: 2px; }
          .receta-badge { text-align: right; }
          .receta-titulo { font-size: 16px; font-weight: bold; color: #E1AD01; }
          .receta-cat { font-size: 10px; color: #6B7280; margin-top: 2px; }
          h1 { font-size: 24px; color: #5C3A21; margin: 10px 0 6px; }
          .descripcion { font-size: 11px; color: #6B7280; margin-bottom: 12px; font-style: italic; }
          .meta { display: flex; gap: 8px; margin-bottom: 16px; }
          .badge { background: #FFF8E7; border-radius: 4px; padding: 5px 10px; font-size: 9px; }
          .badge strong { color: #6B7280; } .badge span { color: #5C3A21; }
          .imagen { width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px; margin-bottom: 16px; }
          h2 { font-size: 14px; color: #5C3A21; background: #FFF8E7; padding: 6px 10px; border-radius: 4px; margin: 10px 0 8px; }
          .bloque { font-size: 11px; line-height: 1.6; padding: 10px; background: #F3F4F6; border-radius: 4px; white-space: pre-wrap; }
          .footer { margin-top: 30px; padding-top: 8px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 9px; color: #6B7280; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="empresa">Pastas Orlando</div>
            <div class="empresa-sub">Recetas de Cocina</div>
          </div>
          <div class="receta-badge">
            <div class="receta-titulo">RECETA</div>
            <div class="receta-cat">${CATEGORIA_LABEL[receta.categoria || 'otros'] || 'Otros'}</div>
          </div>
        </div>
        <h1>${escapeHtml(receta.titulo)}</h1>
        ${receta.descripcion ? `<div class="descripcion">${escapeHtml(receta.descripcion)}</div>` : ''}
        <div class="meta">
          <div class="badge"><strong>Prep:</strong> <span>${receta.tiempo_preparacion || '-'}</span></div>
          <div class="badge"><strong>Cocción:</strong> <span>${receta.tiempo_coccion || '-'}</span></div>
          <div class="badge"><strong>Dificultad:</strong> <span>${DIFICULTAD_LABEL[receta.dificultad] || receta.dificultad}</span></div>
        </div>
        ${receta.imagen ? `<img class="imagen" src="${receta.imagen}" alt="${escapeHtml(receta.titulo)}" />` : ''}
        <h2>INGREDIENTES</h2>
        <div class="bloque">${escapeHtml(receta.ingredientes)}</div>
        <h2>PREPARACIÓN</h2>
        <div class="bloque">${escapeHtml(receta.pasos)}</div>
        <div class="footer">Receta creada el ${new Date(receta.createdAt).toLocaleDateString('es-AR')} — Pastas Orlando</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  if (!receta) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/recetas-cocina')}
            className="hover:bg-mostaza/10"
          >
            <ArrowLeft className="h-5 w-5 text-marron" />
          </Button>
          <div className="rounded-lg bg-mostaza/10 p-2">
            <Utensils className="h-5 w-5 text-mostaza" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-marron">{receta.titulo}</h1>
            <p className="text-sm text-muted-foreground">Detalle de la receta</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/admin/recetas-cocina/${receta.id}/editar`)}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-marron/10 bg-card p-4">
        <span className="text-sm font-medium text-marron self-center mr-2">Exportar / Imprimir:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={exporting !== null}
          className="border-rojo/30 text-rojo hover:bg-rojo/10"
        >
          {exporting === 'pdf' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportWord}
          disabled={exporting !== null}
          className="border-blue-500/30 text-blue-600 hover:bg-blue-50"
        >
          {exporting === 'word' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileType2 className="mr-2 h-4 w-4" />
          )}
          Word
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportTxt}
          disabled={exporting !== null}
          className="border-marron/30 text-marron hover:bg-marron/10"
        >
          {exporting === 'txt' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          TXT
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-marron/10 bg-card p-6 space-y-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {receta.categoria && (
            <Badge variant="outline" className="gap-1.5">
              <Tag className="h-3 w-3" />
              {CATEGORIA_LABEL[receta.categoria] || receta.categoria}
            </Badge>
          )}
          <Badge className={DIFICULTAD_BADGE[receta.dificultad]}>
            <ChefHat className="h-3 w-3 mr-1" />
            {DIFICULTAD_LABEL[receta.dificultad] || receta.dificultad}
          </Badge>
          {receta.visible_en_landing && (
            <Badge className="bg-oliva/15 text-oliva">Visible en Landing</Badge>
          )}
          {receta.destacado && (
            <Badge className="bg-mostaza/15 text-mostaza">Destacada</Badge>
          )}
        </div>

        {/* Descripción */}
        {receta.descripcion && (
          <p className="text-sm text-muted-foreground italic">{receta.descripcion}</p>
        )}

        {/* Tiempos */}
        <div className="flex gap-4">
          {receta.tiempo_preparacion && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-mostaza" />
              <span className="text-muted-foreground">Preparación:</span>
              <span className="font-medium text-marron">{receta.tiempo_preparacion}</span>
            </div>
          )}
          {receta.tiempo_coccion && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-mostaza" />
              <span className="text-muted-foreground">Cocción:</span>
              <span className="font-medium text-marron">{receta.tiempo_coccion}</span>
            </div>
          )}
        </div>

        {/* Imagen */}
        {receta.imagen && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={receta.imagen}
              alt={receta.titulo}
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Ingredientes */}
        <div>
          <h3 className="text-lg font-bold text-marron mb-2 border-b border-marron/10 pb-2">
            Ingredientes
          </h3>
          <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-lg p-4">
            {receta.ingredientes}
          </pre>
        </div>

        {/* Pasos */}
        <div>
          <h3 className="text-lg font-bold text-marron mb-2 border-b border-marron/10 pb-2">
            Preparación
          </h3>
          <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-lg p-4">
            {receta.pasos}
          </pre>
        </div>
      </div>
    </div>
  )
}
