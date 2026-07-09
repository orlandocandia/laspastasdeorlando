'use client'

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'
import {
  FICHA_COLORS as COLORS,
  FICHA_EMPRESA as EMPRESA,
  formatCurrency, formatNumber, formatFecha, formatFechaHora,
} from './ficha-shared'

// ============================================
// TIPOS
// ============================================
interface DetalleRecetaItem {
  id?: number
  materiaPrima: { id: number; codigo: string | null; nombre: string; precio_compra_referencia: number } | null
  insumo: { id: number; codigo: string | null; nombre: string; precio_compra_referencia: number } | null
  cantidad_necesaria: number
  costo_estimado: number
  unidad: { id: number; codigo: string; nombre: string }
}

export interface FichaRecetaData {
  id: number
  id_producto_terminado: number
  nombre_receta: string
  rendimiento_unidades: number
  activo: boolean
  createdAt: string
  updatedAt: string | null
  productoTerminado: { id: number; codigo: string | null; nombre: string; precio_venta: number }
  detalleRecetas: DetalleRecetaItem[]
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docSubtitulo: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 4 },
  estadoBadge: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, backgroundColor: COLORS.oliva, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, marginTop: 4 },
  estadoInactivo: { backgroundColor: COLORS.rojo },
  infoBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginBottom: 16 },
  infoTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 6 },
  infoRow: { flexDirection: 'row', paddingVertical: 3, fontSize: 10 },
  infoLabel: { width: '35%', color: COLORS.grisOscuro, fontFamily: 'Helvetica-Bold' },
  infoValue: { flex: 1, color: COLORS.negro, fontFamily: 'Helvetica-Bold' },
  resumenBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resumenCard: { flex: 1, backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, borderLeftWidth: 3, borderLeftColor: COLORS.mostaza },
  resumenLabel: { fontSize: 8, color: COLORS.grisOscuro, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  resumenValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 3 },
  seccionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 10, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.mostaza, paddingBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  th: { padding: 6 },
  thTipo: { flex: 1.5 },
  thNombre: { flex: 4 },
  thCant: { flex: 2, textAlign: 'center' },
  thUnidad: { flex: 1.5, textAlign: 'center' },
  thCosto: { flex: 2, textAlign: 'right' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 10 },
  td: { padding: 6 },
  tdTipo: { flex: 1.5 },
  tdNombre: { flex: 4 },
  tdCant: { flex: 2, textAlign: 'center' },
  tdUnidad: { flex: 1.5, textAlign: 'center' },
  tdCosto: { flex: 2, textAlign: 'right' },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  tipoBadgeMP: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  tipoBadgeIns: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.oliva },
  totalRow: { flexDirection: 'row', backgroundColor: COLORS.crema, fontFamily: 'Helvetica-Bold', fontSize: 11, color: COLORS.marron, marginTop: 6 },
  pasosBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginTop: 6, fontSize: 10 },
  pasoItem: { flexDirection: 'row', paddingVertical: 3 },
  pasoNum: { width: 24, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  pasoText: { flex: 1, color: COLORS.negro },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function FichaRecetaDocument({ data: receta }: { data: FichaRecetaData }) {
  const fechaGen = formatFechaHora(new Date())
  const costoTotal = receta.detalleRecetas.reduce((sum, d) => sum + (d.costo_estimado || 0), 0)
  const costoUnitario = receta.rendimiento_unidades > 0 ? costoTotal / receta.rendimiento_unidades : 0
  const margen = receta.productoTerminado.precio_venta - costoUnitario
  const margenPct = receta.productoTerminado.precio_venta > 0 ? (margen / receta.productoTerminado.precio_venta) * 100 : 0

  return (
    <Document title={`Ficha de Receta — ${receta.nombre_receta}`} author={EMPRESA.nombre} subject="Ficha de Receta de Producción">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>FICHA DE RECETA</Text>
            <Text style={styles.docSubtitulo}>N° {receta.id}</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
            <Text style={[styles.estadoBadge, !receta.activo ? styles.estadoInactivo : {}]}>
              {receta.activo ? 'ACTIVA' : 'INACTIVA'}
            </Text>
          </View>
        </View>

        {/* Datos de la receta */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitulo}>DATOS DE LA RECETA</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre receta:</Text>
            <Text style={styles.infoValue}>{receta.nombre_receta}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Producto terminado:</Text>
            <Text style={styles.infoValue}>{receta.productoTerminado.nombre} {receta.productoTerminado.codigo ? `(${receta.productoTerminado.codigo})` : ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rendimiento:</Text>
            <Text style={styles.infoValue}>{formatNumber(receta.rendimiento_unidades)} unidades</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha creación:</Text>
            <Text style={styles.infoValue}>{formatFecha(receta.createdAt)}</Text>
          </View>
          {receta.updatedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Última actualización:</Text>
              <Text style={styles.infoValue}>{formatFecha(receta.updatedAt)}</Text>
            </View>
          )}
        </View>

        {/* Resumen de costos */}
        <View style={styles.resumenBox}>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Costo Total Lote</Text>
            <Text style={styles.resumenValue}>{formatCurrency(costoTotal)}</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Costo Unitario</Text>
            <Text style={styles.resumenValue}>{formatCurrency(costoUnitario)}</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Precio Venta</Text>
            <Text style={styles.resumenValue}>{formatCurrency(receta.productoTerminado.precio_venta)}</Text>
          </View>
          <View style={[styles.resumenCard, { borderLeftColor: margen >= 0 ? COLORS.oliva : COLORS.rojo }]}>
            <Text style={styles.resumenLabel}>Margen ({formatNumber(margenPct)}%)</Text>
            <Text style={[styles.resumenValue, { color: margen >= 0 ? COLORS.oliva : COLORS.rojo }]}>{formatCurrency(margen)}</Text>
          </View>
        </View>

        {/* Ingredientes */}
        <Text style={styles.seccionTitle}>Ingredientes ({receta.detalleRecetas.length})</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thTipo]}>Tipo</Text>
          <Text style={[styles.th, styles.thNombre]}>Nombre</Text>
          <Text style={[styles.th, styles.thCant]}>Cantidad</Text>
          <Text style={[styles.th, styles.thUnidad]}>Unidad</Text>
          <Text style={[styles.th, styles.thCosto]}>Costo Est.</Text>
        </View>
        {receta.detalleRecetas.length === 0 ? (
          <Text style={{ fontSize: 10, color: COLORS.grisOscuro, fontStyle: 'italic', padding: 8, textAlign: 'center' }}>Sin ingredientes cargados</Text>
        ) : (
          receta.detalleRecetas.map((d, i) => {
            const esMP = Boolean(d.materiaPrima)
            const nombre = esMP ? d.materiaPrima!.nombre : (d.insumo?.nombre || '-')
            return (
              <View key={`dr-${i}`} style={[styles.tableRow, i % 2 === 1 ? styles.rowAlt : {}]}>
                <Text style={[styles.td, styles.tdTipo]}>
                  <Text style={esMP ? styles.tipoBadgeMP : styles.tipoBadgeIns}>{esMP ? 'MP' : 'INS'}</Text>
                </Text>
                <Text style={[styles.td, styles.tdNombre]}>{nombre}</Text>
                <Text style={[styles.td, styles.tdCant]}>{formatNumber(d.cantidad_necesaria)}</Text>
                <Text style={[styles.td, styles.tdUnidad]}>{d.unidad?.codigo || '-'}</Text>
                <Text style={[styles.td, styles.tdCosto]}>{formatCurrency(d.costo_estimado)}</Text>
              </View>
            )
          })
        )}

        {/* Fila de total */}
        <View style={styles.totalRow}>
          <Text style={[styles.td, styles.thTipo]} />
          <Text style={[styles.td, styles.thNombre]}>TOTAL</Text>
          <Text style={[styles.td, styles.thCant]} />
          <Text style={[styles.td, styles.thUnidad]} />
          <Text style={[styles.td, styles.thCosto]}>{formatCurrency(costoTotal)}</Text>
        </View>

        {/* Pasos de producción estándar */}
        <Text style={styles.seccionTitle}>Pasos de Producción Sugeridos</Text>
        <View style={styles.pasosBox}>
          <View style={styles.pasoItem}>
            <Text style={styles.pasoNum}>1.</Text>
            <Text style={styles.pasoText}>Verificar disponibilidad de todas las materias primas e insumos listados.</Text>
          </View>
          <View style={styles.pasoItem}>
            <Text style={styles.pasoNum}>2.</Text>
            <Text style={styles.pasoText}>Preparar ingredientes según las cantidades indicadas para un rendimiento de {formatNumber(receta.rendimiento_unidades)} unidades.</Text>
          </View>
          <View style={styles.pasoItem}>
            <Text style={styles.pasoNum}>3.</Text>
            <Text style={styles.pasoText}>Mezclar y procesar siguiendo el procedimiento estándar del producto {receta.productoTerminado.nombre}.</Text>
          </View>
          <View style={styles.pasoItem}>
            <Text style={styles.pasoNum}>4.</Text>
            <Text style={styles.pasoText}>Controlar calidad y peso unitario (aprox. por unidad).</Text>
          </View>
          <View style={styles.pasoItem}>
            <Text style={styles.pasoNum}>5.</Text>
            <Text style={styles.pasoText}>Empacar y etiquetar con fecha de producción y lote correspondiente.</Text>
          </View>
          <View style={styles.pasoItem}>
            <Text style={styles.pasoNum}>6.</Text>
            <Text style={styles.pasoText}>Registrar la producción en el sistema y actualizar stock de productos terminados.</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Ficha de Receta — {receta.nombre_receta} — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default FichaRecetaDocument
