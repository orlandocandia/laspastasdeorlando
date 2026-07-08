'use client'

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Package, MessageSquare, Phone, ArrowRight, UserCircle, Users,
  Leaf, PackageOpen, UtensilsCrossed, ShoppingCart, ClipboardList,
  ArrowLeftRight, Receipt, CalendarCheck, DollarSign, Factory,
  AlertTriangle, BookOpen, Shield, TrendingUp, FileBarChart,
  CheckCircle2, ChevronDown, ChevronUp, Utensils, Info, AlertCircle,
  TrendingDown, Minus, ArrowLeftRight as Flow, BookOpen as Recipe,
  Zap, Target, ListChecks, Gauge,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ─── Types (mirror of API response) ──────────────────────────────────────────

type Sev = 'critica' | 'media';

interface PasoPendiente {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: Sev;
  accionLabel: string;
  href: string;
  iconKey: string;
  cantidad: number;
}

interface IndicadorClave {
  id: string;
  label: string;
  valor: number;
  esMoneda: boolean;
  tendencia: 'sube' | 'baja' | 'estable' | 'sin_datos';
  variacionPct: number | null;
  contexto: string;
  iconKey: string;
  href: string;
}

type EstadoFlujo = 'ok' | 'pendiente' | 'critico';

interface FlujoStage {
  estado: EstadoFlujo;
  label: string;
  total: number;
  pendientes: number;
  detalle: string;
  href: string;
  iconKey: string;
}

interface DashboardData {
  pasosPendientes: PasoPendiente[];
  indicadoresClave: IndicadorClave[];
  flujoTrabajo: {
    materias_primas: FlujoStage;
    recetas: FlujoStage;
    produccion: FlujoStage;
    stock: FlujoStage;
    ventas: FlujoStage;
  };
  resumen: {
    totalPasos: number;
    criticas: number;
    flujoCompletado: number;
    flujoTotal: number;
  };
}

// ─── Icon mapping ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Package> = {
  package: Package,
  'package-open': PackageOpen,
  leaf: Leaf,
  book: BookOpen,
  factory: Factory,
  dollar: DollarSign,
  clipboard: ClipboardList,
  calendar: CalendarCheck,
  cart: ShoppingCart,
  alert: AlertTriangle,
};

function getIcon(key: string): typeof Package {
  return ICON_MAP[key] ?? Package;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toLocaleString('es-AR')}`;
}

function formatNumber(v: number): string {
  return v.toLocaleString('es-AR');
}

// ─── Animation variants ──────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

// ─── Sev meta ────────────────────────────────────────────────────────────────

const SEV_META: Record<Sev, { color: string; bg: string; border: string; icon: typeof AlertTriangle; badge: string }> = {
  critica: {
    color: 'text-rojo',
    bg: 'bg-rojo/5',
    border: 'border-rojo/30',
    icon: AlertTriangle,
    badge: 'bg-rojo text-crema',
  },
  media: {
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: AlertCircle,
    badge: 'bg-orange-500 text-white',
  },
};

// ─── Flujo estado meta ───────────────────────────────────────────────────────

const FLUJO_META: Record<EstadoFlujo, { color: string; bg: string; border: string; icon: typeof CheckCircle2; emoji: string; label: string }> = {
  ok: {
    color: 'text-oliva',
    bg: 'bg-oliva/5',
    border: 'border-oliva/30',
    icon: CheckCircle2,
    emoji: '\u2705',
    label: 'En orden',
  },
  pendiente: {
    color: 'text-mostaza',
    bg: 'bg-mostaza/5',
    border: 'border-mostaza/40',
    icon: AlertCircle,
    emoji: '\u26A0\uFE0F',
    label: 'Pendiente',
  },
  critico: {
    color: 'text-rojo',
    bg: 'bg-rojo/5',
    border: 'border-rojo/40',
    icon: AlertTriangle,
    emoji: '\uD83D\uDD34',
    label: 'Crítico',
  },
};

// ─── Trend meta ──────────────────────────────────────────────────────────────

function TrendBadge({ ind }: { ind: IndicadorClave }) {
  if (ind.tendencia === 'sin_datos' || ind.variacionPct === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        sin datos
      </span>
    );
  }
  const isUp = ind.tendencia === 'sube';
  const isFlat = ind.tendencia === 'estable';
  // For "stock critico" lower is better, but for most metrics higher is better.
  // We treat the arrow direction as raw data direction; color reflects good/bad.
  const arrow = isFlat ? <Minus className="h-3.5 w-3.5" /> : isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />;
  // Good if sales/production go up; bad if they go down.
  const isGood = isFlat ? true : isUp;
  const color = isFlat ? 'text-muted-foreground' : isGood ? 'text-oliva' : 'text-rojo';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      {arrow}
      {isFlat ? '0%' : `${isUp ? '+' : ''}${ind.variacionPct}%`}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pasosExpanded, setPasosExpanded] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Error al cargar el dashboard');
      const d: DashboardData = await res.json();
      setData(d);
    } catch (e) {
      console.error('Error fetching dashboard:', e);
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const firstName = session?.user?.name?.split(' ')[0] || 'Admin';

  const pasos = data?.pasosPendientes ?? [];
  const indicadores = data?.indicadoresClave ?? [];
  const flujo = data?.flujoTrabajo;
  const resumen = data?.resumen;

  const flujoStages: FlujoStage[] = flujo
    ? [flujo.materias_primas, flujo.recetas, flujo.produccion, flujo.stock, flujo.ventas]
    : [];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-marron">
            ¡Hola, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Panel de gestión con enfoque en flujo de trabajo — Pastas Orlando
          </p>
        </div>
        {/* Resumen rápido badges */}
        {!loading && resumen && (
          <div className="flex flex-wrap gap-2">
            {resumen.criticas > 0 && (
              <Badge className="bg-rojo text-crema hover:bg-rojo">
                {resumen.criticas} crítica{resumen.criticas !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge className="bg-marron text-crema hover:bg-marron">
              Flujo: {resumen.flujoCompletado}/{resumen.flujoTotal}
            </Badge>
            {resumen.totalPasos === 0 && (
              <Badge className="bg-oliva text-crema hover:bg-oliva">
                Todo en orden
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ─── Loading state ──────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-marron/10">
            <CardContent className="py-8">
              <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-marron/10">
            <CardContent className="py-8">
              <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Error state ────────────────────────────────────────────────── */}
      {error && !loading && (
        <Card className="border-rojo/30 bg-rojo/5">
          <CardContent className="py-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rojo" />
            <p className="text-rojo font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchDashboard} className="ml-auto">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Main content ───────────────────────────────────────────────── */}
      {!loading && !error && data && (
        <>
          {/* ═══ 1. PASOS PENDIENTES ═══════════════════════════════════════ */}
          <section aria-label="Pasos pendientes">
            <Card className={`border-marron/10 ${pasos.length === 0 ? 'border-oliva/30 bg-oliva/5' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${pasos.length === 0 ? 'bg-oliva/20' : 'bg-marron/10'}`}>
                      {pasos.length === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-oliva" />
                      ) : (
                        <ListChecks className="h-5 w-5 text-marron" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base text-marron flex items-center gap-2">
                        Pasos Pendientes
                        {pasos.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {pasos.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pasos.length === 0
                          ? 'No hay acciones pendientes — todo está en orden'
                          : 'Acciones que requieren tu atención ahora'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {pasos.length > 0 && (
                <CardContent className="pt-0 space-y-2.5">
                  <AnimatePresence>
                    {pasosExpanded && pasos.map((paso, i) => {
                      const sev = SEV_META[paso.severidad];
                      const SevIcon = sev.icon;
                      const StepIcon = getIcon(paso.iconKey);
                      return (
                        <motion.div
                          key={paso.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`rounded-lg border ${sev.border} ${sev.bg} p-3 sm:p-4`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`rounded-lg p-2 shrink-0 ${paso.severidad === 'critica' ? 'bg-rojo/15' : 'bg-orange-100'}`}>
                                <StepIcon className={`h-4 w-4 ${sev.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`font-semibold text-sm ${sev.color}`}>{paso.titulo}</h3>
                                  <Badge className={`text-[10px] ${sev.badge}`}>
                                    {paso.cantidad}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {paso.descripcion}
                                </p>
                              </div>
                            </div>
                            <Link href={paso.href} className="shrink-0">
                              <Button
                                size="sm"
                                className={
                                  paso.severidad === 'critica'
                                    ? 'bg-rojo text-crema hover:bg-rojo/90'
                                    : 'bg-marron text-crema hover:bg-marron/90'
                                }
                              >
                                {paso.accionLabel}
                                <ArrowRight className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </CardContent>
              )}
            </Card>
          </section>

          {/* ═══ 2. INDICADORES CLAVE ══════════════════════════════════════ */}
          <section aria-label="Indicadores clave">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="h-5 w-5 text-marron" />
              <h2 className="text-lg font-semibold text-marron">Indicadores Clave</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                con tendencias vs mes anterior
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
              {indicadores.map((ind, i) => {
                const Icon = getIcon(ind.iconKey);
                return (
                  <motion.div
                    key={ind.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link href={ind.href}>
                      <Card className="hover:shadow-md transition-shadow border-marron/5 h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="rounded-lg p-1.5 bg-marron/5">
                              <Icon className="h-4 w-4 text-marron" />
                            </div>
                            <TrendBadge ind={ind} />
                          </div>
                          <div className="text-2xl font-bold text-marron leading-tight">
                            {ind.esMoneda ? formatCurrency(ind.valor) : formatNumber(ind.valor)}
                          </div>
                          <div className="text-xs font-medium text-muted-foreground mt-1">
                            {ind.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">
                            {ind.contexto}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ═══ 3. FLUJO DE TRABAJO ═══════════════════════════════════════ */}
          <section aria-label="Flujo de trabajo">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Flow className="h-5 w-5 text-marron" />
                <h2 className="text-lg font-semibold text-marron">Flujo de Trabajo</h2>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Materias Primas → Recetas → Producción → Stock → Ventas
                </span>
              </div>
              {resumen && (
                <Badge className="bg-marron/10 text-marron border-marron/20">
                  {resumen.flujoCompletado}/{resumen.flujoTotal} etapas OK
                </Badge>
              )}
            </div>
            <Card className="border-marron/10">
              <CardContent className="p-4 sm:p-6">
                {/* Horizontal flow on desktop, vertical on mobile */}
                <div className="flex flex-col lg:flex-row lg:items-stretch gap-2 lg:gap-1">
                  {flujoStages.map((stage, idx) => {
                    const meta = FLUJO_META[stage.estado];
                    const StageIcon = getIcon(stage.iconKey);
                    const EstadoIcon = meta.icon;
                    return (
                      <div key={stage.label} className="flex flex-col lg:flex-row lg:items-stretch gap-2 lg:gap-1 flex-1">
                        <Link href={stage.href} className="flex-1 group">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`rounded-xl border ${meta.border} ${meta.bg} p-3 sm:p-4 h-full transition-all group-hover:shadow-md group-hover:brightness-105`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className={`rounded-lg p-1.5 ${meta.bg} ${meta.border} border`}>
                                <StageIcon className={`h-4 w-4 ${meta.color}`} />
                              </div>
                              <span className="text-lg" title={meta.label}>
                                {meta.emoji}
                              </span>
                            </div>
                            <h3 className={`font-semibold text-sm ${meta.color}`}>
                              {stage.label}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stage.detalle}
                            </p>
                            {stage.pendientes > 0 && (
                              <div className="mt-2">
                                <Badge className={`text-[10px] ${meta.color} bg-white/60 border-current`}>
                                  {stage.pendientes} pendiente{stage.pendientes !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )}
                            {stage.estado === 'ok' && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-oliva">
                                <EstadoIcon className="h-3 w-3" />
                                {meta.label}
                              </div>
                            )}
                          </motion.div>
                        </Link>
                        {/* Arrow between stages (desktop) */}
                        {idx < flujoStages.length - 1 && (
                          <div className="hidden lg:flex items-center justify-center px-0.5">
                            <ArrowRight className="h-4 w-4 text-marron/30" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-marron/5">
                  <span className="text-xs text-muted-foreground">Leyenda:</span>
                  <span className="flex items-center gap-1 text-xs text-oliva">
                    <CheckCircle2 className="h-3 w-3" /> En orden
                  </span>
                  <span className="flex items-center gap-1 text-xs text-mostaza">
                    <AlertCircle className="h-3 w-3" /> Pendiente
                  </span>
                  <span className="flex items-center gap-1 text-xs text-rojo">
                    <AlertTriangle className="h-3 w-3" /> Crítico
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ═══ 4. ACCIONES DIRECTAS ══════════════════════════════════════ */}
          <section aria-label="Acciones directas">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-marron" />
              <h2 className="text-lg font-semibold text-marron">Acciones Directas</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                accesos rápidos a las tareas más frecuentes
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <DirectAction
                href="/admin/productos-terminados?stock=sin_stock"
                icon={Package}
                color="rojo"
                titulo="Ver productos sin stock"
                desc="Lista de productos terminados agotados"
              />
              <DirectAction
                href="/admin/produccion"
                icon={Factory}
                color="marron"
                titulo="Completar producción"
                desc="Marcar producciones como finalizadas"
              />
              <DirectAction
                href="/admin/compras"
                icon={ShoppingCart}
                color="oliva"
                titulo="Cargar materias primas"
                desc="Registrar compra y actualizar stock"
              />
              <DirectAction
                href="/admin/ventas"
                icon={Receipt}
                color="mostaza"
                titulo="Registrar venta"
                desc="Nueva venta y descuento de stock"
              />
              <DirectAction
                href="/admin/pedidos-clientes"
                icon={ClipboardList}
                color="mostaza"
                titulo="Gestionar pedidos"
                desc="Pedidos de clientes pendientes"
              />
              <DirectAction
                href="/admin/recetas"
                icon={BookOpen}
                color="oliva"
                titulo="Editar recetas"
                desc="Recetas de producción y costos"
              />
              <DirectAction
                href="/admin/reservas-clientes"
                icon={CalendarCheck}
                color="rojo"
                titulo="Ver reservas"
                desc="Reservas vigentes con seña"
              />
              <DirectAction
                href="/admin/reportes"
                icon={FileBarChart}
                color="marron"
                titulo="Generar reporte"
                desc="Reportes exportables Excel/PDF"
              />
            </div>
          </section>

          {/* ═══ 5. Accesos adicionales (colapsable) ═══════════════════════ */}
          <section aria-label="Más accesos">
            <Card className="border-marron/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Más accesos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { href: '/admin/materias-primas', icon: Leaf, label: 'Materias Primas', color: 'text-oliva' },
                    { href: '/admin/insumos', icon: PackageOpen, label: 'Insumos', color: 'text-mostaza' },
                    { href: '/admin/productos-terminados', icon: UtensilsCrossed, label: 'Productos Terminados', color: 'text-rojo' },
                    { href: '/admin/stock-movements', icon: ArrowLeftRight, label: 'Mov. Stock', color: 'text-oliva' },
                    { href: '/admin/pedidos-proveedores', icon: ClipboardList, label: 'Pedidos Proveedores', color: 'text-mostaza' },
                    { href: '/admin/productos', icon: Package, label: 'Catálogo Landing', color: 'text-mostaza' },
                    { href: '/admin/opiniones', icon: MessageSquare, label: 'Opiniones', color: 'text-rojo' },
                    { href: '/admin/estadisticas', icon: Phone, label: 'WhatsApp', color: 'text-whatsapp' },
                    { href: '/admin/usuarios', icon: Users, label: 'Usuarios', color: 'text-oliva' },
                    { href: '/admin/auditoria', icon: Shield, label: 'Auditoría', color: 'text-oliva' },
                  ].map(item => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-marron/10 hover:bg-marron/5 text-xs"
                      >
                        <item.icon className={`mr-1.5 h-3.5 w-3.5 ${item.color}`} />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

// ─── DirectAction sub-component ──────────────────────────────────────────────

function DirectAction({
  href,
  icon: Icon,
  color,
  titulo,
  desc,
}: {
  href: string;
  icon: typeof Package;
  color: 'rojo' | 'marron' | 'oliva' | 'mostaza';
  titulo: string;
  desc: string;
}) {
  const colorMap = {
    rojo: { bg: 'bg-rojo/5', text: 'text-rojo', border: 'hover:border-rojo/40' },
    marron: { bg: 'bg-marron/5', text: 'text-marron', border: 'hover:border-marron/40' },
    oliva: { bg: 'bg-oliva/5', text: 'text-oliva', border: 'hover:border-oliva/40' },
    mostaza: { bg: 'bg-mostaza/5', text: 'text-mostaza', border: 'hover:border-mostaza/40' },
  }[color];

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`rounded-lg border border-marron/10 ${colorMap.border} ${colorMap.bg} p-4 h-full transition-colors cursor-pointer`}
      >
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${colorMap.bg} ${colorMap.text}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-sm ${colorMap.text}`}>
              {titulo}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {desc}
            </p>
          </div>
          <ArrowRight className={`h-4 w-4 ${colorMap.text} shrink-0 mt-1`} />
        </div>
      </motion.div>
    </Link>
  );
}
