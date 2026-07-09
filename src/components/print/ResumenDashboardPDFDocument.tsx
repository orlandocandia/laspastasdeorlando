'use client'

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

// ============================================
// TIPOS (mirror del API /api/dashboard)
// ============================================
type Sev = 'critica' | 'importante' | 'informativo'
type Etapa = 'materias_primas' | 'recetas' | 'produccion' | 'stock' | 'ventas'

interface PasoPendiente {
  id: string
  titulo: string
  descripcion: string
  severidad: Sev
  etapa: Etapa
  accionLabel: string
  href: string
  iconKey: string
  cantidad: number
}

interface IndicadorClave {
  id: string
  label: string
  valor: number
  esMoneda: boolean
  tendencia: 'sube' | 'baja' | 'estable' | 'sin_datos'
  variacionPct: number | null
  contexto: string
  iconKey: string
  href: string
}

type EstadoFlujo = 'ok' | 'pendiente' | 'critico'

interface FlujoStage {
  estado: EstadoFlujo
  label: string
  total: number
  pendientes: number
  detalle: string
  href: string
  iconKey: string
}

export interface ResumenDashboardData {
  pasosPendientes: PasoPendiente[]
  indicadoresClave: IndicadorClave[]
  flujoTrabajo: {
    materias_primas: FlujoStage
    recetas: FlujoStage
    produccion: FlujoStage
    stock: FlujoStage
    ventas: FlujoStage
  }
  resumen: {
    totalPasos: number
    criticas: number
    importantes: number
    informativas: number
    flujoCompletado: number
    flujoTotal: number
  }
  usuarioGenerador?: string
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
  sky: '#0284C7',
}

const EMPRESA = {
  nombre: 'Pastas Orlando',
  direccion: 'Posadas, Misiones',
  telefono: '3754-419324',
  cuit: '20-12345678-9',
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0)
const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n || 0)

const SEV_LABEL: Record<Sev, string> = {
  critica: 'Critica',
  importante: 'Importante',
  informativo: 'Informativo',
}

const SEV_COLOR: Record<Sev, string> = {
  critica: COLORS.rojo,
  importante: COLORS.mostaza,
  informativo: COLORS.sky,
}

const ETAPA_LABEL: Record<Etapa, string> = {
  materias_primas: 'Materias Primas',
  recetas: 'Recetas',
  produccion: 'Produccion',
  stock: 'Stock',
  ventas: 'Ventas',
}

const FLUJO_LABEL: Record<EstadoFlujo, string> = {
  ok: 'En orden',
  pendiente: 'Pendiente',
  critico: 'Critico',
}

const FLUJO_COLOR: Record<EstadoFlujo, string> = {
  ok: COLORS.oliva,
  pendiente: COLORS.mostaza,
  critico: COLORS.rojo,
}

const tendenciaLabel = (t: IndicadorClave['tendencia'], pct: number | null): string => {
  if (t === 'sin_datos') return '-'
  const signo = pct !== null && pct > 0 ? '+' : ''
  const pctTxt = pct !== null ? `${signo}${pct}%` : ''
  const flecha = t === 'sube' ? '▲' : t === 'baja' ? '▼' : '→'
  return `${flecha} ${pctTxt}`.trim()
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingRight: 32, paddingBottom: 48, paddingLeft: 32, fontSize: 10, fontFamily: 'Helvetica', color: COLORS.negro, backgroundColor: COLORS.blanco },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.marron, paddingBottom: 12, marginBottom: 14 },
  empresaBlock: { maxWidth: '55%' },
  empresaNombre: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  empresaLine: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitulo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza },
  docSubtitulo: { fontSize: 10, color: COLORS.grisOscuro, marginTop: 2 },
  docFecha: { fontSize: 9, color: COLORS.grisOscuro, marginTop: 2 },
  seccionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.mostaza, paddingBottom: 4 },
  // Resumen de alertas (badges)
  resumenBox: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  resumenCard: { flex: 1, borderRadius: 4, padding: 10, borderLeftWidth: 3 },
  resumenLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.grisOscuro, textTransform: 'uppercase' },
  resumenValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  resumenDetalle: { fontSize: 8, color: COLORS.grisOscuro, marginTop: 2 },
  // KPIs
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  kpiCard: { width: '32%', backgroundColor: COLORS.grisClaro, borderRadius: 4, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: COLORS.mostaza },
  kpiLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.grisOscuro, textTransform: 'uppercase' },
  kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.marron, marginTop: 3 },
  kpiContexto: { fontSize: 8, color: COLORS.grisOscuro, marginTop: 2 },
  kpiTend: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  // Flujo de trabajo
  flujoRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 6, alignItems: 'center' },
  flujoLabel: { flex: 2, fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.marron },
  flujoEstado: { flex: 1.2, fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, textAlign: 'center' },
  flujoTotal: { flex: 1, fontSize: 10, textAlign: 'center' },
  flujoPend: { flex: 1, fontSize: 10, textAlign: 'center' },
  flujoDetalle: { flex: 3, fontSize: 9, color: COLORS.grisOscuro },
  // Alertas
  etapaHeader: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.mostaza, marginTop: 8, marginBottom: 4, textTransform: 'uppercase' },
  alertaRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'flex-start' },
  alertaSev: { width: 70, fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.blanco, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3, textAlign: 'center' },
  alertaTitulo: { flex: 3, fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.negro },
  alertaCant: { width: 50, fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.marron, textAlign: 'center' },
  alertaDesc: { flex: 4, fontSize: 9, color: COLORS.grisOscuro },
  emptyBox: { padding: 14, textAlign: 'center', fontSize: 10, color: COLORS.oliva, fontStyle: 'italic', backgroundColor: COLORS.crema, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, textAlign: 'center', fontSize: 8, color: COLORS.grisOscuro },
})

function ResumenDashboardDocument({ data }: { data: ResumenDashboardData }) {
  const fechaGen = new Date().toLocaleString('es-AR')
  const { indicadoresClave, pasosPendientes, flujoTrabajo, resumen, usuarioGenerador } = data

  const flujoStages: FlujoStage[] = [
    flujoTrabajo.materias_primas,
    flujoTrabajo.recetas,
    flujoTrabajo.produccion,
    flujoTrabajo.stock,
    flujoTrabajo.ventas,
  ]

  // Group pasos by etapa
  const etapasOrden: Etapa[] = ['materias_primas', 'recetas', 'produccion', 'stock', 'ventas']
  const etapasConPasos = etapasOrden.filter((e) => pasosPendientes.some((p) => p.etapa === e))

  return (
    <Document title="Resumen del Dashboard" author={EMPRESA.nombre} subject="Resumen del Dashboard">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={styles.empresaLine}>{EMPRESA.direccion} — Tel: {EMPRESA.telefono}</Text>
            <Text style={styles.empresaLine}>CUIT: {EMPRESA.cuit}</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitulo}>RESUMEN DEL DASHBOARD</Text>
            <Text style={styles.docSubtitulo}>Panel de Gestion</Text>
            <Text style={styles.docFecha}>Generado: {fechaGen}</Text>
            {usuarioGenerador ? (
              <Text style={styles.docFecha}>Usuario: {usuarioGenerador}</Text>
            ) : null}
          </View>
        </View>

        {/* Resumen de alertas */}
        <Text style={styles.seccionTitle}>Resumen de Alertas</Text>
        <View style={styles.resumenBox}>
          <View style={[styles.resumenCard, { backgroundColor: '#FEF2F2', borderLeftColor: COLORS.rojo }]}>
            <Text style={styles.resumenLabel}>Criticas</Text>
            <Text style={[styles.resumenValue, { color: COLORS.rojo }]}>{resumen.criticas}</Text>
            <Text style={styles.resumenDetalle}>requieren atencion inmediata</Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: '#FEFCE8', borderLeftColor: COLORS.mostaza }]}>
            <Text style={styles.resumenLabel}>Importantes</Text>
            <Text style={[styles.resumenValue, { color: COLORS.mostaza }]}>{resumen.importantes}</Text>
            <Text style={styles.resumenDetalle}>programar accion</Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: '#F0F9FF', borderLeftColor: COLORS.sky }]}>
            <Text style={styles.resumenLabel}>Informativas</Text>
            <Text style={[styles.resumenValue, { color: COLORS.sky }]}>{resumen.informativas}</Text>
            <Text style={styles.resumenDetalle}>para seguimiento</Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: '#F0FDF4', borderLeftColor: COLORS.oliva }]}>
            <Text style={styles.resumenLabel}>Flujo Completado</Text>
            <Text style={[styles.resumenValue, { color: COLORS.oliva }]}>{resumen.flujoCompletado}/{resumen.flujoTotal}</Text>
            <Text style={styles.resumenDetalle}>etapas en orden</Text>
          </View>
        </View>

        {/* Indicadores clave */}
        <Text style={styles.seccionTitle}>Indicadores Clave del Mes</Text>
        <View style={styles.kpiGrid}>
          {indicadoresClave.map((ind) => {
            const valTxt = ind.esMoneda ? formatCurrency(ind.valor) : formatNumber(ind.valor)
            const tendColor = ind.tendencia === 'sube' ? COLORS.oliva
              : ind.tendencia === 'baja' ? COLORS.rojo
              : COLORS.grisOscuro
            return (
              <View key={ind.id} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{ind.label}</Text>
                <Text style={styles.kpiValue}>{valTxt}</Text>
                <Text style={[styles.kpiTend, { color: tendColor }]}>{tendenciaLabel(ind.tendencia, ind.variacionPct)}</Text>
                <Text style={styles.kpiContexto}>{ind.contexto}</Text>
              </View>
            )
          })}
        </View>

        {/* Flujo de trabajo */}
        <Text style={styles.seccionTitle}>Flujo de Trabajo</Text>
        <View style={[styles.flujoRow, { backgroundColor: COLORS.marron, borderRadius: 3 }]}>
          <Text style={[styles.flujoLabel, { color: COLORS.blanco, fontSize: 9 }]}>Etapa</Text>
          <Text style={[styles.flujoEstado, { color: COLORS.blanco, backgroundColor: 'transparent' }]}>Estado</Text>
          <Text style={[styles.flujoTotal, { color: COLORS.blanco, fontSize: 9 }]}>Total</Text>
          <Text style={[styles.flujoPend, { color: COLORS.blanco, fontSize: 9 }]}>Pendientes</Text>
          <Text style={[styles.flujoDetalle, { color: COLORS.blanco, fontSize: 9 }]}>Detalle</Text>
        </View>
        {flujoStages.map((stage) => (
          <View key={stage.label} style={styles.flujoRow} wrap={false}>
            <Text style={styles.flujoLabel}>{stage.label}</Text>
            <View style={styles.flujoEstado}>
              <Text style={[styles.flujoEstado, { backgroundColor: FLUJO_COLOR[stage.estado], color: COLORS.blanco, padding: 0 }]}>
                {FLUJO_LABEL[stage.estado]}
              </Text>
            </View>
            <Text style={styles.flujoTotal}>{formatNumber(stage.total)}</Text>
            <Text style={styles.flujoPend}>{formatNumber(stage.pendientes)}</Text>
            <Text style={styles.flujoDetalle}>{stage.detalle}</Text>
          </View>
        ))}

        {/* Alertas detalladas */}
        <Text style={styles.seccionTitle}>Alertas y Pasos Pendientes ({pasosPendientes.length})</Text>
        {pasosPendientes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text>No hay acciones pendientes. Todo esta en orden.</Text>
          </View>
        ) : (
          etapasConPasos.map((etapa) => {
            const pasosEtapa = pasosPendientes.filter((p) => p.etapa === etapa)
            return (
              <View key={etapa} wrap={false}>
                <Text style={styles.etapaHeader}>{ETAPA_LABEL[etapa]} ({pasosEtapa.length})</Text>
                {pasosEtapa.map((paso) => (
                  <View key={paso.id} style={styles.alertaRow}>
                    <View style={styles.alertaSev}>
                      <Text style={[styles.alertaSev, { backgroundColor: SEV_COLOR[paso.severidad], padding: 0 }]}>
                        {SEV_LABEL[paso.severidad]}
                      </Text>
                    </View>
                    <Text style={styles.alertaTitulo}>{paso.titulo}</Text>
                    <Text style={styles.alertaCant}>{paso.cantidad}</Text>
                    <Text style={styles.alertaDesc}>{paso.descripcion}</Text>
                  </View>
                ))}
              </View>
            )
          })
        )}

        <View style={styles.footer} fixed>
          <Text>Resumen del Dashboard — {EMPRESA.nombre} — Generado: {fechaGen}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default ResumenDashboardDocument
