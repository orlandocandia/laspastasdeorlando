'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ImageUploaderProducto from './ImageUploaderProducto'

// ============================================
// CONSTANTES
// ============================================

const PURCHASE_UNITS = [
  { value: 'kg', label: 'Kilogramo (kg)', isWeight: true },
  { value: 'g', label: 'Gramo (g)', isWeight: true },
  { value: 'l', label: 'Litro (l)', isWeight: true },
  { value: 'ml', label: 'Mililitro (ml)', isWeight: true },
  { value: 'u', label: 'Unidad (u)', isWeight: false },
] as const

function convertToGrams(quantity: number, unit: string): number {
  switch (unit) {
    case 'kg': return quantity * 1000
    case 'g': return quantity
    case 'l': return quantity * 1000
    case 'ml': return quantity
    case 'u': return quantity
    default: return quantity
  }
}

const materiaPrimaSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  id_categoria: z.string().min(1, 'Seleccioná una categoría'),
  id_unidad_base: z.string().min(1, 'Seleccioná una unidad de medida'),
  stock_actual: z.coerce.number().min(0, 'El stock no puede ser negativo').default(0),
  stock_minimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').default(0),
  // Sistema simple de cálculo
  purchaseUnitType: z.string().optional(),
  unitsPurchased: z.coerce.number().optional(),
  totalPrice: z.coerce.number().optional(),
  imagen: z.string().optional(),
  estado: z.boolean().default(true),
})

type MateriaPrimaFormValues = z.infer<typeof materiaPrimaSchema>

interface Categoria {
  id: number
  nombre: string
}

interface UnidadMedida {
  id: number
  codigo: string
  nombre: string
}

interface MateriaPrimaFormProps {
  materiaPrima?: any | null
  onSuccess: () => void
}

export default function MateriaPrimaForm({ materiaPrima, onSuccess }: MateriaPrimaFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState(materiaPrima?.imagen || '')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [loadingUnidades, setLoadingUnidades] = useState(true)

  const isEditing = !!materiaPrima

  const form = useForm<MateriaPrimaFormValues>({
    resolver: zodResolver(materiaPrimaSchema),
    defaultValues: {
      codigo: materiaPrima?.codigo || '',
      nombre: materiaPrima?.nombre || '',
      descripcion: materiaPrima?.descripcion || '',
      id_categoria: materiaPrima?.id_categoria?.toString() || '',
      id_unidad_base: materiaPrima?.id_unidad_base?.toString() || '',
      stock_actual: materiaPrima?.stock_actual ?? 0,
      stock_minimo: materiaPrima?.stock_minimo ?? 0,
      purchaseUnitType: materiaPrima?.purchaseUnitType || '',
      unitsPurchased: materiaPrima?.unitsPurchased ?? undefined,
      totalPrice: materiaPrima?.totalPrice ?? undefined,
      imagen: materiaPrima?.imagen || '',
      estado: materiaPrima?.estado ?? true,
    },
  })

  // Watch values for auto-calculation
  const purchaseUnitType = form.watch('purchaseUnitType')
  const unitsPurchased = form.watch('unitsPurchased')
  const totalPrice = form.watch('totalPrice')

  // Calculate precioReferencia and totalGrams
  const { precioReferencia, totalGrams } = useMemo(() => {
    const qty = Number(unitsPurchased) || 0
    const total = Number(totalPrice) || 0
    const ppu = qty > 0 ? total / qty : 0
    const grams = convertToGrams(qty, purchaseUnitType || 'kg')
    return { precioReferencia: ppu, totalGrams: grams }
  }, [unitsPurchased, totalPrice, purchaseUnitType])

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch('/api/categorias?tipo=materias-primas')
        if (!res.ok) throw new Error('Error al cargar categorías')
        const data = await res.json()
        setCategorias(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Error al cargar categorías')
      } finally {
        setLoadingCategorias(false)
      }
    }

    async function fetchUnidades() {
      try {
        const res = await fetch('/api/unidades-medida')
        if (!res.ok) throw new Error('Error al cargar unidades')
        const data = await res.json()
        setUnidades(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Error al cargar unidades de medida')
      } finally {
        setLoadingUnidades(false)
      }
    }

    fetchCategorias()
    fetchUnidades()
  }, [])

  async function onSubmit(data: MateriaPrimaFormValues) {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        imagen: imageUrl || null,
        descripcion: data.descripcion || null,
        codigo: data.codigo || null,
        id_categoria: parseInt(data.id_categoria),
        id_unidad_base: parseInt(data.id_unidad_base),
        // En creación, stock_actual siempre es 0
        stock_actual: isEditing ? data.stock_actual : 0,
        // Enviar campos calculados
        pricePerUnit: precioReferencia || null,
        totalGrams: totalGrams || null,
        weightPerUnit: null,
        weightUnit: null,
        // Limpiar campos si no hay tipo de compra
        purchaseUnitType: data.purchaseUnitType || null,
        unitsPurchased: data.unitsPurchased ?? null,
        totalPrice: data.totalPrice ?? null,
      }

      let url = '/api/materias-primas'
      let method = 'POST'

      if (isEditing) {
        url = `/api/materias-primas/${materiaPrima.id}`
        method = 'PUT'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar materia prima')
      }

      toast.success(isEditing ? 'Materia prima actualizada' : 'Materia prima creada', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'La nueva materia prima se agregó al inventario',
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

  const fmtCurrency = (v: number) => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
  const fmtNumber = (v: number) => v.toLocaleString('es-AR', { maximumFractionDigits: 2 })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="Harina 000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="MP-001 (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción de la materia prima..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="id_categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategorias ? 'Cargando...' : 'Seleccionar...'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="id_unidad_base"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad Base *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingUnidades ? 'Cargando...' : 'Seleccionar...'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.nombre} ({u.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Stock: solo visible en edición */}
        {isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stock_actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Actual</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock_minimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Stock Mínimo: visible en creación (sin Stock Actual) */}
        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stock_minimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ====== Sección Compra (simplificada) ====== */}
        <div className="space-y-3 p-4 rounded-lg border border-marron/15 bg-mostaza/5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-marron">Compra</span>
            <span className="text-[10px] text-muted-foreground">(opcional)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Unidad de Compra */}
            <FormField
              control={form.control}
              name="purchaseUnitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de Compra</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PURCHASE_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cantidad Comprada */}
            <FormField
              control={form.control}
              name="unitsPurchased"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad Comprada</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Precio Total Pagado */}
            <FormField
              control={form.control}
              name="totalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Total Pagado ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Panel de cálculo automático */}
          {purchaseUnitType && Number(unitsPurchased) > 0 && Number(totalPrice) > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-md bg-card border border-marron/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Precio de Referencia</p>
                <p className="text-lg font-bold text-marron">
                  {fmtCurrency(precioReferencia)} / {purchaseUnitType}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  = {fmtCurrency(Number(totalPrice) || 0)} ÷ {fmtNumber(Number(unitsPurchased) || 0)} {purchaseUnitType}
                </p>
              </div>
              <div className="p-3 rounded-md bg-card border border-marron/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total en Gramos</p>
                <p className="text-lg font-bold text-oliva">{fmtNumber(totalGrams)} g</p>
                <p className="text-[10px] text-muted-foreground">Peso total equivalente</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <FormLabel>Foto</FormLabel>
          <div className="mt-2">
            <ImageUploaderProducto
              currentImage={materiaPrima?.imagen}
              onUpload={(url) => {
                setImageUrl(url)
                form.setValue('imagen', url)
              }}
              uploadUrl="/api/upload/materia-prima"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label className="text-sm font-normal cursor-pointer">
                  Activo
                </Label>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isEditing ? (
              'Guardar Cambios'
            ) : (
              'Crear Materia Prima'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
