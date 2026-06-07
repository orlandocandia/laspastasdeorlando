'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Loader2, Upload, X, Search, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// ==================== Zod Schema ====================

const usuarioSchema = z.object({
  id_persona: z.number().min(1, 'Seleccioná una persona'),
  email: z.string().email('Ingresá un email válido'),
  password: z.string().optional(),
  roles: z.array(z.number()).min(1, 'Seleccioná al menos un rol'),
  imagen: z.string().optional(),
  estado: z.boolean().default(true),
})

type UsuarioFormValues = z.infer<typeof usuarioSchema>

// ==================== Interfaces ====================

interface Rol {
  id: number
  nombre: string
  descripcion?: string | null
}

interface PersonaOption {
  id: number
  nombre: string
  apellido: string
  numero_documento: string
}

interface Usuario {
  id: number
  id_persona: number
  email: string
  imagen?: string | null
  estado: boolean
  persona: {
    id: number
    nombre: string
    apellido: string
    numero_documento: string
  }
  roles: Array<{
    id_usuario: number
    id_rol: number
    rol: { id: number; nombre: string; descripcion?: string | null }
  }>
}

interface UsuarioFormProps {
  usuario?: Usuario | null
  onSuccess: () => void
}

// ==================== Component ====================

export default function UsuarioForm({ usuario, onSuccess }: UsuarioFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState(usuario?.imagen || '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Roles
  const [roles, setRoles] = useState<Rol[]>([])

  // Persona search
  const [personaSearch, setPersonaSearch] = useState('')
  const [personaOptions, setPersonaOptions] = useState<PersonaOption[]>([])
  const [personaPopoverOpen, setPersonaPopoverOpen] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaOption | null>(
    usuario?.persona
      ? {
          id: usuario.persona.id,
          nombre: usuario.persona.nombre,
          apellido: usuario.persona.apellido,
          numero_documento: usuario.persona.numero_documento,
        }
      : null
  )

  const isEditing = !!usuario

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      id_persona: usuario?.id_persona || 0,
      email: usuario?.email || '',
      password: '',
      roles: usuario?.roles?.map((r) => r.id_rol) || [],
      imagen: usuario?.imagen || '',
      estado: usuario?.estado ?? true,
    },
  })

  // Fetch roles
  useEffect(() => {
    fetch('/api/geografia?tipo=roles')
      .then((res) => res.json())
      .then((data) => {
        setRoles(Array.isArray(data) ? data : [])
      })
      .catch(() => setRoles([]))
  }, [])

  // Search personas
  const searchPersonas = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPersonaOptions([])
      return
    }
    try {
      const res = await fetch(`/api/personas?buscar=${encodeURIComponent(query)}&limite=10`)
      if (!res.ok) return
      const data = await res.json()
      setPersonaOptions(Array.isArray(data.personas) ? data.personas : [])
    } catch {
      setPersonaOptions([])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPersonas(personaSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [personaSearch, searchPersonas])

  // Select persona
  const selectPersona = (persona: PersonaOption) => {
    setSelectedPersona(persona)
    form.setValue('id_persona', persona.id)
    setPersonaPopoverOpen(false)
    setPersonaSearch('')
  }

  // Image upload
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

      const res = await fetch('/api/upload/usuario', {
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

  // Submit
  async function onSubmit(data: UsuarioFormValues) {
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        id_persona: data.id_persona,
        email: data.email,
        roles: data.roles,
        imagen: imageUrl || null,
        estado: data.estado,
      }

      // Only include password if provided
      if (data.password && data.password.trim() !== '') {
        payload.password = data.password
      }

      const url = isEditing ? `/api/usuarios/${usuario.id}` : '/api/usuarios'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al guardar usuario')
      }

      toast.success(isEditing ? 'Usuario actualizado' : 'Usuario creado', {
        description: isEditing
          ? 'Los cambios se guardaron correctamente'
          : 'El nuevo usuario fue registrado exitosamente',
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* ===== Persona selector ===== */}
        <FormField
          control={form.control}
          name="id_persona"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persona *</FormLabel>
              <div className="flex gap-2">
                <Popover open={personaPopoverOpen} onOpenChange={setPersonaPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start border-marron/10 hover:border-mostaza/50"
                      type="button"
                    >
                      {selectedPersona ? (
                        <span className="truncate">
                          {selectedPersona.nombre} {selectedPersona.apellido} - {selectedPersona.numero_documento}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Buscar persona...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-80" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nombre o documento..."
                        value={personaSearch}
                        onValueChange={setPersonaSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {personaSearch.length < 2
                            ? 'Escribí al menos 2 caracteres'
                            : 'No se encontraron personas'}
                        </CommandEmpty>
                        <CommandGroup>
                          {personaOptions.map((p) => (
                            <CommandItem
                              key={p.id}
                              onSelect={() => selectPersona(p)}
                              className="cursor-pointer"
                            >
                              <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>
                                {p.nombre} {p.apellido}
                              </span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {p.numero_documento}
                              </Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedPersona && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hover:bg-rojo/10"
                    onClick={() => {
                      setSelectedPersona(null)
                      form.setValue('id_persona', 0)
                    }}
                  >
                    <X className="h-4 w-4 text-rojo" />
                  </Button>
                )}
              </div>
              {!selectedPersona && !isEditing && (
                <FormDescription>
                  Si no encontrás la persona, creala primero en la sección de Personas.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== Email ===== */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== Password ===== */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña {isEditing ? '' : '*'}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              {isEditing && (
                <FormDescription>
                  Dejar vacío para no cambiar la contraseña actual
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== Roles ===== */}
        <FormField
          control={form.control}
          name="roles"
          render={() => (
            <FormItem>
              <FormLabel>Roles *</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {roles.map((rol) => (
                  <FormField
                    key={rol.id}
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(rol.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || []
                              if (checked) {
                                field.onChange([...current, rol.id])
                              } else {
                                field.onChange(current.filter((v: number) => v !== rol.id))
                              }
                            }}
                          />
                        </FormControl>
                        <Label className="text-sm font-normal cursor-pointer">
                          {rol.nombre}
                        </Label>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== Imagen ===== */}
        <div>
          <Label className="text-sm font-medium">Foto de perfil</Label>
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
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-mostaza/30">
                  <Image
                    src={imageUrl}
                    alt="Foto de perfil"
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
                  <Loader2 className="h-6 w-6 animate-spin text-mostaza" />
                ) : (
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Subiendo foto...' : 'Clic para subir foto de perfil'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== Estado ===== */}
        <FormField
          control={form.control}
          name="estado"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-marron/10 p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">Estado</FormLabel>
                <FormDescription>
                  {field.value ? 'El usuario puede iniciar sesión' : 'El usuario está deshabilitado'}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
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
              'Crear Usuario'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
