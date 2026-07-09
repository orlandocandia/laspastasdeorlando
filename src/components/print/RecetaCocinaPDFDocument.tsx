'use client'

import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

interface RecetaCocinaPDFData {
  titulo: string
  descripcion: string | null
  ingredientes: string
  pasos: string
  tiempo_preparacion: string | null
  tiempo_coccion: string | null
  dificultad: string
  imagen: string | null
  categoria: string | null
  createdAt: string
}

const COLORS = {
  marron: '#5C3A21',
  mostaza: '#E1AD01',
  crema: '#FFF8E7',
  grisClaro: '#F3F4F6',
  grisOscuro: '#6B7280',
  blanco: '#FFFFFF',
  negro: '#111827',
  oliva: '#6B8E23',
}

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: 'Fácil',
  media: 'Media',
  dificil: 'Difícil',
}

const CATEGORIA_LABEL: Record<string, string> = {
  salsas: 'Salsas', pastas: 'Pastas', postres: 'Postres',
  aperitivos: 'Aperitivos', bebidas: 'Bebidas', otros: 'Otros',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40, paddingRight: 40, paddingBottom: 50, paddingLeft: 40,
    fontSize: 11, fontFamily: 'Helvetica', color: COLORS.negro,
    backgroundColor: COLORS.blanco,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 3, borderBottomColor: COLORS.mostaza, paddingBottom: 14, marginBottom: 20,
  },
  empresaBlock: { maxWidth: '60%' },
  empresaNombre: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaSub: { fontSize: 10, color: COLORS.grisOscuro, marginTop: 2 },
  recetaBlock: { alignItems: 'flex-end' },
  recetaTitulo: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  recetaCat: { fontSize: 10, color: COLORS.grisOscuro, marginTop: 2 },
  tituloReceta: {
    fontSize: 24, fontFamily: 'Helvetica-Bold', color: COLORS.marron,
    marginTop: 10, marginBottom: 6,
  },
  descripcion: { fontSize: 11, color: COLORS.grisOscuro, marginBottom: 12 },
  metaRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  metaBadge: {
    backgroundColor: COLORS.crema, borderRadius: 4, paddingVertical: 5, paddingHorizontal: 10,
    flexDirection: 'row', gap: 4,
  },
  metaLabel: { fontSize: 9, color: COLORS.grisOscuro, fontFamily: 'Helvetica-Bold' },
  metaValue: { fontSize: 9, color: COLORS.marron },
  imagenWrap: {
    marginBottom: 16, alignItems: 'center',
  },
  imagen: {
    width: 400, height: 220, objectFit: 'cover', borderRadius: 6,
  },
  seccionTitulo: {
    fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.marron,
    backgroundColor: COLORS.crema, paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 4, marginBottom: 8, marginTop: 10,
  },
  textoBloque: {
    fontSize: 11, color: COLORS.negro, lineHeight: 1.6,
    padding: 10, backgroundColor: COLORS.grisClaro, borderRadius: 4,
  },
  footer: {
    position: 'absolute', bottom: 24, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8,
    textAlign: 'center', fontSize: 9, color: COLORS.grisOscuro,
  },
})

const formatDate = (dateStr: string) => {
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}

export function RecetaCocinaPDFDocument({ receta }: { receta: RecetaCocinaPDFData }) {
  return (
    <Document title={`Receta: ${receta.titulo}`} author="Pastas Orlando" subject="Receta de Cocina">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>Pastas Orlando</Text>
            <Text style={styles.empresaSub}>Recetas de Cocina</Text>
          </View>
          <View style={styles.recetaBlock}>
            <Text style={styles.recetaTitulo}>RECETA</Text>
            <Text style={styles.recetaCat}>
              {CATEGORIA_LABEL[receta.categoria || 'otros'] || 'Otros'}
            </Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.tituloReceta}>{receta.titulo}</Text>
        {receta.descripcion && <Text style={styles.descripcion}>{receta.descripcion}</Text>}

        {/* Meta badges */}
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>Prep:</Text>
            <Text style={styles.metaValue}>{receta.tiempo_preparacion || '-'}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>Cocción:</Text>
            <Text style={styles.metaValue}>{receta.tiempo_coccion || '-'}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>Dificultad:</Text>
            <Text style={styles.metaValue}>{DIFICULTAD_LABEL[receta.dificultad] || receta.dificultad}</Text>
          </View>
        </View>

        {/* Imagen */}
        {receta.imagen && (
          <View style={styles.imagenWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.imagen} src={receta.imagen} />
          </View>
        )}

        {/* Ingredientes */}
        <Text style={styles.seccionTitulo}>INGREDIENTES</Text>
        <Text style={styles.textoBloque}>{receta.ingredientes}</Text>

        {/* Pasos */}
        <Text style={styles.seccionTitulo}>PREPARACIÓN</Text>
        <Text style={styles.textoBloque}>{receta.pasos}</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Receta creada el {formatDate(receta.createdAt)} — Pastas Orlando</Text>
        </View>
      </Page>
    </Document>
  )
}

export default RecetaCocinaPDFDocument
