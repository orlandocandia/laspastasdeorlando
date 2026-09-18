'use client'

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

// ============================================
// TIPOS
// ============================================
interface DetallePedidoItem {
  nombre: string
  codigo?: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface PedidoClienteDocData {
  id: number
  fecha_pedido: string
  fecha_entrega_solicitada: string | null
  fecha_entrega_real: string | null
  subtotal: number
  total: number
  senia: number
  observaciones: string | null
  cliente: {
    nombre: string
    apellido: string
    razon_social: string | null
    numero_documento: string | null
    tipo_persona: string | null
  }
  estado?: { nombre_estado: string } | null
  detalle: DetallePedidoItem[]
}

// ============================================
// CONSTANTES DE MARCA
// ============================================
const COLORS = {
  marron: '#5C3A21',
  mostaza: '#E1AD01',
  crema: '#FFF8E7',
  grisClaro: '#F3F4F6',
  grisOscuro: '#6B7280',
  blanco: '#FFFFFF',
  negro: '#111827',
  rojo: '#B91C1C',
  oliva: '#708238',
}

const EMPRESA = {
  nombre: 'El Amigo de las Pastas',
  direccion: 'Posadas, Misiones',
  telefono: '3754-419324',
  email: 'laspastasdeorlando@gmail.com',
  cuit: '20-12345678-9',
  condicionIVA: 'Responsable Inscripto',
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount || 0)

const getClienteNombre = (cliente: PedidoClienteDocData['cliente']) =>
  cliente.razon_social || `${cliente.nombre} ${cliente.apellido}`.trim()

const IVA_RATE = 0.21

// ============================================
// ORDEN DE PEDIDO (formato formal)
// ============================================
const ordenStyles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docNumero: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 1 },
  estadoBadge: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, backgroundColor: COLORS.mostaza, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, marginTop: 4 },
  clienteBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginBottom: 12 },
  boxTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  clienteLine: { fontSize: 10, color: COLORS.negro, marginTop: 1 },
  entregaBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  entregaCol: { flex: 1, backgroundColor: COLORS.crema, borderRadius: 4, padding: 8 },
  entregaLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 2 },
  entregaValor: { fontSize: 10, color: COLORS.negro },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  th: { padding: 6 },
  thProd: { flex: 5 },
  thCant: { flex: 1.5, textAlign: 'center' },
  thPrecio: { flex: 2, textAlign: 'right' },
  thSub: { flex: 2, textAlign: 'right' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 10 },
  td: { padding: 6 },
  tdProd: { flex: 5 },
  tdCant: { flex: 1.5, textAlign: 'center' },
  tdPrecio: { flex: 2, textAlign: 'right' },
  tdSub: { flex: 2, textAlign: 'right' },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  totalesWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  totalesBox: { width: '45%' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 10 },
  totalSenia: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 10, color: COLORS.oliva, fontFamily: 'Helvetica-Bold' },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginTop: 4, borderTopWidth: 2, borderTopColor: COLORS.marron, fontFamily: 'Helvetica-Bold', fontSize: 13, color: COLORS.marron },
  obsBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, marginTop: 16 },
  obsTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  obsTexto: { fontSize: 10, color: COLORS.negro },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function OrdenPedidoDocument({ pedido }: { pedido: PedidoClienteDocData }) {
  const numero = `PC-${String(pedido.id).padStart(6, '0')}`
  const ivaCalculado = pedido.subtotal * IVA_RATE
  const saldo = pedido.total - pedido.senia

  return (
    <Document title={`Orden de Pedido ${numero}`} author={EMPRESA.nombre} subject="Orden de Pedido de Cliente">
      <Page size="A4" style={ordenStyles.page}>
        <View style={ordenStyles.headerRow}>
          <View style={ordenStyles.empresaBlock}>
            <Text style={ordenStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={{ fontSize: 9, color: COLORS.mostaza, fontStyle: 'italic', marginTop: 1 }}>Pastas artesanales con sabor a tradición</Text>
            <Text style={ordenStyles.empresaLine}>{EMPRESA.direccion}</Text>
            <Text style={ordenStyles.empresaLine}>Tel: {EMPRESA.telefono} — CUIT: {EMPRESA.cuit}</Text>
            <Text style={ordenStyles.empresaLine}>IVA: {EMPRESA.condicionIVA}</Text>
          </View>
          <View style={ordenStyles.docBlock}>
            <Text style={ordenStyles.docTitulo}>ORDEN DE PEDIDO</Text>
            <Text style={ordenStyles.docNumero}>N° {numero}</Text>
            <Text style={ordenStyles.docFecha}>Fecha emisión: {formatDate(pedido.fecha_pedido)}</Text>
            {pedido.estado?.nombre_estado && (
              <Text style={ordenStyles.estadoBadge}>{pedido.estado.nombre_estado.toUpperCase()}</Text>
            )}
          </View>
        </View>

        <View style={ordenStyles.clienteBox}>
          <Text style={ordenStyles.boxTitulo}>DATOS DEL CLIENTE</Text>
          <Text style={ordenStyles.clienteLine}>{getClienteNombre(pedido.cliente)}</Text>
          {pedido.cliente.numero_documento && (
            <Text style={ordenStyles.clienteLine}>DNI/CUIT: {pedido.cliente.numero_documento}</Text>
          )}
          {pedido.cliente.tipo_persona && (
            <Text style={ordenStyles.clienteLine}>Tipo: {pedido.cliente.tipo_persona === 'J' ? 'Jurídica' : 'Física'}</Text>
          )}
        </View>

        <View style={ordenStyles.entregaBox}>
          <View style={ordenStyles.entregaCol}>
            <Text style={ordenStyles.entregaLabel}>FECHA ENTREGA SOLICITADA</Text>
            <Text style={ordenStyles.entregaValor}>{formatDate(pedido.fecha_entrega_solicitada)}</Text>
          </View>
          <View style={ordenStyles.entregaCol}>
            <Text style={ordenStyles.entregaLabel}>FECHA ENTREGA REAL</Text>
            <Text style={ordenStyles.entregaValor}>{formatDate(pedido.fecha_entrega_real)}</Text>
          </View>
        </View>

        <View style={ordenStyles.tableHeader}>
          <Text style={[ordenStyles.th, ordenStyles.thProd]}>Producto</Text>
          <Text style={[ordenStyles.th, ordenStyles.thCant]}>Cantidad</Text>
          <Text style={[ordenStyles.th, ordenStyles.thPrecio]}>P. Unit.</Text>
          <Text style={[ordenStyles.th, ordenStyles.thSub]}>Subtotal</Text>
        </View>
        {pedido.detalle.map((item, i) => (
          <View key={`op-${i}`} style={[ordenStyles.tableRow, i % 2 === 1 ? ordenStyles.rowAlt : {}]}>
            <Text style={[ordenStyles.td, ordenStyles.tdProd]}>{item.nombre}</Text>
            <Text style={[ordenStyles.td, ordenStyles.tdCant]}>{item.cantidad}</Text>
            <Text style={[ordenStyles.td, ordenStyles.tdPrecio]}>{formatCurrency(item.precio_unitario)}</Text>
            <Text style={[ordenStyles.td, ordenStyles.tdSub]}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}

        <View style={ordenStyles.totalesWrapper}>
          <View style={ordenStyles.totalesBox}>
            <View style={ordenStyles.totalLine}><Text>Subtotal:</Text><Text>{formatCurrency(pedido.subtotal)}</Text></View>
            <View style={ordenStyles.totalLine}><Text>IVA (21%):</Text><Text>{formatCurrency(ivaCalculado)}</Text></View>
            <View style={ordenStyles.totalFinal}><Text>TOTAL:</Text><Text>{formatCurrency(pedido.total)}</Text></View>
            {pedido.senia > 0 && (
              <>
                <View style={ordenStyles.totalSenia}><Text>Seña abonada:</Text><Text>- {formatCurrency(pedido.senia)}</Text></View>
                <View style={ordenStyles.totalFinal}><Text>SALDO PENDIENTE:</Text><Text>{formatCurrency(saldo)}</Text></View>
              </>
            )}
          </View>
        </View>

        {pedido.observaciones && (
          <View style={ordenStyles.obsBox}>
            <Text style={ordenStyles.obsTitulo}>OBSERVACIONES</Text>
            <Text style={ordenStyles.obsTexto}>{pedido.observaciones}</Text>
          </View>
        )}

        <View style={ordenStyles.footer} fixed>
          <Text>Orden de Pedido {numero} — {EMPRESA.nombre} — {EMPRESA.direccion} — CUIT: {EMPRESA.cuit}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================
// REMITO (formato de entrega con firmas)
// ============================================
const remitoStyles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docNumero: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 1 },
  clienteBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, marginBottom: 10 },
  boxTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  clienteLine: { fontSize: 10, color: COLORS.negro, marginTop: 1 },
  transportBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  transportCol: { flex: 1, backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  th: { padding: 6 },
  thProd: { flex: 6 },
  thCant: { flex: 2, textAlign: 'center' },
  thObs: { flex: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 10 },
  td: { padding: 6 },
  tdProd: { flex: 6 },
  tdCant: { flex: 2, textAlign: 'center' },
  tdObs: { flex: 4 },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  firmaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
  firmaBox: { width: '40%' },
  firmaLine: { borderBottomWidth: 1, borderBottomColor: COLORS.negro, marginBottom: 4 },
  firmaLabel: { fontSize: 9, color: COLORS.grisOscuro, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function RemitoPedidoDocument({ pedido }: { pedido: PedidoClienteDocData }) {
  const numero = `R-${String(pedido.id).padStart(6, '0')}`
  return (
    <Document title={`Remito ${numero}`} author={EMPRESA.nombre} subject="Remito de Entrega de Pedido">
      <Page size="A4" style={remitoStyles.page}>
        <View style={remitoStyles.headerRow}>
          <View style={remitoStyles.empresaBlock}>
            <Text style={remitoStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={{ fontSize: 9, color: COLORS.mostaza, fontStyle: 'italic', marginTop: 1 }}>Pastas artesanales con sabor a tradición</Text>
            <Text style={remitoStyles.empresaLine}>{EMPRESA.direccion}</Text>
            <Text style={remitoStyles.empresaLine}>Tel: {EMPRESA.telefono} — CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={remitoStyles.docBlock}>
            <Text style={remitoStyles.docTitulo}>REMITO</Text>
            <Text style={remitoStyles.docNumero}>N° {numero}</Text>
            <Text style={remitoStyles.docFecha}>Fecha: {formatDate(pedido.fecha_entrega_real || pedido.fecha_pedido)}</Text>
          </View>
        </View>

        <View style={remitoStyles.clienteBox}>
          <Text style={remitoStyles.boxTitulo}>DESTINATARIO</Text>
          <Text style={remitoStyles.clienteLine}>{getClienteNombre(pedido.cliente)}</Text>
          {pedido.cliente.numero_documento && (
            <Text style={remitoStyles.clienteLine}>DNI/CUIT: {pedido.cliente.numero_documento}</Text>
          )}
        </View>

        <View style={remitoStyles.transportBox}>
          <View style={remitoStyles.transportCol}>
            <Text style={remitoStyles.boxTitulo}>TRANSPORTE</Text>
            <Text style={remitoStyles.clienteLine}>_______________________</Text>
          </View>
          <View style={remitoStyles.transportCol}>
            <Text style={remitoStyles.boxTitulo}>DOMICILIO DE ENTREGA</Text>
            <Text style={remitoStyles.clienteLine}>_______________________</Text>
          </View>
        </View>

        <View style={remitoStyles.tableHeader}>
          <Text style={[remitoStyles.th, remitoStyles.thProd]}>Producto</Text>
          <Text style={[remitoStyles.th, remitoStyles.thCant]}>Cantidad</Text>
          <Text style={[remitoStyles.th, remitoStyles.thObs]}>Observaciones</Text>
        </View>
        {pedido.detalle.map((item, i) => (
          <View key={`rp-${i}`} style={[remitoStyles.tableRow, i % 2 === 1 ? remitoStyles.rowAlt : {}]}>
            <Text style={[remitoStyles.td, remitoStyles.tdProd]}>{item.nombre}</Text>
            <Text style={[remitoStyles.td, remitoStyles.tdCant]}>{item.cantidad}</Text>
            <Text style={[remitoStyles.td, remitoStyles.tdObs]}>_______________</Text>
          </View>
        ))}

        <View style={remitoStyles.firmaRow}>
          <View style={remitoStyles.firmaBox}>
            <View style={remitoStyles.firmaLine} />
            <Text style={remitoStyles.firmaLabel}>Firma Entrega</Text>
          </View>
          <View style={remitoStyles.firmaBox}>
            <View style={remitoStyles.firmaLine} />
            <Text style={remitoStyles.firmaLabel}>Firma Recibido — Aclaración — DNI</Text>
          </View>
        </View>

        <View style={remitoStyles.footer} fixed>
          <Text>Remito {numero} — {EMPRESA.nombre} — {EMPRESA.direccion}</Text>
        </View>
      </Page>
    </Document>
  )
}

export { OrdenPedidoDocument, RemitoPedidoDocument }
export default OrdenPedidoDocument
