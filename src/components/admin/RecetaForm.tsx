'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProductoTerminado {
  id: number
  nombre: string
  precio_venta: number
}

interface MateriaPrima {
  id: number
  codigo: string | null
  nombre: string
  precio_compra_referencia: number
  id_unidad_base: number
  unidadBase: { id: number; codigo: string; nombre: string }
}

interface Insumo {
  id: number
  codigo: string | null
  nombre: string
  precio_compra_referencia: number
  id_unidad_base: number
  unidadBase: { id: number; codigo: string; nombre: string }
}

interface UnidadMedida {
  id: number
  codigo: string
  nombre: string
}

interface DetalleRow {
  key: string
  tipo: 'mp' | 'insumo'
  idItem: string
  cantidadNecesaria: string
  idUnidad: string
  nombreUnidad: string
  costoEstimado: string
}

interface RecetaFormProps {
  receta?: any | null
  onSuccess: () => void
  onCancel: () => void
}

export default function RecetaForm({ receta, onSuccess, onCancel }: RecetaFormProps) {
  const isEditing = !!receta

  // Form fields
  const [nombreReceta, setNombreReceta] = useState('')
  const [idProductoTerminado, setIdProductoTerminado] = useState('')
  const [rendimientoUnidades, setRendimientoUnidades] = useState('1')
  const [activo, setActivo] = useState(true)

  // Detail rows — initialize with one empty row to avoid React Strict Mode double-add
  const [detalles, setDetalles] = useState<DetalleRow[]>([
    {
      key: `row-init`,
      tipo: 'mp',
      idItem: '',
      cantidadNecesaria: '',
      idUnidad: '',
      nombreUnidad: '',
      costoEstimado: '',
    },
  ])

  // Data
  const [productosTerminados, setProductosTerminados] = useState<ProductoTerminado[]>([])
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [ptRes, mpRes, insRes, uniRes] = await Promise.all([
          fetch('/api/productos-terminados?limite=200&estado=true'),
          fetch('/api/materias-primas?estado=true&limite=200'),
          fetch('/api/insumos?estado=true&limite=200'),
          fetch('/api/unidades-medida'),
        ])

        const ptData = await ptRes.json()
        const mpData = await mpRes.json()
        const insData = await insRes.json()
        const uniData = await uniRes.json()

        setProductosTerminados(
          (ptData.data || []).map((pt: any) => ({
            id: pt.id,
            nombre: pt.nombre,
            precio_venta: pt.precio_venta,
          }))
        )
        setMateriasPrimas(mpData.data || [])
        setInsumos(insData.data || [])
        setUnidades(Array.isArray(uniData) ? uniData : [])
      } catch {
        toast.error('Error al cargar datos del formulario')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (receta) {
      setNombreReceta(receta.nombre_receta || '')
      setIdProductoTerminado(receta.id_producto_terminado?.toString() || '')
      setRendimientoUnidades(receta.rendimiento_unidades?.toString() || '1')
      setActivo(receta.activo !== false)

      if (receta.detalleRecetas && Array.isArray(receta.detalleRecetas)) {
        setDetalles(
          receta.detalleRecetas.map((d: any) => ({
            key: `row-${d.id}`,
            tipo: d.id_materia_prima ? 'mp' : 'insumo',
            idItem: (d.id_materia_prima || d.id_insumo)?.toString() || '',
            cantidadNecesaria: d.cantidad_necesaria?.toString() || '',
            idUnidad: d.id_unidad?.toString() || '',
            nombreUnidad: d.unidad?.nombre || '',
            costoEstimado: d.costo_estimado?.toString() || '',
          }))
        )
      }
    } else {
      // Only add initial row if detalles is empty (avoid Strict Mode double-add)
      setDetalles([
        {
          key: `row-init`,
          tipo: 'mp',
          idItem: '',
          cantidadNecesaria: '',
          idUnidad: '',
          nombreUnidad: '',
          costoEstimado: '',
        },
      ])
    }
  }, [receta])

  // Add detail row
  const addDetailRow = () => {
    setDetalles((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo: 'mp',
        idItem: '',
        cantidadNecesaria: '',
        idUnidad: '',
        nombreUnidad: '',
        costoEstimado: '',
      },
    ])
  }

  // Remove detail row
  const removeDetailRow = (key: string) => {
    setDetalles((prev) => prev.filter((d) => d.key !== key))
  }

  // Get available items based on tipo
  const getAvailableItems = (tipo: 'mp' | 'insumo') => {
    return tipo === 'mp' ? materiasPrimas : insumos
  }

  // Find item by id and tipo
  const findItem = (tipo: 'mp' | 'insumo', id: string) => {
    if (tipo === 'mp') {
      return materiasPrimas.find((mp) => mp.id.toString() === id)
    }
    return insumos.find((ins) => ins.id.toString() === id)
  }

  // Update detail row
  const updateDetalle = (key: string, field: keyof DetalleRow, value: string) => {
    setDetalles((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d

        const updated = { ...d, [field]: value }

        // When tipo changes, clear item selection and unit
        if (field === 'tipo') {
          updated.idItem = ''
          updated.idUnidad = ''
          updated.nombreUnidad = ''
          updated.costoEstimado = ''
        }

        // When item is selected, auto-fill the unidad
        if (field === 'idItem' && value) {
          const item = findItem(updated.tipo, value)
          if (item) {
            updated.idUnidad = item.unidadBase?.id?.toString() || item.id_unidad_base?.toString() || ''
            updated.nombreUnidad = item.unidadBase?.nombre || ''
            // Auto-calculate costo
            const cant = parseFloat(updated.cantidadNecesaria)
            if (!isNaN(cant) && cant > 0) {
              updated.costoEstimado = (cant * item.precio_compra_referencia).toFixed(2)
            }
          }
        }

        // When cantidad changes, recalculate costo
        if (field === 'cantidadNecesaria' && updated.idItem) {
          const item = findItem(updated.tipo, updated.idItem)
          if (item) {
            const cant = parseFloat(value)
            if (!isNaN(cant) && cant > 0) {
              updated.costoEstimado = (cant * item.precio_compra_referencia).toFixed(2)
            } else {
              updated.costoEstimado = ''
            }
          }
        }

        return updated
      })
    )
  }

  // Calculate total costo estimado
  const totalCostoEstimado = useMemo(() => {
    return detalles.reduce((sum, d) => {
      const costo = parseFloat(d.costoEstimado)
      return sum + (isNaN(costo) ? 0 : costo)
    }, 0)
  }, [detalles])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
  }

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!nombreReceta.trim()) {
      toast.error('Ingresá el nombre de la receta')
      return
    }
    if (!idProductoTerminado) {
      toast.error('Seleccioná un producto terminado')
      return
    }
    if (!rendimientoUnidades || parseInt(rendimientoUnidades) <= 0) {
      toast.error('Ingresá un rendimiento válido')
      return
    }
    if (detalles.length === 0) {
      toast.error('Agregá al menos un ingrediente a la receta')
      return
    }
    for (let i = 0; i < detalles.length; i++) {
      const d = detalles[i]
      if (!d.idItem) {
        toast.error(`Fila ${i + 1}: Seleccioná un ${d.tipo === 'mp' ? 'materia prima' : 'insumo'}`)
        return
      }
      if (!d.cantidadNecesaria || parseFloat(d.cantidadNecesaria) <= 0) {
        toast.error(`Fila ${i + 1}: Ingresá una cantidad válida`)
        return
      }
      if (!d.idUnidad) {
        toast.error(`Fila ${i + 1}: Falta la unidad de medida`)
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        nombre_receta: nombreReceta.trim(),
        id_producto_terminado: parseInt(idProductoTerminado),
        rendimiento_unidades: parseInt(rendimientoUnidades),
        activo,
        detalles: detalles.map((d) => ({
          tipo: d.tipo,
          id_materia_prima: d.tipo === 'mp' ? parseInt(d.idItem) : null,
          id_insumo: d.tipo === 'insumo' ? parseInt(d.idItem) : null,
          cantidad_necesaria: parseFloat(d.cantidadNecesaria),
          id_unidad: parseInt(d.idUnidad),
          costo_estimado: parseFloat(d.costoEstimado) || 0,
        })),
      }

      const url = isEditing ? `/api/recetas/${receta.id}` : '/api/recetas'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar receta')
      }

      toast.success(isEditing ? 'Receta actualizada' : 'Receta registrada', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'La nueva receta se registró exitosamente',
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
    <div className="space-y-5">
      {/* Header info when editing */}
      {isEditing && (
        <div className="bg-muted/30 rounded-lg p-3 border border-marron/10">
          <p className="text-sm text-muted-foreground">
            Receta #{receta.id} — {receta.nombre_receta}
          </p>
        </div>
      )}

      {/* ── RECETA ── */}
      <div>
        <h4 className="text-sm font-semibold text-marron mb-3">Receta</h4>

        {/* Row 1: Nombre + Producto Terminado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Nombre Receta *</Label>
            <Input
              placeholder="Ej: Fettuccine al huevo"
              value={nombreReceta}
              onChange={(e) => setNombreReceta(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Producto Terminado *</Label>
            <Select value={idProductoTerminado} onValueChange={setIdProductoTerminado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent>
                {productosTerminados.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id.toString()}>
                    {pt.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Rendimiento + Activo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Rendimiento (unidades) *</Label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={rendimientoUnidades}
              onChange={(e) => setRendimientoUnidades(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-7">
            <Switch
              id="activo"
              checked={activo}
              onCheckedChange={setActivo}
            />
            <Label htmlFor="activo" className="text-sm font-medium cursor-pointer">
              Activo
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── INGREDIENTES DE LA RECETA ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-marron">Ingredientes de la Receta</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDetailRow}
            className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar Ingrediente
          </Button>
        </div>

        {detalles.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-lg border-marron/15 text-muted-foreground text-sm">
            No hay ingredientes. Hacé clic en &quot;Agregar Ingrediente&quot; para comenzar.
          </div>
        ) : (
          <div className="rounded-lg border border-marron/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[140px] min-w-[140px]">Tipo</TableHead>
                    <TableHead className="min-w-[180px]">Producto</TableHead>
                    <TableHead className="w-[90px] min-w-[90px]">Cantidad</TableHead>
                    <TableHead className="w-[80px] min-w-[80px]">Unidad</TableHead>
                    <TableHead className="w-[110px] min-w-[110px] text-right">Costo Est.</TableHead>
                    <TableHead className="w-[40px] min-w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.map((detalle, index) => (
                    <TableRow key={detalle.key}>
                      {/* Tipo */}
                      <TableCell>
                        <Select
                          value={detalle.tipo}
                          onValueChange={(v) => updateDetalle(detalle.key, 'tipo', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp">Materia Prima</SelectItem>
                            <SelectItem value="insumo">Insumo</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Producto */}
                      <TableCell>
                        <Select
                          value={detalle.idItem}
                          onValueChange={(v) => updateDetalle(detalle.key, 'idItem', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableItems(detalle.tipo).map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Cantidad */}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="0"
                          className="h-9 text-right"
                          value={detalle.cantidadNecesaria}
                          onChange={(e) => updateDetalle(detalle.key, 'cantidadNecesaria', e.target.value)}
                        />
                      </TableCell>

                      {/* Unidad (auto-filled) */}
                      <TableCell>
                        <Input
                          className="h-9 bg-muted/50 text-center"
                          value={detalle.nombreUnidad || '-'}
                          disabled
                        />
                      </TableCell>

                      {/* Costo Estimado (auto-calculated) */}
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-marron">
                          {detalle.costoEstimado ? formatCurrency(parseFloat(detalle.costoEstimado)) : '—'}
                        </span>
                      </TableCell>

                      {/* Eliminar */}
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rojo/10"
                          onClick={() => removeDetailRow(detalle.key)}
                          disabled={detalles.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-rojo" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

            {/* Total row */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 bg-muted/30 border-t border-marron/10">
              <span className="text-sm font-semibold text-marron">Costo Total Estimado:</span>
              <span className="text-base font-bold text-marron">
                {formatCurrency(totalCostoEstimado)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
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
              Guardando...
            </>
          ) : isEditing ? (
            'Guardar Cambios'
          ) : (
            'Registrar Receta'
          )}
        </Button>
      </div>
    </div>
  )
}
