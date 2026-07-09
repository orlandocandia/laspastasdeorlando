'use client'

import {
  Document, Page, Text, View, StyleSheet, Image as PDFImage,
} from '@react-pdf/renderer'
import {
  FICHA_COLORS as COLORS,
  FICHA_EMPRESA as EMPRESA,
  formatCurrency, formatNumber, formatFechaHora,
  tipoHarinaLabel, seccionLabel,
} from './ficha-shared'

// ============================================
// TIPOS
// ============================================
export interface FichaProductoData {
  id: number
  codigo: string | null
  codigo_barras: string | null
  nombre: string
  descripcion: string | null
  id_categoria: number
  tipo_harina: string | null
  seccion: string | null
  peso_unitario_aprox: number
  unidades: number | null
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  destacado: boolean
  visible_en_landing: boolean
  imagen: string | null
  modo_coccion: string | null
  estado: boolean
  categoria: { id: number; nombre: string; seccion?: string | null } | null
  // Campos opcionales calculados
  costo_produccion?: number | null
  margen?: number | null
  margen_porcentaje?: number | null
  receta_activa?: { nombre_receta: string; rendimiento_unidades: number } | null
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
  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  imagenBox: { width: 140, height: 140, backgroundColor: COLORS.grisClaro, borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  imagenPlaceholder: { fontSize: 9, color: COLORS.grisOscuro, fontStyle: 'italic' },
  imagen: { width: 138, height: 138, objectFit: 'cover' as const, borderRadius: 4 },
  infoCol: { flex: 1, gap: 8 },
  infoRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { width: '40%', fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.grisOscuro, textTransform: 'uppercase' },
  infoValue: { flex: 1, fontSize: 10, color: COLORS.negro, fontFamily: 'Helvetica-Bold' },
  stockBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stockCard: { flex: 1, backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, borderLeftWidth: 3, borderLeftColor: COLORS.mostaza },
  stockCritico: { borderLeftColor: COLORS.rojo },
  stockLabel: { fontSize: 8, color: COLORS.grisOscuro, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  stockValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 3 },
  stockValueCritico: { color: COLORS.rojo },
  seccionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 10, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.mostaza, paddingBottom: 4 },
  descBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, fontSize: 10, color: COLORS.negro },
  coccionBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, fontSize: 10, color: COLORS.negro, marginTop: 6 },
  badge: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, backgroundColor: COLORS.oliva, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, marginTop: 2 },
  badgeMostaza: { backgroundColor: COLORS.mostaza, color: COLORS.marron },
  badgeRojo: { backgroundColor: COLORS.rojo, color: COLORS.blanco },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function FichaProductoDocument({ data: producto }: { data: FichaProductoData }) {
  const fechaGen = formatFechaHora(new Date())
  const stockCritico = producto.stock_actual <= producto.stock_minimo
  const tieneImagen = Boolean(producto.imagen)

  return (
    <Document title={`Ficha de Producto — ${producto.nombre}`} author={EMPRESA.nombre} subject="Ficha de Producto Terminado">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>FICHA DE PRODUCTO</Text>
            <Text style={styles.docSubtitulo}>{producto.codigo ? `Cód: ${producto.codigo}` : `ID: ${producto.id}`}</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {/* Imagen */}
          <View style={styles.imagenBox}>
            {tieneImagen ? (
              <PDFImage style={styles.imagen} src={producto.imagen as string} />
            ) : (
              <Text style={styles.imagenPlaceholder}>Sin imagen</Text>
            )}
          </View>

          {/* Datos básicos */}
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{producto.nombre}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código</Text>
              <Text style={styles.infoValue}>{producto.codigo || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código de Barras</Text>
              <Text style={styles.infoValue}>{producto.codigo_barras || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoría</Text>
              <Text style={styles.infoValue}>{producto.categoria?.nombre || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sección</Text>
              <Text style={styles.infoValue}>{seccionLabel(producto.seccion || producto.categoria?.seccion)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo de Harina</Text>
              <Text style={styles.infoValue}>{tipoHarinaLabel(producto.tipo_harina)}</Text>
            </View>
          </View>
        </View>

        {/* Stock y precio */}
        <View style={styles.stockBox}>
          <View style={[styles.stockCard, stockCritico ? styles.stockCritico : {}]}>
            <Text style={styles.stockLabel}>Stock Actual</Text>
            <Text style={[styles.stockValue, stockCritico ? styles.stockValueCritico : {}]}>{formatNumber(producto.stock_actual)} u.</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Stock Mínimo</Text>
            <Text style={styles.stockValue}>{formatNumber(producto.stock_minimo)} u.</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Precio Venta</Text>
            <Text style={styles.stockValue}>{formatCurrency(producto.precio_venta)}</Text>
          </View>
          {typeof producto.costo_produccion === 'number' && producto.costo_produccion > 0 ? (
            <View style={styles.stockCard}>
              <Text style={styles.stockLabel}>Costo Producción</Text>
              <Text style={styles.stockValue}>{formatCurrency(producto.costo_produccion)}</Text>
            </View>
          ) : null}
        </View>

        {/* Características adicionales */}
        <Text style={styles.seccionTitle}>Características</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Peso Unit. Aprox.</Text>
              <Text style={styles.infoValue}>{formatNumber(producto.peso_unitario_aprox)} g</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Unidades por paquete</Text>
              <Text style={styles.infoValue}>{producto.unidades ? `${producto.unidades} u.` : '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Destacado</Text>
              <Text style={styles.infoValue}>{producto.destacado ? 'Sí' : 'No'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Visible en Landing</Text>
              <Text style={styles.infoValue}>{producto.visible_en_landing ? 'Sí' : 'No'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>{producto.estado ? 'Activo' : 'Inactivo'}</Text>
            </View>
            {producto.receta_activa && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Receta Activa</Text>
                <Text style={styles.infoValue}>{producto.receta_activa.nombre_receta} ({producto.receta_activa.rendimiento_unidades} u.)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Descripción */}
        {producto.descripcion && (
          <>
            <Text style={styles.seccionTitle}>Descripción</Text>
            <View style={styles.descBox}>
              <Text>{producto.descripcion}</Text>
            </View>
          </>
        )}

        {/* Modo de cocción */}
        {producto.modo_coccion && (
          <>
            <Text style={styles.seccionTitle}>Modo de Cocción</Text>
            <View style={styles.coccionBox}>
              <Text>{producto.modo_coccion}</Text>
            </View>
          </>
        )}

        {/* Margen si está disponible */}
        {typeof producto.margen === 'number' && producto.margen > 0 && (
          <>
            <Text style={styles.seccionTitle}>Rentabilidad</Text>
            <View style={styles.stockBox}>
              <View style={styles.stockCard}>
                <Text style={styles.stockLabel}>Margen ($)</Text>
                <Text style={[styles.stockValue, { color: COLORS.oliva }]}>{formatCurrency(producto.margen)}</Text>
              </View>
              <View style={styles.stockCard}>
                <Text style={styles.stockLabel}>Margen (%)</Text>
                <Text style={[styles.stockValue, { color: COLORS.oliva }]}>{formatNumber(producto.margen_porcentaje || 0)}%</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>Ficha de Producto — {producto.nombre} — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default FichaProductoDocument
