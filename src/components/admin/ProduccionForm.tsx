'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, AlertTriangle, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Receta {
  id: number
  nombre: string
  rendimiento_unidades: number
  productoTerminado: {
    id: number
    nombre: string
    codigo: string | null
    precio_venta: number
  }
}

interface Persona {
  id: number
  nombre: string
  apellido: string
  razon_social: string | null
}

interface StockFaltante {
  tipo: string
  id: number
  nombre: string
  codigo: string | null
  required: number
  available: number
  deficit: number
  unidad: string
}

interface StockValidation {
  puede_producir: boolean
  receta: any
  cantidad_solicitada: number
  factor_escala: number
  faltantes: StockFaltante[]
}

interface ProduccionFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function ProduccionForm({ onSuccess, onCancel }: ProduccionFormProps) {
  // Form fields
  const [idReceta, setIdReceta] = useState('')
  const [cantidadProducida, setCantidadProducida] = useState('')
  const [fechaProduccion, setFechaProduccion] = useState('')
  const [idSupervisor, setIdSupervisor] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Data
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [supervisores, setSupervisores] = useState<Persona[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Stock validation
  const [stockValidation, setStockValidation] = useState<StockValidation | null>(null)
  const [validatingStock, setValidatingStock] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [recRes, perRes] = await Promise.all([
          fetch('/api/recetas?activo=true&limite=100'),
          fetch('/api/personas?tipo=empleado&limite=100'),
        ])

        const recData = await recRes.json()
        const perData = await perRes.json()

        setRecetas(recData.data || [])
        setSupervisores(perData.personas || [])
      } catch {
        toast.error('Error al cargar datos del formulario')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  // Set default date
  useEffect(() => {
    setFechaProduccion(new Date().toISOString().split('T')[0])
  }, [])

  // Get selected receta
  const selectedReceta = recetas.find((r) => r.id.toString() === idReceta)

  // Validate stock
  const handleValidateStock = async () => {
    if (!idReceta) {
      toast.error('Seleccioná una receta primero')
      return
    }
    if (!cantidadProducida || parseFloat(cantidadProducida) <= 0) {
      toast.error('Ingresá una cantidad válida')
      return
    }

    setValidatingStock(true)
    setStockValidation(null)
    try {
      const params = new URLSearchParams()
      params.set('id_receta', idReceta)
      params.set('cantidad_producida', cantidadProducida)

      const res = await fetch(`/api/produccion/validar-stock?${params.toString()}`)
      if (!res.ok) throw new Error('Error al validar stock')
      const data = await res.json()
      setStockValidation(data)
    } catch {
      toast.error('Error al validar stock')
    } finally {
      setValidatingStock(false)
    }
  }

  // Clear validation when receta or cantidad changes
  useEffect(() => {
    setStockValidation(null)
  }, [idReceta, cantidadProducida])

  // Submit
  const handleSubmit = async () => {
    if (!idReceta) {
      toast.error('Seleccioná una receta')
      return
    }
    if (!cantidadProducida || parseFloat(cantidadProducida) <= 0) {
      toast.error('Ingresá una cantidad válida')
      return
    }
    if (!fechaProduccion) {
      toast.error('Ingresá la fecha de producción')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        id_receta: parseInt(idReceta),
        cantidad_producida: parseFloat(cantidadProducida),
        fecha_produccion: fechaProduccion,
        id_supervisor: idSupervisor ? parseInt(idSupervisor) : null,
        observaciones: observaciones.trim() || null,
      }

      const res = await fetch('/api/produccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al registrar producción')
      }

      toast.success('Producción registrada', {
        description: 'La nueva producción se registró exitosamente',
      })
      onSuccess()
    } catch (error: any) {
      toast.error('Error al guardar', {
        description: error.message || 'Intentá de nuevo más tarde',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-mostaza" />
        <span className="ml-2 text-muted-foreground">Cargando datos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Receta */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Receta *</Label>
          <Select value={idReceta} onValueChange={setIdReceta}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar receta..." />
            </SelectTrigger>
            <SelectContent>
              {recetas.map((rec) => (
                <SelectItem key={rec.id} value={rec.id.toString()}>
                  {rec.productoTerminado?.nombre || `Receta #${rec.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cantidad Producida */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Cantidad a Producir *</Label>
          <Input
            type="number"
            step="1"
            min="1"
            placeholder="0"
            value={cantidadProducida}
            onChange={(e) => setCantidadProducida(e.target.value)}
          />
        </div>

        {/* Fecha Produccion */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Fecha de Producción *</Label>
          <Input
            type="date"
            value={fechaProduccion}
            onChange={(e) => setFechaProduccion(e.target.value)}
          />
        </div>

        {/* Supervisor */}
        <div>
          <Label className="text-sm font-medium text-marron mb-1 block">Supervisor</Label>
          <Select value={idSupervisor} onValueChange={setIdSupervisor}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar (opcional)..." />
            </SelectTrigger>
            <SelectContent>
              {supervisores.map((sup) => (
                <SelectItem key={sup.id} value={sup.id.toString()}>
                  {sup.razon_social || `${sup.nombre} ${sup.apellido}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Observaciones */}
        <div className="sm:col-span-2">
          <Label className="text-sm font-medium text-marron mb-1 block">Observaciones</Label>
          <Textarea
            placeholder="Observaciones sobre la producción..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Receta info */}
      {selectedReceta && (
        <>
          <Separator />
          <div className="bg-mostaza/5 rounded-lg p-4 border border-mostaza/20">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-mostaza" />
              <span className="text-sm font-semibold text-marron">Información de la Receta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Producto Terminado</p>
                <p className="text-sm font-medium text-marron">
                  {selectedReceta.productoTerminado?.nombre || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="text-sm font-medium text-marron">
                  {selectedReceta.productoTerminado?.codigo || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rendimiento (unidades)</p>
                <p className="text-sm font-medium text-marron">
                  {selectedReceta.rendimiento_unidades || '-'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stock Validation */}
      {idReceta && cantidadProducida && parseFloat(cantidadProducida) > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-marron">Validación de Stock</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleValidateStock}
                disabled={validatingStock}
                className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
              >
                {validatingStock ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar Stock'
                )}
              </Button>
            </div>

            {stockValidation && (
              <div
                className={`rounded-lg p-4 border ${
                  stockValidation.puede_producir
                    ? 'bg-oliva/5 border-oliva/20'
                    : 'bg-rojo/5 border-rojo/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {stockValidation.puede_producir ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-oliva" />
                      <span className="text-sm font-semibold text-oliva">
                        Stock disponible — Se puede producir
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-rojo" />
                      <span className="text-sm font-semibold text-rojo">
                        Stock insuficiente — Faltan insumos
                      </span>
                    </>
                  )}
                </div>

                {stockValidation.puede_producir && (
                  <p className="text-xs text-muted-foreground">
                    Factor de escala: {stockValidation.factor_escala?.toFixed(2) || '-'} — Cantidad
                    solicitada: {stockValidation.cantidad_solicitada}
                  </p>
                )}

                {!stockValidation.puede_producir && stockValidation.faltantes.length > 0 && (
                  <div className="mt-3 rounded-lg border border-rojo/20 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-sm">
                      <thead className="bg-rojo/5">
                        <tr>
                          <th className="text-left p-2 text-muted-foreground font-medium">Tipo</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Nombre</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Requerido</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Disponible</th>
                          <th className="text-right p-2 text-muted-foreground font-medium">Déficit</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Unidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockValidation.faltantes.map((falt) => (
                          <tr key={`${falt.tipo}-${falt.id}`} className="border-t border-rojo/10">
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className={
                                  falt.tipo === 'materia_prima'
                                    ? 'border-mostaza/30 text-mostaza'
                                    : 'border-blue-300 text-blue-600'
                                }
                              >
                                {falt.tipo === 'materia_prima' ? 'MP' : 'Insumo'}
                              </Badge>
                            </td>
                            <td className="p-2 text-marron">{falt.nombre}</td>
                            <td className="p-2 text-right">{falt.required}</td>
                            <td className="p-2 text-right">{falt.available}</td>
                            <td className="p-2 text-right font-semibold text-rojo">{falt.deficit}</td>
                            <td className="p-2 text-muted-foreground">{falt.unidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            'Registrar Producción'
          )}
        </Button>
      </div>
    </div>
  )
}
