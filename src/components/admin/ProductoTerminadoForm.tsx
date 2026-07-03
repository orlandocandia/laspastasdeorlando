'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { Loader2, Barcode, PackagePlus, TrendingUp, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { StockInitialLoadDialog } from './StockInitialLoadDialog'

const productoTerminadoSchema = z.object({
  codigo: z.string().optional(),
  codigo_barras: z.string().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  id_categoria: z.string().min(1, 'Seleccioná una categoría'),
  tipo_harina: z.string().optional(),
  seccion: z.string().nullable().optional(),
  peso_unitario_aprox: z.coerce.number().min(0, 'El peso no puede ser negativo').default(0),
  unidades: z.coerce.number().min(1, 'Debe tener al menos 1 unidad').optional().nullable(),
  precio_venta: z.coerce.number().min(0, 'El precio no puede ser negativo').default(0),
  stock_minimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').default(0),
  destacado: z.boolean().default(false),
  orden: z.coerce.number().min(0, 'El orden no puede ser negativo').default(0),
  visible_en_landing: z.boolean().default(true),
  imagen: z.string().optional(),
  modo_coccion: z.string().optional(),
  texto_frente: z.string().optional(),
  texto_reverso: z.string().optional(),
  estado: z.boolean().default(true),
})

type ProductoTerminadoFormValues = z.infer<typeof productoTerminadoSchema>

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

interface Categoria {
  id: number
  nombre: string
}

interface ProductoTerminadoFormProps {
  productoTerminado?: any | null
  onSuccess: () => void
}

export default function ProductoTerminadoForm({ productoTerminado, onSuccess }: ProductoTerminadoFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState(productoTerminado?.imagen || '')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [proximoCodigoBarras, setProximoCodigoBarras] = useState<string | null>(null)
  const [stockInitialOpen, setStockInitialOpen] = useState(false)
  const [stockActualLocal, setStockActualLocal] = useState(productoTerminado?.stock_actual ?? 0)

  const isEditing = !!productoTerminado

  const form = useForm<ProductoTerminadoFormValues>({
    resolver: zodResolver(productoTerminadoSchema),
    defaultValues: {
      codigo: productoTerminado?.codigo || '',
      codigo_barras: productoTerminado?.codigo_barras || '',
      nombre: productoTerminado?.nombre || '',
      descripcion: productoTerminado?.descripcion || '',
      id_categoria: productoTerminado?.id_categoria?.toString() || '',
      tipo_harina: productoTerminado?.tipo_harina || '',
      seccion: productoTerminado?.seccion ?? null,
      peso_unitario_aprox: productoTerminado?.peso_unitario_aprox ?? 0,
      unidades: productoTerminado?.unidades ?? undefined,
      precio_venta: productoTerminado?.precio_venta ?? 0,
      stock_minimo: productoTerminado?.stock_minimo ?? 0,
      destacado: productoTerminado?.destacado ?? false,
      orden: productoTerminado?.orden ?? 0,
      visible_en_landing: productoTerminado?.visible_en_landing ?? true,
      imagen: productoTerminado?.imagen || '',
      modo_coccion: productoTerminado?.modo_coccion || '',
      texto_frente: productoTerminado?.texto_frente || '',
      texto_reverso: productoTerminado?.texto_reverso || '',
      estado: productoTerminado?.estado ?? true,
    },
  })

  // Reset form and imageUrl when switching products
  useEffect(() => {
    const defaults = {
      codigo: productoTerminado?.codigo || '',
      codigo_barras: productoTerminado?.codigo_barras || '',
      nombre: productoTerminado?.nombre || '',
      descripcion: productoTerminado?.descripcion || '',
      id_categoria: productoTerminado?.id_categoria?.toString() || '',
      tipo_harina: productoTerminado?.tipo_harina || '',
      seccion: productoTerminado?.seccion ?? null,
      peso_unitario_aprox: productoTerminado?.peso_unitario_aprox ?? 0,
      unidades: productoTerminado?.unidades ?? undefined,
      precio_venta: productoTerminado?.precio_venta ?? 0,
      stock_minimo: productoTerminado?.stock_minimo ?? 0,
      destacado: productoTerminado?.destacado ?? false,
      orden: productoTerminado?.orden ?? 0,
      visible_en_landing: productoTerminado?.visible_en_landing ?? true,
      imagen: productoTerminado?.imagen || '',
      modo_coccion: productoTerminado?.modo_coccion || '',
      texto_frente: productoTerminado?.texto_frente || '',
      texto_reverso: productoTerminado?.texto_reverso || '',
      estado: productoTerminado?.estado ?? true,
    }
    form.reset(defaults)
    setImageUrl(productoTerminado?.imagen || '')
  }, [productoTerminado, form])

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch('/api/categorias?tipo=productos-terminados')
        if (!res.ok) throw new Error('Error al cargar categorías')
        const data = await res.json()
        setCategorias(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Error al cargar categorías')
      } finally {
        setLoadingCategorias(false)
      }
    }

    fetchCategorias()
  }, [])

  // Fetch next barcode for new products
  useEffect(() => {
    if (!isEditing) {
      async function fetchProximoCodigo() {
        try {
          const res = await fetch('/api/productos-terminados/generar-codigos-barras')
          if (res.ok) {
            const data = await res.json()
            setProximoCodigoBarras(data.proximo_codigo)
          }
        } catch {
          // Silently fail - barcode will be generated server-side
        }
      }
      fetchProximoCodigo()
    }
  }, [isEditing])

  async function onSubmit(data: ProductoTerminadoFormValues) {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        imagen: imageUrl || null,
        descripcion: data.descripcion || null,
        codigo: data.codigo || null,
        codigo_barras: data.codigo_barras || null,
        id_categoria: parseInt(data.id_categoria),
        tipo_harina: data.tipo_harina || null,
        seccion: data.seccion || null,
        unidades: data.unidades || null,
        modo_coccion: data.modo_coccion || null,
        texto_frente: data.texto_frente || null,
        texto_reverso: data.texto_reverso || null,
      }

      let url = '/api/productos-terminados'
      let method = 'POST'

      if (isEditing) {
        url = `/api/productos-terminados/${productoTerminado.id}`
        method = 'PUT'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar producto terminado')
      }

      toast.success(isEditing ? 'Producto terminado actualizado' : 'Producto terminado creado', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'El nuevo producto terminado se agregó al catálogo',
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
                <Input placeholder="Sorrentinos de Jamón y Queso" {...field} />
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
                <Input placeholder="PT-001 (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="codigo_barras"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de barras</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Ej: 7791234567890" {...field} />
              </FormControl>
              {!isEditing && !field.value && proximoCodigoBarras && (
                <div className="flex items-center gap-2 mt-1">
                  <Barcode className="h-3.5 w-3.5 text-mostaza" />
                  <p className="text-xs text-muted-foreground">
                    Se generará automáticamente: <span className="font-mono font-semibold text-marron">{proximoCodigoBarras}</span>
                  </p>
                </div>
              )}
              {isEditing && field.value && (
                <p className="text-xs text-muted-foreground">
                  Código EAN-13 asignado al producto
                </p>
              )}
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  Dejá vacío para generar automáticamente un código EAN-13 (779...)
                </p>
              )}
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
                  placeholder="Descripción del producto terminado..."
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
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="tipo_harina"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Harina</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin especificar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="con_gluten">Con Gluten</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                    <SelectItem value="sin_gluten">Sin Gluten</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="peso_unitario_aprox"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso Aprox. (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidades"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidades por paquete</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Ej: 12, 24"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? null : parseInt(val))
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Cantidad de unidades (ej: 12 empanadas). Dejá vacío si no aplica.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Selector de sección: Crudo / Horneado / Sin especificar */}
        <FormField
          control={form.control}
          name="seccion"
          render={({ field }) => {
            const value = field.value ?? ''
            return (
              <FormItem className="space-y-2">
                <FormLabel>Tipo de producto</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={value}
                    onValueChange={(v) => field.onChange(v === '' ? null : v)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1"
                  >
                    {/* Sin especificar */}
                    <label
                      htmlFor="seccion-none"
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                        value === ''
                          ? 'border-mostaza bg-mostaza/5 ring-1 ring-mostaza/30'
                          : 'border-input hover:border-mostaza/50 hover:bg-muted/40'
                      }`}
                    >
                      <RadioGroupItem value="" id="seccion-none" className="mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="block text-sm font-semibold text-marron">
                          🤷 Sin especificar
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Usa la sección de la categoría
                        </span>
                      </div>
                    </label>

                    {/* Crudo → pastas */}
                    <label
                      htmlFor="seccion-pastas"
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                        value === 'pastas'
                          ? 'border-mostaza bg-mostaza/5 ring-1 ring-mostaza/30'
                          : 'border-input hover:border-mostaza/50 hover:bg-muted/40'
                      }`}
                    >
                      <RadioGroupItem value="pastas" id="seccion-pastas" className="mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="block text-sm font-semibold text-marron">
                          🍝 Crudo
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Para cocinar en casa · va a <b>Pastas</b>
                        </span>
                      </div>
                    </label>

                    {/* Horneado → horneados */}
                    <label
                      htmlFor="seccion-horneados"
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                        value === 'horneados'
                          ? 'border-mostaza bg-mostaza/5 ring-1 ring-mostaza/30'
                          : 'border-input hover:border-mostaza/50 hover:bg-muted/40'
                      }`}
                    >
                      <RadioGroupItem value="horneados" id="seccion-horneados" className="mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="block text-sm font-semibold text-marron">
                          🔥 Horneado
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Listo para comer · va a <b>Horneados</b>
                        </span>
                      </div>
                    </label>
                  </RadioGroup>
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Si no elegís nada, se usa la sección de la categoría. Si el producto y su categoría no tienen sección, no se mostrará en la landing.
                </p>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="precio_venta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Venta *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
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
                  <Input type="number" step="1" min="0" placeholder="5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Stock actual - solo lectura + botón Cargar Stock */}
        {isEditing && (
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Stock Actual</span>
                <p className="text-lg font-bold text-marron">
                  {stockActualLocal} u.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setStockInitialOpen(true)}
                className="bg-oliva hover:bg-oliva/90 text-white font-semibold"
              >
                <PackagePlus className="mr-1.5 h-4 w-4" />
                Cargar Stock
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Se actualiza con producciones, ventas o cargas manuales
            </p>
          </div>
        )}

        {/* Margen de Ganancia */}
        {isEditing && (
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-mostaza" />
              <span className="text-sm font-semibold text-marron">Margen de Ganancia</span>
            </div>
            {productoTerminado?.costo_produccion === undefined ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Cargando datos de costo...</span>
              </div>
            ) : productoTerminado.tiene_receta === false && productoTerminado.costo_produccion === 0 ? (
              <div className="flex items-center gap-2 text-sm text-mostaza">
                <AlertCircle className="h-4 w-4" />
                <span>Sin receta asignada — no se puede calcular el costo</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Costo Producción</span>
                  <p className="text-sm font-bold text-marron">
                    {formatPrice(productoTerminado.costo_produccion || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Precio Venta</span>
                  <p className="text-sm font-bold text-marron">
                    {formatPrice(productoTerminado.precio_venta || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Margen ($)</span>
                  <p className="text-sm font-bold text-marron">
                    {formatPrice(productoTerminado.margen || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Margen (%)</span>
                  <p className={`text-sm font-bold ${
                    (productoTerminado.margen_porcentaje || 0) > 50
                      ? 'text-oliva'
                      : (productoTerminado.margen_porcentaje || 0) >= 30
                      ? 'text-mostaza'
                      : 'text-rojo'
                  }`}>
                    {(productoTerminado.margen_porcentaje || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
            {productoTerminado?.receta_activa && (
              <p className="text-xs text-muted-foreground mt-2">
                Basado en receta: {productoTerminado.receta_activa.nombre_receta} (rinde {productoTerminado.receta_activa.rendimiento_unidades} u.)
              </p>
            )}
          </div>
        )}

        {/* Stock Initial Load Dialog — solo visible al editar */}
        {isEditing && productoTerminado && (
          <StockInitialLoadDialog
            open={stockInitialOpen}
            onClose={() => setStockInitialOpen(false)}
            preselectedProduct={{
              id: productoTerminado.id,
              nombre: productoTerminado.nombre,
              stock_actual: stockActualLocal,
              stock_minimo: productoTerminado.stock_minimo ?? 0,
            }}
            onSuccess={async () => {
              // Refresh stock_actual from server
              try {
                const res = await fetch(`/api/productos-terminados/${productoTerminado.id}`)
                if (res.ok) {
                  const data = await res.json()
                  setStockActualLocal(data.stock_actual ?? 0)
                }
              } catch {
                // silent fail
              }
            }}
          />
        )}

        {/* Modo de cocción / uso — etiqueta dinámica según categoría */}
        <FormField
          control={form.control}
          name="modo_coccion"
          render={({ field }) => {
            const selectedCatId = form.watch('id_categoria')
            const selectedCat = categorias.find((c) => c.id.toString() === selectedCatId)
            const catNombre = selectedCat?.nombre?.toLowerCase() || ''

            const esCategoriaUso = /tapa|empanada|pastelito|pascualina|tarta/.test(catNombre)

            const etiqueta = esCategoriaUso
              ? '📦 Modo de uso y conservación (opcional)'
              : '🍝 Modo de cocción (opcional)'

            const placeholderUso = `📦 **Modo de Uso y Conservación**\n\n🌿 **Producto Fresco**\n🥟 Conservar refrigerado.\n🍴 Listo para usar.\n❄️ Si no lo utiliza, puede congelarlo.\n\n---\n\n❄️ **Producto Congelado**\n🧊 Descongelar en heladera.\n🥟 Utilizar una vez que las tapas estén flexibles.\n🚫 Evitar volver a congelar para conservar su textura y calidad.`

            const placeholderCoccion = `🍝 **Tallarines**\n\n🌾 **Frescos**\n💧 Agua hirviendo con sal a gusto.\n🍴 Separar suavemente los fideos durante el primer minuto.\n⏱️ Cocinar 4 a 5 min, revolviendo ocasionalmente.\n👨‍🍳 Probar antes de escurrir. Si es necesario, cocinar 1 o 2 min más.\n\n❄️ **Freezados**\n💧 Directo al agua hirviendo con sal a gusto.\n🍴 Separar suavemente los fideos durante el primer minuto.\n⏱️ Cocinar 6 a 8 min, revolviendo ocasionalmente.\n👨‍🍳 Probar antes de escurrir. Si es necesario, cocinar 1 o 2 min más.`

            const placeholder = esCategoriaUso ? placeholderUso : placeholderCoccion

            const helpText = esCategoriaUso
              ? '💡 Podés usar emojis (📦🌿🥟❄️🧊🚫🍴), negritas con **texto**, y saltos de línea. Si lo dejás vacío, se mostrará un enlace a WhatsApp.'
              : '💡 Podés usar emojis (🍝✅❄️⏱️👨‍🍳🥟🌾), negritas con **texto**, y saltos de línea. Si lo dejás vacío, se mostrará un enlace a WhatsApp.'

            return (
              <FormItem>
                <FormLabel>{etiqueta}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={placeholder}
                    className="resize-none"
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {helpText}
                </p>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        {/* Textos personalizados frente/reverso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="texto_frente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto del frente (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 🍝 Modo de cocción" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Se muestra al pasar el mouse sobre la tarjeta. Si lo dejás vacío, se usa el valor por defecto según categoría.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="texto_reverso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto del reverso (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 🍝 Modo de cocción" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Título en el reverso de la tarjeta. Si lo dejás vacío, se usa el valor por defecto según categoría.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Foto</FormLabel>
          <div className="mt-2">
            <ImageUploaderProducto
              currentImage={productoTerminado?.imagen}
              onUpload={(url) => {
                setImageUrl(url)
                form.setValue('imagen', url)
              }}
              uploadUrl="/api/upload/producto-terminado"
            />
          </div>
        </div>

        <Separator />

        {/* Landing Page Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-marron">Configuración Landing Page</h4>

          <div className="flex items-center gap-6">
            <FormField
              control={form.control}
              name="visible_en_landing"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label className="text-sm font-normal cursor-pointer">
                    Visible en landing
                  </Label>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destacado"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label className="text-sm font-normal cursor-pointer">
                    Destacado
                  </Label>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="orden"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden de aparición</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="0" placeholder="0" className="w-full sm:w-32" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

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
              'Crear Producto Terminado'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
