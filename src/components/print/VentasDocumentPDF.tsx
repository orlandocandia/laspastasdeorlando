'use client'

import {
  Document, Page, Text, View, StyleSheet,
  Image as PDFImage,
} from '@react-pdf/renderer'

// Tipos compartidos
interface DetalleItem {
  nombre: string
  codigo?: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface VentaDocData {
  id: number
  numero_comprobante: string | null
  fecha_venta: string
  subtotal: number
  iva: number
  total: number
  cliente: {
    nombre: string
    apellido: string
    razon_social: string | null
    numero_documento: string | null
    tipo_persona: string | null
  }
  vendedor?: {
    persona?: { nombre: string; apellido: string }
  } | null
  formaPago?: { nombre_forma: string } | null
  estado?: { nombre_estado: string } | null
  detalle: DetalleItem[]
}

const COLORS = {
  marron: '#5C3A21',
  mostaza: '#E1AD01',
  crema: '#FFF8E7',
  grisClaro: '#F3F4F6',
  grisOscuro: '#6B7280',
  blanco: '#FFFFFF',
  negro: '#111827',
  rojo: '#B91C1C',
}

const EMPRESA = {
  nombre: 'Pastas Orlando',
  direccion: 'Posadas, Misiones',
  telefono: '3754-419324',
  email: 'laspastasdeorlando@gmail.com',
  cuit: '20-12345678-9',
  condicionIVA: 'Responsable Inscripto',
  inicioActividades: '01/01/2015',
}

const formatDate = (dateStr: string) => {
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount || 0)

const getClienteNombre = (cliente: VentaDocData['cliente']) =>
  cliente.razon_social || `${cliente.nombre} ${cliente.apellido}`.trim()

// ============================================================
// FACTURA
// ============================================================
const facturaStyles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docNumero: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 1 },
  clienteBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginBottom: 16 },
  clienteTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  clienteLine: { fontSize: 10, color: COLORS.negro, marginTop: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  th: { padding: 6 },
  thProd: { flex: 5 },
  thCant: { flex: 1.2, textAlign: 'center' },
  thPrecio: { flex: 2, textAlign: 'right' },
  thSub: { flex: 2, textAlign: 'right' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 9 },
  td: { padding: 6 },
  tdProd: { flex: 5 },
  tdCant: { flex: 1.2, textAlign: 'center' },
  tdPrecio: { flex: 2, textAlign: 'right' },
  tdSub: { flex: 2, textAlign: 'right' },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  totalesWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  totalesBox: { width: '45%' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 10 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginTop: 4, borderTopWidth: 2, borderTopColor: COLORS.marron, fontFamily: 'Helvetica-Bold', fontSize: 13, color: COLORS.marron },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
  qrBox: { position: 'absolute', bottom: 24, right: 36, width: 70, height: 70, alignItems: 'center' },
  qrImage: { width: 64, height: 64 },
  qrLabel: { fontSize: 6, color: COLORS.grisOscuro, marginTop: 2, textAlign: 'center' },
})

function FacturaDocument({ venta, qrContent }: { venta: VentaDocData; qrContent?: string }) {
  const comprobante = venta.numero_comprobante || `V-${String(venta.id).padStart(6, '0')}`
  return (
    <Document title={`Factura ${comprobante}`} author={EMPRESA.nombre} subject="Factura">
      <Page size="A4" style={facturaStyles.page}>
        <View style={facturaStyles.headerRow}>
          <View style={facturaStyles.empresaBlock}>
            <Text style={facturaStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={facturaStyles.empresaLine}>{EMPRESA.direccion}</Text>
            <Text style={facturaStyles.empresaLine}>Tel: {EMPRESA.telefono} — {EMPRESA.email}</Text>
            <Text style={facturaStyles.empresaLine}>CUIT: {EMPRESA.cuit} — {EMPRESA.condicionIVA}</Text>
            <Text style={facturaStyles.empresaLine}>Inicio Actividades: {EMPRESA.inicioActividades}</Text>
          </View>
          <View style={facturaStyles.docBlock}>
            <Text style={facturaStyles.docTitulo}>FACTURA</Text>
            <Text style={facturaStyles.docNumero}>N° {comprobante}</Text>
            <Text style={facturaStyles.docFecha}>Fecha: {formatDate(venta.fecha_venta)}</Text>
            <Text style={facturaStyles.docFecha}>Forma de pago: {venta.formaPago?.nombre_forma || '-'}</Text>
          </View>
        </View>

        <View style={facturaStyles.clienteBox}>
          <Text style={facturaStyles.clienteTitulo}>DATOS DEL CLIENTE</Text>
          <Text style={facturaStyles.clienteLine}>Nombre/Razón Social: {getClienteNombre(venta.cliente)}</Text>
          {venta.cliente.numero_documento && (
            <Text style={facturaStyles.clienteLine}>DNI/CUIT: {venta.cliente.numero_documento}</Text>
          )}
          {venta.cliente.tipo_persona && (
            <Text style={facturaStyles.clienteLine}>Tipo: {venta.cliente.tipo_persona}</Text>
          )}
          {venta.vendedor?.persona && (
            <Text style={facturaStyles.clienteLine}>
              Vendedor: {venta.vendedor.persona.nombre} {venta.vendedor.persona.apellido}
            </Text>
          )}
        </View>

        <View style={facturaStyles.tableHeader}>
          <Text style={[facturaStyles.th, facturaStyles.thProd]}>Producto</Text>
          <Text style={[facturaStyles.th, facturaStyles.thCant]}>Cant.</Text>
          <Text style={[facturaStyles.th, facturaStyles.thPrecio]}>P. Unit.</Text>
          <Text style={[facturaStyles.th, facturaStyles.thSub]}>Subtotal</Text>
        </View>
        {venta.detalle.map((item, i) => (
          <View key={`f-${i}`} style={[facturaStyles.tableRow, i % 2 === 1 ? facturaStyles.rowAlt : {}]}>
            <Text style={[facturaStyles.td, facturaStyles.tdProd]}>{item.nombre}</Text>
            <Text style={[facturaStyles.td, facturaStyles.tdCant]}>{item.cantidad}</Text>
            <Text style={[facturaStyles.td, facturaStyles.tdPrecio]}>{formatCurrency(item.precio_unitario)}</Text>
            <Text style={[facturaStyles.td, facturaStyles.tdSub]}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}

        <View style={facturaStyles.totalesWrapper}>
          <View style={facturaStyles.totalesBox}>
            <View style={facturaStyles.totalLine}><Text>Subtotal:</Text><Text>{formatCurrency(venta.subtotal)}</Text></View>
            <View style={facturaStyles.totalLine}><Text>IVA (21%):</Text><Text>{formatCurrency(venta.iva)}</Text></View>
            <View style={facturaStyles.totalFinal}><Text>TOTAL:</Text><Text>{formatCurrency(venta.total)}</Text></View>
          </View>
        </View>

        {qrContent ? (
          <View style={facturaStyles.qrBox} fixed>
            <PDFImage style={facturaStyles.qrImage} src={qrContent} />
            <Text style={facturaStyles.qrLabel}>Escanear para verificar</Text>
          </View>
        ) : null}
        <View style={facturaStyles.footer} fixed>
          <Text>{EMPRESA.nombre} — {EMPRESA.direccion} — CUIT: {EMPRESA.cuit}</Text>
          <Text>Documento no fiscal — Para uso interno</Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================
// TICKET (formato estrecho tipo comprobante de caja)
// ============================================================
const ticketStyles = StyleSheet.create({
  page: { paddingTop: 20, paddingRight: 20, paddingBottom: 30, paddingLeft: 20, fontSize: 9, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  centro: { textAlign: 'center' },
  empresaNombre: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.marron, textAlign: 'center' },
  empresaLine: { fontSize: 8, color: COLORS.grisOscuro, textAlign: 'center', marginTop: 1 },
  separator: { borderBottomWidth: 1, borderBottomColor: COLORS.marron, marginVertical: 8 },
  docTitulo: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza, textAlign: 'center', marginVertical: 4 },
  infoLine: { fontSize: 9, marginTop: 1, flexDirection: 'row', justifyContent: 'space-between' },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 8, marginTop: 8 },
  thProd: { flex: 5, padding: 4 },
  thCant: { flex: 1.5, padding: 4, textAlign: 'center' },
  thSub: { flex: 2.5, padding: 4, textAlign: 'right' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 8 },
  tdProd: { flex: 5, padding: 4 },
  tdCant: { flex: 1.5, padding: 4, textAlign: 'center' },
  tdSub: { flex: 2.5, padding: 4, textAlign: 'right' },
  totalesBox: { marginTop: 8 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, fontSize: 9 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 3, borderTopWidth: 2, borderTopColor: COLORS.marron, fontFamily: 'Helvetica-Bold', fontSize: 12, color: COLORS.marron },
  gracias: { textAlign: 'center', fontSize: 9, color: COLORS.grisOscuro, marginTop: 12, fontStyle: 'italic' },
})

function TicketDocument({ venta }: { venta: VentaDocData }) {
  const comprobante = venta.numero_comprobante || `T-${String(venta.id).padStart(6, '0')}`
  return (
    <Document title={`Ticket ${comprobante}`} author={EMPRESA.nombre} subject="Ticket">
      <Page size={{ width: 300, height: 'auto' }} style={ticketStyles.page}>
        <Text style={ticketStyles.empresaNombre}>{EMPRESA.nombre}</Text>
        <Text style={ticketStyles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
        <Text style={ticketStyles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
        <View style={ticketStyles.separator} />
        <Text style={ticketStyles.docTitulo}>TICKET</Text>
        <View style={ticketStyles.infoLine}><Text>N°: {comprobante}</Text><Text>{formatDate(venta.fecha_venta)}</Text></View>
        <View style={ticketStyles.infoLine}><Text>Cliente: {getClienteNombre(venta.cliente)}</Text></View>
        <View style={ticketStyles.infoLine}><Text>Pago: {venta.formaPago?.nombre_forma || '-'}</Text></View>

        <View style={ticketStyles.tableHeader}>
          <Text style={ticketStyles.thProd}>Producto</Text>
          <Text style={ticketStyles.thCant}>Cant.</Text>
          <Text style={ticketStyles.thSub}>Importe</Text>
        </View>
        {venta.detalle.map((item, i) => (
          <View key={`t-${i}`} style={ticketStyles.tableRow}>
            <Text style={ticketStyles.tdProd}>{item.nombre}</Text>
            <Text style={ticketStyles.tdCant}>{item.cantidad}</Text>
            <Text style={ticketStyles.tdSub}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}

        <View style={ticketStyles.totalesBox}>
          <View style={ticketStyles.totalLine}><Text>Subtotal:</Text><Text>{formatCurrency(venta.subtotal)}</Text></View>
          <View style={ticketStyles.totalLine}><Text>IVA (21%):</Text><Text>{formatCurrency(venta.iva)}</Text></View>
          <View style={ticketStyles.totalFinal}><Text>TOTAL:</Text><Text>{formatCurrency(venta.total)}</Text></View>
        </View>

        <Text style={ticketStyles.gracias}>¡Gracias por su compra!</Text>
        <Text style={ticketStyles.empresaLine}>{EMPRESA.email}</Text>
      </Page>
    </Document>
  )
}

// ============================================================
// REMITO (formato de entrega/logística)
// ============================================================
const remitoStyles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.mostaza, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
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

function RemitoDocument({ venta }: { venta: VentaDocData }) {
  const comprobante = venta.numero_comprobante ? `R-${venta.numero_comprobante}` : `R-${String(venta.id).padStart(6, '0')}`
  return (
    <Document title={`Remito ${comprobante}`} author={EMPRESA.nombre} subject="Remito de Entrega">
      <Page size="A4" style={remitoStyles.page}>
        <View style={remitoStyles.headerRow}>
          <View style={remitoStyles.empresaBlock}>
            <Text style={remitoStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={remitoStyles.empresaLine}>{EMPRESA.direccion}</Text>
            <Text style={remitoStyles.empresaLine}>Tel: {EMPRESA.telefono} — CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={remitoStyles.docBlock}>
            <Text style={remitoStyles.docTitulo}>REMITO</Text>
            <Text style={remitoStyles.docNumero}>N° {comprobante}</Text>
            <Text style={remitoStyles.docFecha}>Fecha: {formatDate(venta.fecha_venta)}</Text>
          </View>
        </View>

        <View style={remitoStyles.clienteBox}>
          <Text style={remitoStyles.boxTitulo}>DESTINATARIO</Text>
          <Text style={remitoStyles.clienteLine}>{getClienteNombre(venta.cliente)}</Text>
          {venta.cliente.numero_documento && (
            <Text style={remitoStyles.clienteLine}>DNI/CUIT: {venta.cliente.numero_documento}</Text>
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
        {venta.detalle.map((item, i) => (
          <View key={`r-${i}`} style={[remitoStyles.tableRow, i % 2 === 1 ? remitoStyles.rowAlt : {}]}>
            <Text style={[remitoStyles.td, remitoStyles.tdProd]}>{item.nombre}</Text>
            <Text style={[remitoStyles.td, remitoStyles.tdCant]}>{item.cantidad}</Text>
            <Text style={[remitoStyles.td, remitoStyles.tdObs]}>_______________</Text>
          </View>
        ))}

        <View style={remitoStyles.firmaRow}>
          <View style={remitoStyles.firmaBox}>
            <View style={remitoStyles.firmaLine} /><Text style={remitoStyles.firmaLabel}>Firma Entrega</Text>
          </View>
          <View style={remitoStyles.firmaBox}>
            <View style={remitoStyles.firmaLine} /><Text style={remitoStyles.firmaLabel}>Firma Recibido</Text>
          </View>
        </View>

        <View style={remitoStyles.footer} fixed>
          <Text>Remito {comprobante} — {EMPRESA.nombre} — {EMPRESA.direccion}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================
// ORDEN DE VENTA (formato interno para producción/despacho)
// ============================================================
const ordenStyles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 36, paddingBottom: 48, paddingLeft: 36, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 16 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.rojo },
  docNumero: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 1 },
  internaBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.rojo, marginTop: 4, backgroundColor: '#FEE2E2', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
  clienteBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginBottom: 16 },
  boxTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  clienteLine: { fontSize: 10, color: COLORS.negro, marginTop: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.marron, color: COLORS.blanco, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  th: { padding: 6 },
  thProd: { flex: 5 },
  thCant: { flex: 1.5, textAlign: 'center' },
  thPrecio: { flex: 2, textAlign: 'right' },
  thSub: { flex: 2, textAlign: 'right' },
  thEstado: { flex: 2, textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', fontSize: 10 },
  td: { padding: 6 },
  tdProd: { flex: 5 },
  tdCant: { flex: 1.5, textAlign: 'center' },
  tdPrecio: { flex: 2, textAlign: 'right' },
  tdSub: { flex: 2, textAlign: 'right' },
  tdEstado: { flex: 2, textAlign: 'center' },
  rowAlt: { backgroundColor: COLORS.grisClaro },
  totalesWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  totalesBox: { width: '45%' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 10 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginTop: 4, borderTopWidth: 2, borderTopColor: COLORS.marron, fontFamily: 'Helvetica-Bold', fontSize: 13, color: COLORS.marron },
  obsBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 10, marginTop: 16 },
  obsTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginBottom: 4 },
  obsTexto: { fontSize: 10, color: COLORS.negro },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function OrdenVentaDocument({ venta }: { venta: VentaDocData }) {
  const comprobante = venta.numero_comprobante ? `OV-${venta.numero_comprobante}` : `OV-${String(venta.id).padStart(6, '0')}`
  return (
    <Document title={`Orden de Venta ${comprobante}`} author={EMPRESA.nombre} subject="Orden de Venta Interna">
      <Page size="A4" style={ordenStyles.page}>
        <View style={ordenStyles.headerRow}>
          <View style={ordenStyles.empresaBlock}>
            <Text style={ordenStyles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={ordenStyles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
          </View>
          <View style={ordenStyles.docBlock}>
            <Text style={ordenStyles.docTitulo}>ORDEN DE VENTA</Text>
            <Text style={ordenStyles.docNumero}>N° {comprobante}</Text>
            <Text style={ordenStyles.docFecha}>Fecha: {formatDate(venta.fecha_venta)}</Text>
            <Text style={ordenStyles.internaBadge}>USO INTERNO</Text>
          </View>
        </View>

        <View style={ordenStyles.clienteBox}>
          <Text style={ordenStyles.boxTitulo}>DATOS DE LA VENTA</Text>
          <Text style={ordenStyles.clienteLine}>Cliente: {getClienteNombre(venta.cliente)}</Text>
          <Text style={ordenStyles.clienteLine}>Vendedor: {venta.vendedor?.persona ? `${venta.vendedor.persona.nombre} ${venta.vendedor.persona.apellido}` : '-'}</Text>
          <Text style={ordenStyles.clienteLine}>Forma de pago: {venta.formaPago?.nombre_forma || '-'}</Text>
          <Text style={ordenStyles.clienteLine}>Estado: {venta.estado?.nombre_estado || '-'}</Text>
        </View>

        <View style={ordenStyles.tableHeader}>
          <Text style={[ordenStyles.th, ordenStyles.thProd]}>Producto</Text>
          <Text style={[ordenStyles.th, ordenStyles.thCant]}>Cant.</Text>
          <Text style={[ordenStyles.th, ordenStyles.thPrecio]}>P. Unit.</Text>
          <Text style={[ordenStyles.th, ordenStyles.thSub]}>Subtotal</Text>
          <Text style={[ordenStyles.th, ordenStyles.thEstado]}>Estado</Text>
        </View>
        {venta.detalle.map((item, i) => (
          <View key={`o-${i}`} style={[ordenStyles.tableRow, i % 2 === 1 ? ordenStyles.rowAlt : {}]}>
            <Text style={[ordenStyles.td, ordenStyles.tdProd]}>{item.nombre}</Text>
            <Text style={[ordenStyles.td, ordenStyles.tdCant]}>{item.cantidad}</Text>
            <Text style={[ordenStyles.td, ordenStyles.tdPrecio]}>{formatCurrency(item.precio_unitario)}</Text>
            <Text style={[ordenStyles.td, ordenStyles.tdSub]}>{formatCurrency(item.subtotal)}</Text>
            <Text style={[ordenStyles.td, ordenStyles.tdEstado]}>☐</Text>
          </View>
        ))}

        <View style={ordenStyles.totalesWrapper}>
          <View style={ordenStyles.totalesBox}>
            <View style={ordenStyles.totalLine}><Text>Subtotal:</Text><Text>{formatCurrency(venta.subtotal)}</Text></View>
            <View style={ordenStyles.totalLine}><Text>IVA (21%):</Text><Text>{formatCurrency(venta.iva)}</Text></View>
            <View style={ordenStyles.totalFinal}><Text>TOTAL:</Text><Text>{formatCurrency(venta.total)}</Text></View>
          </View>
        </View>

        <View style={ordenStyles.obsBox}>
          <Text style={ordenStyles.obsTitulo}>INSTRUCCIONES DE DESPACHO</Text>
          <Text style={ordenStyles.obsTexto}>☐ Verificar stock antes de despachar{'\n'}☐ Confirmar dirección de entrega{'\n'}☐ Coordinar horario con cliente{'\n'}☐ Registrar entrega al completar</Text>
        </View>

        <View style={ordenStyles.footer} fixed>
          <Text>Orden de Venta Interna {comprobante} — {EMPRESA.nombre}</Text>
        </View>
      </Page>
    </Document>
  )
}

// Export all document types
export { FacturaDocument, TicketDocument, RemitoDocument, OrdenVentaDocument }
export type { VentaDocData, DetalleItem }
export default FacturaDocument
