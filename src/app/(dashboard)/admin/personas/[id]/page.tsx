'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
const MapaLeaflet = dynamic(() => import('@/components/ui/MapaLeaflet'), { ssr: false })
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UserPlus,
  Loader2,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  Calendar,
  Hash,
  Shield,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import PersonaForm from '@/components/admin/PersonaForm'
import FichaPrintMenu from '@/components/admin/FichaPrintMenu'
import FichaPersonaDocument, { type FichaPersonaData } from '@/components/print/FichaPersonaPDFDocument'

// ==================== Interfaces ====================

interface Contacto {
  id: number
  id_tipo_contacto: number
  valor: string
  es_principal: boolean
  tipo: { id: number; nombre: string }
}

interface Direccion {
  id: number
  id_tipo_direccion: number
  id_municipio?: number | null
  direccion: string
  referencia?: string | null
  es_principal: boolean
  tipo: { id: number; nombre: string }
  municipio?: {
    id: number
    nombre: string
    departamento: {
      id: number
      nombre: string
      provincia: {
        id: number
        nombre: string
        pais: { id: number; nombre: string }
      }
    }
  } | null
}

interface Usuario {
  id: number
  email: string
  estado: boolean
  roles: Array<{
    id_rol: number
    rol: { id: number; nombre: string }
  }>
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
  latitud?: number | null
  longitud?: number | null
  direccion_mapa?: string | null
  ubicacion_valida?: boolean | null
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
  contactos: Contacto[]
  direcciones: Direccion[]
  usuario?: Usuario | null
}

// ==================== Condición IVA labels ====================

const condicionIvaLabels: Record<string, string> = {
  responsable_inscripto: 'Responsable Inscripto',
  monotributista: 'Monotributista',
  consumidor_final: 'Consumidor Final',
  exento: 'Exento',
}

// ==================== Contact type icons ====================

function getContactIcon(tipoNombre: string) {
  const lower = tipoNombre.toLowerCase()
  if (lower.includes('tel') || lower.includes('cel') || lower.includes('whatsapp')) {
    return <Phone className="h-4 w-4 text-oliva" />
  }
  if (lower.includes('mail') || lower.includes('email') || lower.includes('correo')) {
    return <Mail className="h-4 w-4 text-mostaza" />
  }
  return <FileText className="h-4 w-4 text-muted-foreground" />
}

// ==================== Tipo badge colors ====================

const tipoBadgeColors: Record<string, string> = {
  Cliente: 'bg-oliva/10 text-oliva',
  Proveedor: 'bg-mostaza/10 text-mostaza',
  Empleado: 'bg-rojo/10 text-rojo',
}

// ==================== Component ====================

export default function PersonaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [persona, setPersona] = useState<Persona | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchPersona = useCallback(async () => {
    try {
      const res = await fetch(`/api/personas/${params.id}`)
      if (!res.ok) throw new Error('Persona no encontrada')
      const data = await res.json()
      setPersona(data)
    } catch {
      toast.error('Error al cargar persona')
      router.push('/admin/personas')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchPersona()
  }, [fetchPersona])

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/personas/${persona?.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Persona eliminada')
      router.push('/admin/personas')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar'
      toast.error(message)
    } finally {
      setDeleteOpen(false)
    }
  }

  const handleEditSuccess = () => {
    setEditOpen(false)
    fetchPersona()
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  if (!persona) return null

  const principalDireccion = persona.direcciones?.find((d) => d.es_principal) || persona.direcciones?.[0]
  const hasFiscalData = persona.razon_social || persona.cuit || persona.condicion_iva

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-marron"
        onClick={() => router.push('/admin/personas')}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Personas
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Photo */}
        <div className="shrink-0">
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-mostaza/20 bg-muted">
            {persona.imagen ? (
              <Image
                src={persona.imagen}
                alt={`${persona.nombre} ${persona.apellido}`}
                fill
                loading="lazy"
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCircle className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-marron">
                {persona.nombre} {persona.apellido}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={tipoBadgeColors[persona.tipo_persona] || 'bg-marron/10 text-marron'}>
                  {persona.tipo_persona}
                </Badge>
                {persona.usuario && (
                  <Badge className="bg-oliva/10 text-oliva">
                    <Shield className="h-3 w-3 mr-1" />
                    Tiene usuario
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <FichaPrintMenu<FichaPersonaData>
                data={{
                  id: persona.id,
                  nombre: persona.nombre,
                  apellido: persona.apellido,
                  numero_documento: persona.numero_documento,
                  fecha_nacimiento: persona.fecha_nacimiento,
                  tipo_persona: persona.tipo_persona,
                  observaciones: persona.observaciones,
                  razon_social: persona.razon_social,
                  cuit: persona.cuit,
                  condicion_iva: persona.condicion_iva,
                  imagen: persona.imagen,
                  municipio: persona.municipio,
                  contactos: persona.contactos,
                  direcciones: persona.direcciones,
                }}
                DocumentComponent={FichaPersonaDocument}
                filename={`ficha-persona-${persona.id}`}
                label="Ficha de Persona"
                size="sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-rojo/30 text-rojo hover:bg-rojo/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos Personales */}
        <Card className="border-marron/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-marron flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium text-marron">{persona.nombre}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Apellido</p>
                <p className="font-medium text-marron">{persona.apellido}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Documento
                </p>
                <p className="font-medium text-marron">{persona.numero_documento}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Fecha de nacimiento
                </p>
                <p className="font-medium text-marron">{formatDate(persona.fecha_nacimiento)}</p>
              </div>
            </div>
            {persona.observaciones && (
              <>
                <Separator />
                <div className="text-sm">
                  <p className="text-muted-foreground">Observaciones</p>
                  <p className="text-marron">{persona.observaciones}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Datos Fiscales */}
        {hasFiscalData && (
          <Card className="border-marron/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                <Building className="h-4 w-4" />
                Datos Fiscales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 text-sm">
                {persona.razon_social && (
                  <div>
                    <p className="text-muted-foreground">Razón social</p>
                    <p className="font-medium text-marron">{persona.razon_social}</p>
                  </div>
                )}
                {persona.cuit && (
                  <div>
                    <p className="text-muted-foreground">CUIT</p>
                    <p className="font-medium text-marron">{persona.cuit}</p>
                  </div>
                )}
                {persona.condicion_iva && (
                  <div>
                    <p className="text-muted-foreground">Condición IVA</p>
                    <Badge variant="outline" className="border-marron/20 text-marron">
                      {condicionIvaLabels[persona.condicion_iva] || persona.condicion_iva}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dirección */}
        <Card className="border-marron/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-marron flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección
            </CardTitle>
          </CardHeader>
          <CardContent>
            {principalDireccion ? (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-marron">{principalDireccion.direccion}</p>
                  {principalDireccion.referencia && (
                    <p className="text-muted-foreground">{principalDireccion.referencia}</p>
                  )}
                </div>
                {principalDireccion.municipio && (
                  <p className="text-muted-foreground">
                    {principalDireccion.municipio.nombre}
                    {principalDireccion.municipio.departamento && (
                      <>, {principalDireccion.municipio.departamento.nombre}</>
                    )}
                    {principalDireccion.municipio.departamento?.provincia && (
                      <>, {principalDireccion.municipio.departamento.provincia.nombre}</>
                    )}
                  </p>
                )}
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-marron/20 text-xs">
                    {principalDireccion.tipo?.nombre || 'Dirección'}
                  </Badge>
                  {principalDireccion.es_principal && (
                    <Badge className="bg-mostaza/10 text-mostaza text-xs">Principal</Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin dirección registrada</p>
            )}
          </CardContent>
        </Card>

        {/* Ubicación en Mapa */}
        <Card className="border-marron/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-marron flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación en el Mapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {persona.latitud && persona.longitud ? (
              <div className="space-y-3">
                <MapaLeaflet
                  latitud={persona.latitud}
                  longitud={persona.longitud}
                  titulo={`${persona.nombre} ${persona.apellido}`}
                  direccion={persona.direccion_mapa || principalDireccion?.direccion || 'Sin dirección'}
                />
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${persona.latitud},${persona.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-oliva hover:bg-oliva/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    🗺️ Cómo llegar (Google Maps)
                  </a>
                  {persona.tipo_persona === 'Proveedor' && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-mostaza/10 px-2 py-1 rounded">
                      Proveedor — Ir a buscar mercadería
                    </span>
                  )}
                  {persona.tipo_persona === 'Cliente' && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-oliva/10 px-2 py-1 rounded">
                      Cliente — Llevar producto
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground italic">Sin ubicación en mapa registrada</p>
                <p className="text-xs text-muted-foreground">Editá la persona para marcar su ubicación</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contactos */}
        <Card className="border-marron/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-marron flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contactos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {persona.contactos && persona.contactos.length > 0 ? (
              <div className="space-y-2">
                {persona.contactos.map((contacto) => (
                  <div
                    key={contacto.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-mostaza/5"
                  >
                    {getContactIcon(contacto.tipo?.nombre || '')}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-marron">{contacto.valor}</p>
                      <p className="text-xs text-muted-foreground">{contacto.tipo?.nombre || 'Contacto'}</p>
                    </div>
                    {contacto.es_principal && (
                      <Badge className="bg-mostaza/10 text-mostaza text-xs">Principal</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin contactos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Usuario */}
        <Card className="border-marron/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-marron flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Cuenta de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {persona.usuario ? (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-marron">{persona.usuario.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <Badge
                    className={
                      persona.usuario.estado
                        ? 'bg-oliva/10 text-oliva'
                        : 'bg-rojo/10 text-rojo'
                    }
                  >
                    {persona.usuario.estado ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                {persona.usuario.roles && persona.usuario.roles.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">Roles</p>
                    <div className="flex gap-1 flex-wrap">
                      {persona.usuario.roles.map((r) => (
                        <Badge key={r.id_rol} className="bg-mostaza/10 text-mostaza text-xs">
                          {r.rol.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Esta persona no tiene cuenta de usuario
                </p>
                <Button
                  size="sm"
                  className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
                  onClick={() => router.push('/admin/usuarios')}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Crear Usuario
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">Editar Persona</DialogTitle>
          </DialogHeader>
          <PersonaForm persona={persona} onSuccess={handleEditSuccess} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar persona?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán los contactos y direcciones asociados.
              {persona.usuario && ' Esta persona tiene un usuario vinculado, debe eliminarlo primero.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rojo hover:bg-rojo/90 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
