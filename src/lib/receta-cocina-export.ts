// Utilidades de exportación para recetas de cocina
// Word (.docx) y Texto (.txt) — generados en el cliente

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
} from 'docx'

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: 'Fácil', media: 'Media', dificil: 'Difícil',
}
const CATEGORIA_LABEL: Record<string, string> = {
  salsas: 'Salsas', pastas: 'Pastas', postres: 'Postres',
  aperitivos: 'Aperitivos', bebidas: 'Bebidas', otros: 'Otros',
}

export interface RecetaCocinaExportData {
  titulo: string
  descripcion: string | null
  ingredientes: string
  pasos: string
  tiempo_preparacion: string | null
  tiempo_coccion: string | null
  dificultad: string
  categoria: string | null
  createdAt: string
}

// Generar archivo .docx
export async function exportRecetaToWord(receta: RecetaCocinaExportData): Promise<void> {
  const children: Paragraph[] = []

  // Título principal
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: receta.titulo, bold: true, color: '5C3A21' })],
    })
  )

  // Empresa
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Pastas Orlando — Recetas de Cocina', italics: true, color: '6B7280', size: 20 })],
      spacing: { after: 200 },
    })
  )

  // Categoría y descripción
  if (receta.categoria) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Categoría: ${CATEGORIA_LABEL[receta.categoria] || receta.categoria}`, color: '6B7280' })],
        spacing: { after: 100 },
      })
    )
  }
  if (receta.descripcion) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: receta.descripcion, italics: true })],
        spacing: { after: 200 },
      })
    )
  }

  // Metadatos
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Tiempo de preparación: ', bold: true }),
        new TextRun({ text: receta.tiempo_preparacion || '-' }),
      ],
      spacing: { after: 60 },
    })
  )
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Tiempo de cocción: ', bold: true }),
        new TextRun({ text: receta.tiempo_coccion || '-' }),
      ],
      spacing: { after: 60 },
    })
  )
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Dificultad: ', bold: true }),
        new TextRun({ text: DIFICULTAD_LABEL[receta.dificultad] || receta.dificultad }),
      ],
      spacing: { after: 300 },
    })
  )

  // Ingredientes
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Ingredientes', bold: true, color: '5C3A21' })],
      spacing: { before: 200, after: 100 },
    })
  )
  receta.ingredientes.split('\n').forEach((line) => {
    if (line.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.trim() })],
          spacing: { after: 40 },
        })
      )
    }
  })

  // Preparación
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Preparación', bold: true, color: '5C3A21' })],
      spacing: { before: 300, after: 100 },
    })
  )
  receta.pasos.split('\n').forEach((line) => {
    if (line.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.trim() })],
          spacing: { after: 60 },
        })
      )
    }
  })

  // Footer
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Receta creada el ${new Date(receta.createdAt).toLocaleDateString('es-AR')} — Pastas Orlando`,
          italics: true, color: '6B7280', size: 18,
        }),
      ],
      spacing: { before: 400 },
    })
  )

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `receta-${receta.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Generar archivo .txt
export function exportRecetaToTxt(receta: RecetaCocinaExportData): void {
  const lines: string[] = []
  lines.push('='.repeat(60))
  lines.push(`  ${receta.titulo.toUpperCase()}`)
  lines.push('='.repeat(60))
  lines.push('  Pastas Orlando — Recetas de Cocina')
  lines.push('')

  if (receta.categoria) {
    lines.push(`Categoría: ${CATEGORIA_LABEL[receta.categoria] || receta.categoria}`)
  }
  if (receta.descripcion) {
    lines.push('')
    lines.push(receta.descripcion)
  }
  lines.push('')
  lines.push(`Tiempo de preparación: ${receta.tiempo_preparacion || '-'}`)
  lines.push(`Tiempo de cocción: ${receta.tiempo_coccion || '-'}`)
  lines.push(`Dificultad: ${DIFICULTAD_LABEL[receta.dificultad] || receta.dificultad}`)
  lines.push('')
  lines.push('-'.repeat(60))
  lines.push('INGREDIENTES')
  lines.push('-'.repeat(60))
  lines.push(receta.ingredientes)
  lines.push('')
  lines.push('-'.repeat(60))
  lines.push('PREPARACIÓN')
  lines.push('-'.repeat(60))
  lines.push(receta.pasos)
  lines.push('')
  lines.push('='.repeat(60))
  lines.push(`Receta creada el ${new Date(receta.createdAt).toLocaleDateString('es-AR')}`)
  lines.push('Pastas Orlando')
  lines.push('='.repeat(60))

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `receta-${receta.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
