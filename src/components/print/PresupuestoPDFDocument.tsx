'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// Tipos
interface ProductoItem {
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface PresupuestoPDFData {
  presupuesto: {
    numero: string
    fecha_creacion: string
    fecha_validez: string
    subtotal: number
    iva: number
    total: number
    observaciones?: string | null
    estado: string
  }
  cliente: {
    nombre: string
    apellido: string
    razon_social?: string | null
    cuit?: string | null
    condicion_iva?: string | null
    telefono?: string | null
  }
  productos: ProductoItem[]
  empresa?: {
    nombre: string
    direccion: string
    telefono: string
    email: string
  }
}

// Colores de marca (mismos que en CSS variables)
const COLORS = {
  marron: '#5C3A21',
  mostaza: '#E1AD01',
  crema: '#FFF8E7',
  grisClaro: '#F3F4F6',
  grisOscuro: '#6B7280',
  blanco: '#FFFFFF',
  negro: '#111827',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingRight: 36,
    paddingBottom: 48,
    paddingLeft: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.negro,
    backgroundColor: COLORS.blanco,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.marron,
    paddingBottom: 12,
    marginBottom: 18,
  },
  empresaBlock: {
    maxWidth: '55%',
  },
  empresaNombre: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.marron,
  },
  empresaLine: {
    fontSize: 10,
    color: COLORS.grisOscuro,
    marginTop: 2,
  },
  presupuestoBlock: {
    alignItems: 'flex-end',
  },
  presupuestoTitulo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.mostaza,
  },
  presupuestoNumero: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.marron,
    marginTop: 2,
  },
  presupuestoFecha: {
    fontSize: 10,
    color: COLORS.grisOscuro,
    marginTop: 1,
  },
  // Cliente
  clienteBox: {
    backgroundColor: COLORS.grisClaro,
    borderRadius: 4,
    padding: 10,
    marginBottom: 18,
  },
  clienteTitulo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.marron,
    marginBottom: 4,
  },
  clienteLine: {
    fontSize: 10,
    color: COLORS.negro,
    marginTop: 1,
  },
  // Tabla
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.marron,
    color: COLORS.blanco,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  thProducto: { flex: 5, padding: 6 },
  thCant: { flex: 1.2, padding: 6, textAlign: 'center' },
  thPrecio: { flex: 2, padding: 6, textAlign: 'right' },
  thSubtotal: { flex: 2, padding: 6, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 10,
  },
  tdProducto: { flex: 5, padding: 6 },
  tdCant: { flex: 1.2, padding: 6, textAlign: 'center' },
  tdPrecio: { flex: 2, padding: 6, textAlign: 'right' },
  tdSubtotal: { flex: 2, padding: 6, textAlign: 'right' },
  rowAlt: {
    backgroundColor: COLORS.grisClaro,
  },
  // Totales
  totalesWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  totalesBox: {
    width: '45%',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 10,
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: COLORS.marron,
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: COLORS.marron,
  },
  // Observaciones
  obsBox: {
    backgroundColor: COLORS.grisClaro,
    borderRadius: 4,
    padding: 10,
    marginTop: 18,
  },
  obsTitulo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.marron,
    marginBottom: 4,
  },
  obsTexto: {
    fontSize: 10,
    color: COLORS.negro,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 9,
    color: COLORS.grisOscuro,
  },
})

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('es-AR')
  } catch {
    return dateStr
  }
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount || 0)

export function PresupuestoPDFDocument({
  presupuesto,
  cliente,
  productos,
  empresa,
}: PresupuestoPDFData) {
  const empresaData = empresa || {
    nombre: 'Pastas Orlando',
    direccion: 'Posadas, Misiones',
    telefono: '3754-419324',
    email: 'laspastasdeorlando@gmail.com',
  }

  const clienteNombre =
    cliente.razon_social || `${cliente.nombre} ${cliente.apellido}`.trim()

  return (
    <Document
      title={`Presupuesto ${presupuesto.numero}`}
      author={empresaData.nombre}
      subject="Presupuesto"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{empresaData.nombre}</Text>
            <Text style={styles.empresaLine}>{empresaData.direccion}</Text>
            <Text style={styles.empresaLine}>Tel: {empresaData.telefono}</Text>
            <Text style={styles.empresaLine}>{empresaData.email}</Text>
          </View>
          <View style={styles.presupuestoBlock}>
            <Text style={styles.presupuestoTitulo}>PRESUPUESTO</Text>
            <Text style={styles.presupuestoNumero}>N° {presupuesto.numero}</Text>
            <Text style={styles.presupuestoFecha}>
              Fecha: {formatDate(presupuesto.fecha_creacion)}
            </Text>
            <Text style={styles.presupuestoFecha}>
              Válido hasta: {formatDate(presupuesto.fecha_validez)}
            </Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.clienteBox}>
          <Text style={styles.clienteTitulo}>DATOS DEL CLIENTE</Text>
          <Text style={styles.clienteLine}>Nombre: {clienteNombre}</Text>
          {cliente.cuit && (
            <Text style={styles.clienteLine}>CUIT: {cliente.cuit}</Text>
          )}
          {cliente.condicion_iva && (
            <Text style={styles.clienteLine}>
              Cond. IVA: {cliente.condicion_iva}
            </Text>
          )}
          {cliente.telefono && (
            <Text style={styles.clienteLine}>Teléfono: {cliente.telefono}</Text>
          )}
        </View>

        {/* Tabla de productos */}
        <View style={styles.tableHeader}>
          <Text style={styles.thProducto}>Producto</Text>
          <Text style={styles.thCant}>Cantidad</Text>
          <Text style={styles.thPrecio}>Precio Unit.</Text>
          <Text style={styles.thSubtotal}>Subtotal</Text>
        </View>
        {productos.map((prod, i) => (
          <View
            key={`prod-${i}`}
            style={[styles.tableRow, i % 2 === 1 ? styles.rowAlt : {}]}
          >
            <Text style={styles.tdProducto}>{prod.nombre}</Text>
            <Text style={styles.tdCant}>{prod.cantidad}</Text>
            <Text style={styles.tdPrecio}>{formatCurrency(prod.precio_unitario)}</Text>
            <Text style={styles.tdSubtotal}>{formatCurrency(prod.subtotal)}</Text>
          </View>
        ))}

        {/* Totales */}
        <View style={styles.totalesWrapper}>
          <View style={styles.totalesBox}>
            <View style={styles.totalLine}>
              <Text>Subtotal:</Text>
              <Text>{formatCurrency(presupuesto.subtotal)}</Text>
            </View>
            {presupuesto.iva > 0 && (
              <View style={styles.totalLine}>
                <Text>IVA:</Text>
                <Text>{formatCurrency(presupuesto.iva)}</Text>
              </View>
            )}
            <View style={styles.totalFinal}>
              <Text>TOTAL:</Text>
              <Text>{formatCurrency(presupuesto.total)}</Text>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        {presupuesto.observaciones && (
          <View style={styles.obsBox}>
            <Text style={styles.obsTitulo}>OBSERVACIONES</Text>
            <Text style={styles.obsTexto}>{presupuesto.observaciones}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Presupuesto válido hasta el {formatDate(presupuesto.fecha_validez)}.
            Los precios pueden sufrir modificaciones.
          </Text>
          <Text>
            {empresaData.nombre} — {empresaData.direccion} — Tel: {empresaData.telefono}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default PresupuestoPDFDocument
