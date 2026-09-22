'use client'

/**
 * ============================================================
 * ListadoMateriasPrimasPDFDocument
 * ============================================================
 * PDF con el listado completo de materias primas en formato
 * A4 horizontal (landscape) con 8 columnas:
 * Código, Nombre, Categoría, Unidad, Precio, Stock, Stock Mín, Estado.
 *
 * Encabezado: logo, título, fecha, cantidad de registros.
 * Pie: número de página + nombre del sistema.
 * ============================================================
 */

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'
import {
  FICHA_COLORS as COLORS,
  FICHA_EMPRESA as EMPRESA,
  formatCurrency, formatNumber, formatFechaHora,
} from './ficha-shared'
import type { FichaMateriaPrimaData } from './FichaMateriaPrimaPDFDocument'

export interface ListadoMateriasPrimasData {
  materias: FichaMateriaPrimaData[]
  filtrosAplicados?: {
    categoria?: string
    estado?: string
    stock?: string
    busqueda?: string
  }
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingRight: 30,
    paddingBottom: 40,
    paddingLeft: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: COLORS.negro,
    backgroundColor: COLORS.blanco,
    size: 'A4',
    orientation: 'landscape',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.marron,
    paddingBottom: 10,
    marginBottom: 12,
  },
  empresaBlock: { maxWidth: '50%' },
  empresaNombre: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 8, color: COLORS.grisOscuro, marginTop: 1 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docFecha: { fontSize: 8, color: COLORS.grisOscuro, marginTop: 2 },
  docCount: { fontSize: 8, color: COLORS.grisOscuro, marginTop: 1 },
  filtrosInfo: { fontSize: 7, color: COLORS.grisOscuro, marginTop: 2, maxWidth: 200 },
  // Table
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.marron,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.blanco,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowAlt: {
    backgroundColor: COLORS.crema + '60',
  },
  tableCell: {
    fontSize: 8,
    color: COLORS.negro,
  },
  // Column widths (total ~745 points for A4 landscape with 30px margins)
  colCodigo: { width: '8%' },
  colNombre: { width: '22%' },
  colCategoria: { width: '14%' },
  colUnidad: { width: '10%' },
  colPrecio: { width: '12%', textAlign: 'right' as const },
  colStock: { width: '9%', textAlign: 'center' as const },
  colStockMin: { width: '9%', textAlign: 'center' as const },
  colEstado: { width: '8%', textAlign: 'center' as const },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
    fontSize: 7,
    color: COLORS.grisOscuro,
  },
})

function ListadoMateriasPrimasPDFDocument({ data }: { data: ListadoMateriasPrimasData }) {
  const { materias, filtrosAplicados } = data
  const fechaGen = formatFechaHora(new Date())

  // Build filtros description
  const filtrosDesc: string[] = []
  if (filtrosAplicados?.busqueda) filtrosDesc.push(`Búsqueda: "${filtrosAplicados.busqueda}"`)
  if (filtrosAplicados?.categoria && filtrosAplicados.categoria !== 'all') filtrosDesc.push(`Categoría: ${filtrosAplicados.categoria}`)
  if (filtrosAplicados?.estado && filtrosAplicados.estado !== 'all') filtrosDesc.push(`Estado: ${filtrosAplicados.estado === 'true' ? 'Activo' : 'Inactivo'}`)
  if (filtrosAplicados?.stock && filtrosAplicados.stock !== 'all') {
    const stockLabel = filtrosAplicados.stock === 'sin_stock' ? 'Sin stock' : filtrosAplicados.stock === 'stock_bajo' ? 'Stock bajo' : filtrosAplicados.stock
    filtrosDesc.push(`Stock: ${stockLabel}`)
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} · Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.email}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>Listado de Materias Primas</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
            <Text style={styles.docCount}>{materias.length} registro(s)</Text>
            {filtrosDesc.length > 0 && (
              <Text style={styles.filtrosInfo}>Filtros: {filtrosDesc.join(' · ')}</Text>
            )}
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colCodigo]}>Código</Text>
            <Text style={[styles.tableHeaderCell, styles.colNombre]}>Nombre</Text>
            <Text style={[styles.tableHeaderCell, styles.colCategoria]}>Categoría</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnidad]}>Unidad</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrecio]}>Precio</Text>
            <Text style={[styles.tableHeaderCell, styles.colStock]}>Stock</Text>
            <Text style={[styles.tableHeaderCell, styles.colStockMin]}>Stock Mín.</Text>
            <Text style={[styles.tableHeaderCell, styles.colEstado]}>Estado</Text>
          </View>

          {/* Table Rows */}
          {materias.map((mp, idx) => {
            const isAlt = idx % 2 === 1
            const sinStock = mp.stock_actual <= 0
            const stockBajo = mp.stock_actual > 0 && mp.stock_actual <= mp.stock_minimo
            return (
              <View key={mp.id} style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.colCodigo]}>{mp.codigo || '-'}</Text>
                <Text style={[styles.tableCell, styles.colNombre, { fontFamily: 'Helvetica-Bold' }]}>{mp.nombre}</Text>
                <Text style={[styles.tableCell, styles.colCategoria]}>{mp.categoria?.nombre || '-'}</Text>
                <Text style={[styles.tableCell, styles.colUnidad]}>{mp.unidadBase?.nombre || '-'}</Text>
                <Text style={[styles.tableCell, styles.colPrecio]}>{formatCurrency(mp.precio_compra_referencia)}</Text>
                <Text style={[
                  styles.tableCell, styles.colStock,
                  { color: sinStock ? COLORS.rojo : stockBajo ? COLORS.mostaza : COLORS.oliva, fontFamily: 'Helvetica-Bold' },
                ]}>
                  {sinStock ? 'Sin stock' : formatNumber(mp.stock_actual)}
                </Text>
                <Text style={[styles.tableCell, styles.colStockMin]}>{formatNumber(mp.stock_minimo)}</Text>
                <Text style={[
                  styles.tableCell, styles.colEstado,
                  { color: mp.estado ? COLORS.oliva : COLORS.rojo },
                ]}>
                  {mp.estado ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            )
          })}

          {/* Empty state */}
          {materias.length === 0 && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: COLORS.grisOscuro, fontStyle: 'italic' }}>
                No hay materias primas para mostrar.
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{EMPRESA.nombre} — Sistema de Gestión</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export default ListadoMateriasPrimasPDFDocument
