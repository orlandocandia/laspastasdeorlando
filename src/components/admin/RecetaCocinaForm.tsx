'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, X, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ImageUploader from './ImageUploader'

interface RecetaCocinaFormProps {
  receta?: {
    id: number
    titulo: string
    descripcion: string | null
    ingredientes: string
    pasos: string
    tiempo_preparacion: string | null
    tiempo_coccion: string | null
    dificultad: string
    imagen: string | null
    categoria: string | null
    visible_en_landing: boolean
    destacado: boolean
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

const DIFICULTADES = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Media' },
  { value: 'dificil', label: 'Difícil' },
]

const CATEGORIAS = [
  { value: 'salsas', label: 'Salsas' },
  { value: 'pastas', label: 'Pastas' },
  { value: 'postres', label: 'Postres' },
  { value: 'aperitivos', label: 'Aperitivos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'otros', label: 'Otros' },
]

export default function RecetaCocinaForm({ receta, onSuccess, onCancel }: RecetaCocinaFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    ingredientes: '',
    pasos: '',
    tiempo_preparacion: '',
    tiempo_coccion: '',
    dificultad: 'facil',
    imagen: '',
    categoria: 'otros',
    visible_en_landing: false,
    destacado: false,
  })

  useEffect(() => {
    if (receta) {
      setFormData({
        titulo: receta.titulo || '',
        descripcion: receta.descripcion || '',
        ingredientes: receta.ingredientes || '',
        pasos: receta.pasos || '',
        tiempo_preparacion: receta.tiempo_preparacion || '',
        tiempo_coccion: receta.tiempo_coccion || '',
        dificultad: receta.dificultad || 'facil',
        imagen: receta.imagen || '',
        categoria: receta.categoria || 'otros',
        visible_en_landing: receta.visible_en_landing || false,
        destacado: receta.destacado || false,
      })
    }
  }, [receta])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim() || !formData.ingredientes.trim() || !formData.pasos.trim()) {
      toast.error('Título, ingredientes y pasos son obligatorios')
      return
    }

    setSaving(true)
    try {
      const url = receta
        ? `/api/recetas-cocina/${receta.id}`
        : '/api/recetas-cocina'
      const method = receta ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar')
      }

      toast.success(receta ? 'Receta actualizada' : 'Receta creada')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/recetas-cocina')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar receta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Ej: Salsa de tomate casera"
          required
        />
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción corta</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Breve descripción de la receta..."
          rows={2}
        />
      </div>

      {/* Grid: tiempos, dificultad, categoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tiempo_preparacion">Tiempo preparación</Label>
          <Input
            id="tiempo_preparacion"
            value={formData.tiempo_preparacion}
            onChange={(e) => setFormData({ ...formData, tiempo_preparacion: e.target.value })}
            placeholder="30 min"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiempo_coccion">Tiempo cocción</Label>
          <Input
            id="tiempo_coccion"
            value={formData.tiempo_coccion}
            onChange={(e) => setFormData({ ...formData, tiempo_coccion: e.target.value })}
            placeholder="15 min"
          />
        </div>
        <div className="space-y-2">
          <Label>Dificultad</Label>
          <Select
            value={formData.dificultad}
            onValueChange={(v) => setFormData({ ...formData, dificultad: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFICULTADES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            value={formData.categoria}
            onValueChange={(v) => setFormData({ ...formData, categoria: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="space-y-2">
        <Label htmlFor="ingredientes">Ingredientes *</Label>
        <Textarea
          id="ingredientes"
          value={formData.ingredientes}
          onChange={(e) => setFormData({ ...formData, ingredientes: e.target.value })}
          placeholder="Texto libre - copiar y pegar rápido...&#10;Ej:&#10;- 500g harina&#10;- 3 huevos&#10;- Sal a gusto"
          rows={6}
          required
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Texto libre para copiar/pegar rápido. No requiere formato especial.
        </p>
      </div>

      {/* Pasos */}
      <div className="space-y-2">
        <Label htmlFor="pasos">Pasos *</Label>
        <Textarea
          id="pasos"
          value={formData.pasos}
          onChange={(e) => setFormData({ ...formData, pasos: e.target.value })}
          placeholder="Texto libre - copiar y pegar rápido...&#10;Ej:&#10;1. Mezclar harina y huevos&#10;2. Amasar 10 min&#10;3. Reposar 30 min"
          rows={8}
          required
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Texto libre para copiar/pegar rápido. No requiere formato especial.
        </p>
      </div>

      {/* Imagen */}
      <div className="space-y-2">
        <Label>Imagen</Label>
        <ImageUploader
          currentImage={formData.imagen}
          onUpload={(url) => setFormData({ ...formData, imagen: url })}
        />
      </div>

      {/* Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-marron/10 p-3">
          <Switch
            checked={formData.visible_en_landing}
            onCheckedChange={(v) => setFormData({ ...formData, visible_en_landing: v })}
          />
          <div>
            <Label className="cursor-pointer">Visible en Landing</Label>
            <p className="text-xs text-muted-foreground">Mostrar en la página pública</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-marron/10 p-3">
          <Switch
            checked={formData.destacado}
            onCheckedChange={(v) => setFormData({ ...formData, destacado: v })}
          />
          <div>
            <Label className="cursor-pointer">Destacada</Label>
            <p className="text-xs text-muted-foreground">Aparece primero en la landing</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : router.push('/admin/recetas-cocina'))}
          disabled={saving}
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {receta ? 'Actualizar' : 'Crear'} Receta
        </Button>
      </div>
    </form>
  )
}
