'use client'

import {
  Document, Page, Text, View, StyleSheet, Image as PDFImage,
} from '@react-pdf/renderer'
import {
  FICHA_COLORS as COLORS,
  FICHA_EMPRESA as EMPRESA,
  formatFecha, formatFechaHora,
} from './ficha-shared'

// ============================================
// TIPOS
// ============================================
export interface FichaPersonaContacto {
  id: number
  valor: string
  es_principal: boolean
  tipo: { id: number; nombre: string }
}

export interface FichaPersonaDireccion {
  id: number
  direccion: string
  referencia?: string | null
  es_principal: boolean
  tipo: { id: number; nombre: string }
  municipio?: {
    id: number
    nombre: string
    departamento: {
      id: number
      nombre: string
      provincia: { id: number; nombre: string; pais: { id: number; nombre: string } }
    }
  } | null
}

export interface FichaPersonaData {
  id: number
  nombre: string
  apellido: string
  numero_documento: string
  fecha_nacimiento?: string | null
  tipo_persona: string
  observaciones?: string | null
  razon_social?: string | null
  cuit?: string | null
  condicion_iva?: string | null
  imagen?: string | null
  municipio?: {
    id: number
    nombre: string
    departamento: {
      id: number
      nombre: string
      provincia: { id: number; nombre: string; pais: { id: number; nombre: string } }
    }
  } | null
  contactos: FichaPersonaContacto[]
  direcciones: FichaPersonaDireccion[]
}

// ============================================
// ETIQUETAS
// ============================================
const tipoPersonaLabel = (tipo: string | null | undefined): string => {
  if (!tipo) return '-'
  const map: Record<string, string> = {
    cliente: 'Cliente',
    proveedor: 'Proveedor',
    empleado: 'Empleado',
    contacto: 'Contacto',
  }
  return map[tipo.toLowerCase()] || tipo
}

const condicionIvaLabel = (c: string | null | undefined): string => {
  if (!c) return '-'
  const map: Record<string, string> = {
    responsable_inscripto: 'Responsable Inscripto',
    monotributista: 'Monotributista',
    consumidor_final: 'Consumidor Final',
    exento: 'Exento',
  }
  return map[c.toLowerCase()] || c
}

const nombreCompleto = (p: FichaPersonaData) =>
  (p.razon_social || `${p.nombre} ${p.apellido}`.trim()).trim()

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
  imagenBox: { width: 110, height: 110, backgroundColor: COLORS.grisClaro, borderRadius: 55, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  imagenPlaceholder: { fontSize: 9, color: COLORS.grisOscuro, fontStyle: 'italic' },
  imagen: { width: 108, height: 108, objectFit: 'cover' as const, borderRadius: 54 },
  infoCol: { flex: 1, gap: 8 },
  infoRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { width: '40%', fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.grisOscuro, textTransform: 'uppercase' },
  infoValue: { flex: 1, fontSize: 10, color: COLORS.negro, fontFamily: 'Helvetica-Bold' },
  seccionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 10, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.mostaza, paddingBottom: 4 },
  badgeBox: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  badge: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, backgroundColor: COLORS.oliva, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3 },
  badgeMostaza: { backgroundColor: COLORS.mostaza, color: COLORS.marron },
  badgeRojo: { backgroundColor: COLORS.rojo, color: COLORS.blanco },
  listBox: { backgroundColor: COLORS.crema, borderRadius: 4, padding: 10 },
  listItem: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listItemLabel: { width: '30%', fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.grisOscuro, textTransform: 'uppercase' },
  listItemValue: { flex: 1, fontSize: 10, color: COLORS.negro },
  principalTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza, marginLeft: 6 },
  obsBox: { backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, fontSize: 10, color: COLORS.negro },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function FichaPersonaDocument({ data: persona }: { data: FichaPersonaData }) {
  const fechaGen = formatFechaHora(new Date())
  const tieneImagen = Boolean(persona.imagen)
  const tipo = (persona.tipo_persona || '').toLowerCase()

  const badgeColor = tipo === 'cliente' ? styles.badge
    : tipo === 'proveedor' ? styles.badgeMostaza
    : tipo === 'empleado' ? styles.badgeRojo
    : styles.badge

  const dirPrincipal = persona.direcciones?.find((d) => d.es_principal) || persona.direcciones?.[0]
  const contactoPrincipal = persona.contactos?.find((c) => c.es_principal) || persona.contactos?.[0]

  const ubicacionTexto = (d?: FichaPersonaDireccion) => {
    if (!d) return '-'
    const parts = [d.direccion]
    if (d.municipio?.nombre) parts.push(d.municipio.nombre)
    if (d.municipio?.departamento?.provincia?.nombre) parts.push(d.municipio.departamento.provincia.nombre)
    return parts.join(', ')
  }

  return (
    <Document title={`Ficha de Persona — ${nombreCompleto(persona)}`} author={EMPRESA.nombre} subject="Ficha de Persona">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>FICHA DE PERSONA</Text>
            <Text style={styles.docSubtitulo}>Doc: {persona.numero_documento || `ID: ${persona.id}`}</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
          </View>
        </View>

        {/* Tipo badge */}
        <View style={styles.badgeBox}>
          <Text style={badgeColor}>{tipoPersonaLabel(persona.tipo_persona)}</Text>
        </View>

        {/* Datos basicos con foto */}
        <View style={styles.infoGrid}>
          <View style={styles.imagenBox}>
            {tieneImagen ? (
              <PDFImage style={styles.imagen} src={persona.imagen as string} />
            ) : (
              <Text style={styles.imagenPlaceholder}>Sin foto</Text>
            )}
          </View>

          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{persona.nombre}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Apellido</Text>
              <Text style={styles.infoValue}>{persona.apellido}</Text>
            </View>
            {persona.razon_social ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Razon Social</Text>
                <Text style={styles.infoValue}>{persona.razon_social}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Documento</Text>
              <Text style={styles.infoValue}>{persona.numero_documento || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>{tipoPersonaLabel(persona.tipo_persona)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>F. Nacimiento</Text>
              <Text style={styles.infoValue}>{formatFecha(persona.fecha_nacimiento || null)}</Text>
            </View>
          </View>
        </View>

        {/* Datos fiscales */}
        {(persona.cuit || persona.condicion_iva) ? (
          <>
            <Text style={styles.seccionTitle}>Datos Fiscales</Text>
            <View style={styles.listBox}>
              <View style={styles.listItem}>
                <Text style={styles.listItemLabel}>CUIT</Text>
                <Text style={styles.listItemValue}>{persona.cuit || '-'}</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listItemLabel}>Condicion IVA</Text>
                <Text style={styles.listItemValue}>{condicionIvaLabel(persona.condicion_iva)}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Contactos */}
        {persona.contactos && persona.contactos.length > 0 ? (
          <>
            <Text style={styles.seccionTitle}>Contactos</Text>
            <View style={styles.listBox}>
              {persona.contactos.map((c) => (
                <View key={c.id} style={styles.listItem}>
                  <Text style={styles.listItemLabel}>{c.tipo?.nombre || 'Contacto'}</Text>
                  <Text style={styles.listItemValue}>
                    {c.valor}
                    {c.es_principal ? <Text style={styles.principalTag}> - Principal</Text> : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Direcciones */}
        {persona.direcciones && persona.direcciones.length > 0 ? (
          <>
            <Text style={styles.seccionTitle}>Direcciones</Text>
            <View style={styles.listBox}>
              {persona.direcciones.map((d) => (
                <View key={d.id} style={styles.listItem}>
                  <Text style={styles.listItemLabel}>{d.tipo?.nombre || 'Direccion'}</Text>
                  <Text style={styles.listItemValue}>
                    {ubicacionTexto(d)}
                    {d.referencia ? ` (${d.referencia})` : ''}
                    {d.es_principal ? <Text style={styles.principalTag}> - Principal</Text> : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Resumen de contacto */}
        {(contactoPrincipal || dirPrincipal) ? (
          <>
            <Text style={styles.seccionTitle}>Resumen de Contacto</Text>
            <View style={styles.listBox}>
              {contactoPrincipal ? (
                <View style={styles.listItem}>
                  <Text style={styles.listItemLabel}>Tel/Email</Text>
                  <Text style={styles.listItemValue}>{contactoPrincipal.tipo?.nombre}: {contactoPrincipal.valor}</Text>
                </View>
              ) : null}
              {dirPrincipal ? (
                <View style={styles.listItem}>
                  <Text style={styles.listItemLabel}>Ubicacion</Text>
                  <Text style={styles.listItemValue}>{ubicacionTexto(dirPrincipal)}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Observaciones */}
        {persona.observaciones ? (
          <>
            <Text style={styles.seccionTitle}>Observaciones</Text>
            <View style={styles.obsBox}>
              <Text>{persona.observaciones}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Ficha de Persona — {nombreCompleto(persona)} — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default FichaPersonaDocument
