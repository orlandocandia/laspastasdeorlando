'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Filter, X, Loader2 } from 'lucide-react'

// ---- Tipos ----
export type FiltroExtra =
  | {
      kind: 'select'
      key: string
      label: string
      options: { value: string; label: string }[]
      placeholder: string
    }
  | {
      kind: 'checkbox'
      key: string
      label: string
    }

interface FiltrosReportesProps {
  fechaDesde: string
  fechaHasta: string
  onFechasChange: (desde: string, hasta: string) => void
  /** Campos adicionales específicos del reporte (selects, checkboxes). */
  extras?: FiltroExtra[]
  /** Valores actuales de los campos adicionales. */
  extraValues?: Record<string, string | boolean>
  /** Callback cuando cambia un campo adicional. */
  onExtraChange?: (key: string, value: string | boolean) => void
  /** Se ejecuta al presionar "Aplicar filtros". */
  onApply: () => void
  /** Se ejecuta al presionar "Limpiar". */
  onClear: () => void
  loading?: boolean
  /** Mostrar el bloque de rango de fechas (default true). */
  showDateRange?: boolean
  /** Etiqueta del botón aplicar (default "Aplicar"). */
  applyLabel?: string
}

type Preset = 'hoy' | 'semana' | 'mes' | 'anio'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'anio', label: 'Este año' },
]

function computePresetRange(preset: Preset): { desde: string; hasta: string } {
  const hoy = new Date()
  const hasta = hoy.toISOString().split('T')[0]
  let desde = ''
  switch (preset) {
    case 'hoy':
      desde = hasta
      break
    case 'semana': {
      // Lunes de la semana actual
      const dia = hoy.getDay() // 0=domingo ... 6=sábado
      const diff = dia === 0 ? 6 : dia - 1
      const lunes = new Date(hoy)
      lunes.setDate(hoy.getDate() - diff)
      desde = lunes.toISOString().split('T')[0]
      break
    }
    case 'mes':
      desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
      break
    case 'anio':
      desde = `${hoy.getFullYear()}-01-01`
      break
  }
  return { desde, hasta }
}

export default function FiltrosReportes({
  fechaDesde,
  fechaHasta,
  onFechasChange,
  extras = [],
  extraValues = {},
  onExtraChange,
  onApply,
  onClear,
  loading = false,
  showDateRange = true,
  applyLabel = 'Aplicar',
}: FiltrosReportesProps) {
  const handlePreset = (preset: Preset) => {
    const { desde, hasta } = computePresetRange(preset)
    onFechasChange(desde, hasta)
  }

  const hasActiveFilters =
    (showDateRange && (fechaDesde !== '' || fechaHasta !== '')) ||
    extras.some((e) => {
      const v = extraValues[e.key]
      if (e.kind === 'checkbox') return v === true
      return v !== undefined && v !== '' && v !== 'todos'
    })

  const handleClear = () => {
    if (showDateRange) onFechasChange('', '')
    extras.forEach((e) => {
      if (e.kind === 'checkbox') onExtraChange?.(e.key, false)
      else onExtraChange?.(e.key, '')
    })
    onClear()
  }

  return (
    <div className="rounded-lg border border-marron/10 bg-card p-4 space-y-4">
      {/* Presets de período */}
      {showDateRange && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-marron">
            <Calendar className="h-4 w-4" />
            <span>Período</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <Button
                key={p.value}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(p.value)}
                className="text-xs h-8"
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-center sm:ml-auto">
            <div className="flex flex-col gap-1">
              <Label htmlFor="fecha-desde" className="text-[11px] text-muted-foreground">Desde</Label>
              <Input
                id="fecha-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => onFechasChange(e.target.value, fechaHasta)}
                className="w-36 h-8"
              />
            </div>
            <span className="text-muted-foreground mt-5">→</span>
            <div className="flex flex-col gap-1">
              <Label htmlFor="fecha-hasta" className="text-[11px] text-muted-foreground">Hasta</Label>
              <Input
                id="fecha-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => onFechasChange(fechaDesde, e.target.value)}
                className="w-36 h-8"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filtros adicionales del reporte */}
      {extras.length > 0 && (
        <div className={`grid gap-3 ${showDateRange ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'} items-end`}>
          {extras.map((extra) => {
            if (extra.kind === 'select') {
              return (
                <div key={extra.key} className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-marron">{extra.label}</Label>
                  <Select
                    value={(extraValues[extra.key] as string) || 'todos'}
                    onValueChange={(v) => onExtraChange?.(extra.key, v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={extra.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {extra.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            }
            // checkbox
            return (
              <div key={extra.key} className="flex items-center gap-2 h-9">
                <Checkbox
                  id={`chk-${extra.key}`}
                  checked={extraValues[extra.key] === true}
                  onCheckedChange={(v) => onExtraChange?.(extra.key, v === true)}
                />
                <Label htmlFor={`chk-${extra.key}`} className="text-sm font-medium text-marron cursor-pointer">
                  {extra.label}
                </Label>
              </div>
            )
          })}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-marron/5">
        <Button
          onClick={onApply}
          disabled={loading}
          className="gap-1.5 bg-mostaza hover:bg-mostaza/90 text-marron font-semibold h-9"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
          {applyLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={loading || !hasActiveFilters}
          className="gap-1.5 text-muted-foreground h-9"
        >
          <X className="h-4 w-4" />
          Limpiar
        </Button>
        {hasActiveFilters && (
          <span className="text-xs text-muted-foreground ml-auto">
            Filtros activos
          </span>
        )}
      </div>
    </div>
  )
}
