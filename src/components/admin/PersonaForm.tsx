'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Loader2, Upload, X, UserCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import ContactosEditor, { type ContactoInput } from './ContactosEditor'
import dynamic from 'next/dynamic'
const SelectorUbicacion = dynamic(() => import('@/components/ui/SelectorUbicacion'), { ssr: false })

// ==================== Zod Schema ====================

const personaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  numero_documento: z.string().min(1, 'El documento es requerido'),
  fecha_nacimiento: z.string().optional(),
  tipo_persona: z.string().min(1, 'Seleccioná un tipo de persona'),
  observaciones: z.string().optional(),
  razon_social: z.string().optional(),
  cuit: z.string().optional(),
  condicion_iva: z.string().optional(),
  imagen: z.string().optional(),
  id_pais: z.string().optional(),
  id_provincia: z.string().optional(),
  id_departamento: z.string().optional(),
  id_municipio: z.string().optional(),
  direccion: z.string().optional(),
  referencia: z.string().optional(),
  id_tipo_direccion: z.string().optional(),
  es_principal_direccion: z.boolean().default(false),
})

type PersonaFormValues = z.infer<typeof personaSchema>

// ==================== Interfaces ====================

interface TipoPersona {
  id: number
  nombre: string
}

interface TipoDireccion {
  id: number
  nombre: string
}

interface TipoContacto {
  id: number
  nombre: string
}

interface GeoOption {
  id: number
  nombre: string
}

interface Persona {
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
  id_municipio?: number | null
  municipio?: {
    id: number
    nombre: string
    departamento: {
      id: number
      nombre: string
      id_provincia: number
      provincia: {
        id: number
        nombre: string
        id_pais: number
        pais: { id: number; nombre: string }
      }
    }
  } | null
  latitud?: number | null
  longitud?: number | null
  direccion_mapa?: string | null
  ubicacion_valida?: boolean | null
  contactos?: Array<{
    id: number
    id_tipo_contacto: number
    valor: string
    es_principal: boolean
    tipo: { id: number; nombre: string }
  }>
  direcciones?: Array<{
    id: number
    id_tipo_direccion: number
    id_municipio?: number | null
    direccion: string
    referencia?: string | null
    es_principal: boolean
    tipo: { id: number; nombre: string }
  }>
}

interface PersonaFormProps {
  persona?: Persona | null
  onSuccess: () => void
}

// ==================== Condición IVA Options ====================

const CONDICIONES_IVA = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
  { value: 'exento', label: 'Exento' },
]

// ==================== Component ====================

export default function PersonaForm({ persona, onSuccess }: PersonaFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState(persona?.imagen || '')
  const [uploading, setUploading] = useState(false)
  const [fiscalOpen, setFiscalOpen] = useState(!!persona?.cuit || !!persona?.razon_social)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Geographic data
  const [tiposPersona, setTiposPersona] = useState<TipoPersona[]>([])
  const [tiposDireccion, setTiposDireccion] = useState<TipoDireccion[]>([])
  const [tiposContacto, setTiposContacto] = useState<TipoContacto[]>([])
  const [paises, setPaises] = useState<GeoOption[]>([])
  const [provincias, setProvincias] = useState<GeoOption[]>([])
  const [departamentos, setDepartamentos] = useState<GeoOption[]>([])
  const [municipios, setMunicipios] = useState<GeoOption[]>([])

  // Contactos
  const [contactos, setContactos] = useState<ContactoInput[]>([])

  // Ubicación en mapa
  const [latitud, setLatitud] = useState<number | null>(persona?.latitud ?? null)
  const [longitud, setLongitud] = useState<number | null>(persona?.longitud ?? null)
  const [ubicacionValida, setUbicacionValida] = useState(persona?.ubicacion_valida ?? false)

  const isEditing = !!persona

  // Determine initial geographic values from existing persona
  const initialPais = persona?.municipio?.departamento?.provincia?.id_pais
    ? String(persona.municipio.departamento.provincia.id_pais)
    : ''
  const initialProvincia = persona?.municipio?.departamento?.id_provincia
    ? String(persona.municipio.departamento.id_provincia)
    : ''
  const initialDepartamento = persona?.municipio?.departamento?.id
    ? String(persona.municipio.departamento.id)
    : ''
  const initialMunicipio = persona?.municipio?.id
    ? String(persona.municipio.id)
    : ''

  // Get the primary direccion from persona
  const primaryDireccion = persona?.direcciones?.find((d) => d.es_principal) || persona?.direcciones?.[0]

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      nombre: persona?.nombre || '',
      apellido: persona?.apellido || '',
      numero_documento: persona?.numero_documento || '',
      fecha_nacimiento: persona?.fecha_nacimiento
        ? new Date(persona.fecha_nacimiento).toISOString().split('T')[0]
        : '',
      tipo_persona: persona?.tipo_persona || '',
      observaciones: persona?.observaciones || '',
      razon_social: persona?.razon_social || '',
      cuit: persona?.cuit || '',
      condicion_iva: persona?.condicion_iva || '',
      imagen: persona?.imagen || '',
      id_pais: initialPais,
      id_provincia: initialProvincia,
      id_departamento: initialDepartamento,
      id_municipio: initialMunicipio,
      direccion: primaryDireccion?.direccion || '',
      referencia: primaryDireccion?.referencia || '',
      id_tipo_direccion: primaryDireccion?.id_tipo_direccion
        ? String(primaryDireccion.id_tipo_direccion)
        : '',
      es_principal_direccion: primaryDireccion?.es_principal ?? true,
    },
  })

  // ==================== Fetch initial data ====================

  const fetchInitialData = useCallback(async () => {
    try {
      const [tiposPRes, tiposDRes, tiposCRes, paisesRes] = await Promise.all([
        fetch('/api/geografia?tipo=tipos_persona'),
        fetch('/api/geografia?tipo=tipos_direccion'),
        fetch('/api/geografia?tipo=tipos_contacto'),
        fetch('/api/geografia?tipo=paises'),
      ])

      const tiposP = await tiposPRes.json()
      const tiposD = await tiposDRes.json()
      const tiposC = await tiposCRes.json()
      const paisesData = await paisesRes.json()

      setTiposPersona(Array.isArray(tiposP) ? tiposP : [])
      setTiposDireccion(Array.isArray(tiposD) ? tiposD : [])
      setTiposContacto(Array.isArray(tiposC) ? tiposC : [])
      setPaises(Array.isArray(paisesData) ? paisesData : [])
    } catch {
      toast.error('Error al cargar datos iniciales')
    }
  }, [])

  // Load initial contactos from persona
  useEffect(() => {
    if (persona?.contactos) {
      setContactos(
        persona.contactos.map((c) => ({
          id_tipo_contacto: c.id_tipo_contacto,
          valor: c.valor,
          es_principal: c.es_principal,
        }))
      )
    }
  }, [persona])

  // Load initial data (paises, tipos)
  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // ==================== Precargar datos geográficos al editar ====================
  // Cuando se edita una persona existente con municipio, precargar en cascada:
  // provincias del país → departamentos de la provincia → municipios del departamento
  useEffect(() => {
    if (!isEditing || !initialPais) return

    let cancelled = false

    async function preloadGeo() {
      try {
        // 1. Cargar provincias del país inicial
        const provRes = await fetch(`/api/geografia?tipo=provincias&id=${initialPais}`)
        const provData = await provRes.json()
        if (cancelled) return
        setProvincias(Array.isArray(provData) ? provData : [])

        // 2. Cargar departamentos de la provincia inicial
        if (initialProvincia) {
          const depRes = await fetch(`/api/geografia?tipo=departamentos&id=${initialProvincia}`)
          const depData = await depRes.json()
          if (cancelled) return
          setDepartamentos(Array.isArray(depData) ? depData : [])

          // 3. Cargar municipios del departamento inicial
          if (initialDepartamento) {
            const munRes = await fetch(`/api/geografia?tipo=municipios&id=${initialDepartamento}`)
            const munData = await munRes.json()
            if (cancelled) return
            setMunicipios(Array.isArray(munData) ? munData : [])
          }
        }
      } catch (err) {
        console.error('Error al precargar datos geográficos:', err)
      }
    }

    preloadGeo()
    return () => { cancelled = true }
  }, [isEditing, initialPais, initialProvincia, initialDepartamento])

  // ==================== Cascading geographic selects ====================

  // These handlers are the SOLE source of truth for cascading selects.
  // No useEffect subscriptions needed — the Select onValueChange calls these directly.

  const handlePaisChange = (value: string) => {
    form.setValue('id_pais', value)
    form.setValue('id_provincia', '')
    form.setValue('id_departamento', '')
    form.setValue('id_municipio', '')
    setProvincias([])
    setDepartamentos([])
    setMunicipios([])
    if (value) {
      fetch(`/api/geografia?tipo=provincias&id=${value}`)
        .then((res) => res.json())
        .then((data) => setProvincias(Array.isArray(data) ? data : []))
        .catch(() => setProvincias([]))
    }
  }

  const handleProvinciaChange = (value: string) => {
    form.setValue('id_provincia', value)
    form.setValue('id_departamento', '')
    form.setValue('id_municipio', '')
    setDepartamentos([])
    setMunicipios([])
    if (value) {
      fetch(`/api/geografia?tipo=departamentos&id=${value}`)
        .then((res) => res.json())
        .then((data) => setDepartamentos(Array.isArray(data) ? data : []))
        .catch(() => setDepartamentos([]))
    }
  }

  const handleDepartamentoChange = (value: string) => {
    form.setValue('id_departamento', value)
    form.setValue('id_municipio', '')
    setMunicipios([])
    if (value) {
      fetch(`/api/geografia?tipo=municipios&id=${value}`)
        .then((res) => res.json())
        .then((data) => setMunicipios(Array.isArray(data) ? data : []))
        .catch(() => setMunicipios([]))
    }
  }

  // ==================== Image upload ====================

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/persona', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Error al subir imagen')

      const data = await res.json()
      setImageUrl(data.url)
      form.setValue('imagen', data.url)
      toast.success('Foto subida correctamente')
    } catch {
      toast.error('Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  // ==================== Submit ====================

  async function onSubmit(data: PersonaFormValues) {
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        nombre: data.nombre,
        apellido: data.apellido,
        numero_documento: data.numero_documento,
        fecha_nacimiento: data.fecha_nacimiento || null,
        tipo_persona: data.tipo_persona,
        observaciones: data.observaciones || null,
        razon_social: data.razon_social || null,
        cuit: data.cuit || null,
        condicion_iva: data.condicion_iva || null,
        imagen: imageUrl || null,
        id_municipio: data.id_municipio ? parseInt(data.id_municipio) : null,
        contactos: contactos.filter((c) => c.valor.trim() !== ''),
        latitud: latitud,
        longitud: longitud,
        direccion_mapa: data.direccion || null,
        ubicacion_valida: ubicacionValida,
        direcciones: data.direccion
          ? [
              {
                id_tipo_direccion: data.id_tipo_direccion
                  ? parseInt(data.id_tipo_direccion)
                  : 1,
                id_municipio: data.id_municipio
                  ? parseInt(data.id_municipio)
                  : null,
                direccion: data.direccion,
                referencia: data.referencia || null,
                es_principal: data.es_principal_direccion,
              },
            ]
          : [],
      }

      const url = isEditing ? `/api/personas/${persona.id}` : '/api/personas'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al guardar persona')
      }

      toast.success(isEditing ? 'Persona actualizada' : 'Persona creada', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'La nueva persona fue registrada exitosamente',
      })

      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar'
      toast.error('Error al guardar', { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ===== Datos Personales ===== */}
        <div>
          <h3 className="text-sm font-semibold text-marron mb-3">Datos Personales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido *</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numero_documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento *</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha_nacimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_persona"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de persona *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposPersona.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nombre}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notas adicionales..."
                    className="resize-none"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* ===== Datos Fiscales (colapsable) ===== */}
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-marron hover:text-mostaza transition-colors"
            onClick={() => setFiscalOpen(!fiscalOpen)}
          >
            Datos Fiscales
            {fiscalOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {fiscalOpen && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="razon_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón social</FormLabel>
                    <FormControl>
                      <Input placeholder="Pastas Orlando S.R.L." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cuit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CUIT</FormLabel>
                    <FormControl>
                      <Input placeholder="20-12345678-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condicion_iva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición IVA</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONDICIONES_IVA.map((cond) => (
                          <SelectItem key={cond.value} value={cond.value}>
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* ===== Foto ===== */}
        <div>
          <Label className="text-sm font-semibold text-marron">Foto</Label>
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(file)
              }}
            />

            {imageUrl ? (
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-mostaza/30">
                  <Image
                    src={imageUrl}
                    alt="Foto de persona"
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rojo/30 text-rojo hover:bg-rojo/10"
                    onClick={() => {
                      setImageUrl('')
                      form.setValue('imagen', '')
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-dashed border-marron/20 hover:border-mostaza/50 hover:bg-mostaza/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
                ) : (
                  <UserCircle className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {uploading ? 'Subiendo foto...' : 'Clic para subir foto'}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP hasta 5MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* ===== Dirección ===== */}
        <div>
          <h3 className="text-sm font-semibold text-marron mb-3">Dirección</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* País */}
            <FormField
              control={form.control}
              name="id_pais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handlePaisChange(value)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paises.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provincia */}
            <FormField
              control={form.control}
              name="id_provincia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provincia</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleProvinciaChange(value)
                    }}
                    value={field.value}
                    disabled={!form.watch('id_pais')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar provincia..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provincias.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Departamento */}
            <FormField
              control={form.control}
              name="id_departamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleDepartamentoChange(value)
                    }}
                    value={field.value}
                    disabled={!form.watch('id_provincia')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departamentos.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Municipio */}
            <FormField
              control={form.control}
              name="id_municipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!form.watch('id_departamento')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar municipio..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {municipios.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dirección (calle) */}
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Costanera 1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Referencia */}
            <FormField
              control={form.control}
              name="referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Cerca del puente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo dirección */}
            <FormField
              control={form.control}
              name="id_tipo_direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de dirección</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposDireccion.map((tipo) => (
                        <SelectItem key={tipo.id} value={String(tipo.id)}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="es_principal_direccion"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 mt-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">
                  Dirección principal
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* ===== Ubicación en Mapa ===== */}
        <div>
          <h3 className="text-sm font-semibold text-marron mb-3">📍 Ubicación en el mapa</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Marcá la ubicación exacta en el mapa. Esto permite usar la función &quot;Cómo llegar&quot; para entregas y visitas.
          </p>
          <SelectorUbicacion
            onLocationSelect={(lat: number, lng: number) => {
              setLatitud(lat)
              setLongitud(lng)
              setUbicacionValida(true)
            }}
            latitudInicial={latitud ?? undefined}
            longitudInicial={longitud ?? undefined}
          />
          {latitud && longitud && (
            <div className="mt-2 text-sm text-oliva flex items-center gap-1">
              ✅ Ubicación seleccionada: {latitud.toFixed(6)}, {longitud.toFixed(6)}
            </div>
          )}
          {!latitud && !longitud && (
            <div className="mt-2 text-sm text-muted-foreground italic">
              No se ha seleccionado ubicación
            </div>
          )}
        </div>

        <Separator />

        {/* ===== Contactos ===== */}
        <ContactosEditor
          contactos={contactos}
          onChange={setContactos}
          tiposContacto={tiposContacto}
        />

        {/* ===== Submit ===== */}
        <div className="flex justify-end gap-2 pt-2">
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
              'Crear Persona'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
