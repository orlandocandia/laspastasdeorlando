'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
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
import ImageUploader from './ImageUploader'

const CATEGORIAS = ['Rellenos', 'Secos', 'Ñoquis', 'Especiales'] as const

const productoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  categoria: z.string().min(1, 'Seleccioná una categoría'),
  precio: z.coerce.number().min(0.01, 'El precio debe ser mayor a 0'),
  peso: z.string().min(1, 'Ingresá el peso'),
  imagen: z.string().optional(),
  stock: z.boolean().default(true),
  destacado: z.boolean().default(false),
})

type ProductoFormValues = z.infer<typeof productoSchema>

interface Producto {
  id: number
  nombre: string
  descripcion?: string | null
  categoria: string
  precio: number
  peso: string
  imagen?: string | null
  stock: boolean
  destacado: boolean
}

interface ProductoFormProps {
  producto?: Producto | null
  onSuccess: () => void
}

export default function ProductoForm({ producto, onSuccess }: ProductoFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState(producto?.imagen || '')

  const isEditing = !!producto

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: producto?.nombre || '',
      descripcion: producto?.descripcion || '',
      categoria: producto?.categoria || '',
      precio: producto?.precio || 0,
      peso: producto?.peso || '500g',
      imagen: producto?.imagen || '',
      stock: producto?.stock ?? true,
      destacado: producto?.destacado ?? false,
    },
  })

  async function onSubmit(data: ProductoFormValues) {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        imagen: imageUrl || null,
        descripcion: data.descripcion || null,
      }

      const url = isEditing ? '/api/productos' : '/api/productos'
      const method = isEditing ? 'PUT' : 'POST'

      if (isEditing) {
        Object.assign(payload, { id: producto.id })
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Error al guardar producto')
      }

      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'El nuevo producto se agregó al catálogo',
      })

      onSuccess()
    } catch {
      toast.error('Error al guardar', {
        description: 'Intentá de nuevo más tarde',
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
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Sorrentinos de Jamón y Queso" {...field} />
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
                  placeholder="Descripción del producto..."
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
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
            name="precio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="peso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso</FormLabel>
                <FormControl>
                  <Input placeholder="500g" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Imagen</FormLabel>
          <div className="mt-2">
            <ImageUploader
              currentImage={producto?.imagen}
              onUpload={(url) => {
                setImageUrl(url)
                form.setValue('imagen', url)
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">
                  En stock
                </FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destacado"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">
                  Destacado
                </FormLabel>
                <FormDescription className="sr-only">
                  Los productos destacados aparecen primero en el catálogo
                </FormDescription>
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
              'Crear Producto'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
