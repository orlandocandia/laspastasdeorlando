'use client'

/**
 * ============================================================
 * Cocinero — Mi Perfil (READ-ONLY)
 * ============================================================
 * URL: /cm/cocina/perfil
 *
 * Vista de solo lectura para el rol Cocinero.
 * - Obtiene el usuario autenticado desde localStorage
 *   (getCmUserFromStorage) y luego fetch del detalle desde
 *   /api/cocina-movil/users/[id] para mostrar todos los
 *   campos personales.
 * - Layout en tarjetas con grid 2 columnas (mismo estilo que
 *   el perfil de admin en /cm/profile).
 * - Botones:
 *     · "Editar Perfil"      → /cm/admin/profile
 *     · "Cambiar Contraseña" → /cm/admin/profile
 *     · "Volver al Dashboard" → /cm/cocina/dashboard
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User, Mail, IdCard, MapPin, Calendar, Heart, Key, Pencil,
  Loader2, ArrowLeft, UserCircle, IdCard as IdCardIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getCmUserFromStorage } from '@/lib/cocina-movil/auth-client'
import {
  getFullName, getInitials, parseLocation,
  type CmUserRecord,
} from '@/lib/cocina-movil/users'

// ============================================================
// Helpers
// ============================================================

const fmtDate = (ts: number | null | undefined): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// ============================================================
// Página
// ============================================================

export default function CookProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
          <span className="ml-2 text-sm text-[#8A7E70]">Cargando…</span>
        </div>
      }
    >
      <CookProfilePageContent />
    </React.Suspense>
  )
}

function CookProfilePageContent() {
  const router = useRouter()
  const [fullUser, setFullUser] = React.useState<CmUserRecord | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const localUser = getCmUserFromStorage()
    if (!localUser) {
      // Don't leave the spinner running if navigation stalls.
      setLoading(false)
      router.push('/login')
      return
    }
    fetch(`/api/cocina-movil/users/${localUser.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setFullUser(data.user)
      })
      .catch((err) => console.error('Error al cargar perfil:', err))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
      </div>
    )
  }

  if (!fullUser) {
    return (
      <div className="py-20 text-center">
        <User className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
        <p className="text-sm text-[#8A7E70]">No se pudieron cargar los datos del usuario.</p>
        <Button asChild variant="outline" className="mt-4 border-[#5C3A21]/20 text-[#5C3A21]">
          <Link href="/cm/cocina/dashboard"><ArrowLeft className="h-4 w-4" />Volver al Dashboard</Link>
        </Button>
      </div>
    )
  }

  const u = fullUser
  const loc = parseLocation(u.location)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <UserCircle className="h-6 w-6" />Mi Perfil
          </h1>
          <p className="text-sm text-[#8A7E70]">Tus datos personales y de acceso</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
            <Link href="/cm/admin/profile"><Pencil className="h-4 w-4" />Editar Perfil</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <Link href="/cm/admin/profile"><Key className="h-4 w-4" />Cambiar Contraseña</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <Link href="/cm/cocina/dashboard"><ArrowLeft className="h-4 w-4" />Volver al Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Avatar + name card */}
      <Card className="border-[#5C3A21]/10 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#5C3A21] via-[#E1AD01] to-[#708238]" />
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-2xl font-bold shrink-0 ring-4 ring-[#E1AD01]/20">
            {u.avatar ? (
              <img src={u.avatar} alt={getFullName(u)} className="h-full w-full object-cover" />
            ) : (
              getInitials(u)
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#5C3A21]">{getFullName(u)}</h2>
            <p className="text-sm text-[#8A7E70] truncate">{u.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-[10px] capitalize border-[#5C3A21]/20">
                {u.role}
              </Badge>
              <Badge className={`text-[10px] ${u.isActive ? 'bg-[#708238]' : 'bg-[#8A7E70]'}`}>
                {u.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos personales + Datos de acceso (2 columnas en desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
              <User className="h-4 w-4" />Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={User} label="Nombre" value={u.firstName} />
            <InfoRow icon={User} label="Apellido" value={u.lastName} />
            <InfoRow icon={IdCardIcon} label="DNI" value={u.dni} />
            <InfoRow icon={Calendar} label="Fecha de Nacimiento" value={u.birthDate ? fmtDate(u.birthDate) : null} />
            <InfoRow icon={User} label="Género" value={u.gender} />
            <InfoRow icon={Heart} label="Estado Civil" value={u.maritalStatus} />
          </CardContent>
        </Card>

        {/* Datos de acceso */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
              <Mail className="h-4 w-4" />Datos de Acceso
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Mail} label="Email" value={u.email} />
            <InfoRow icon={IdCard} label="Rol" value={u.role} />
            <InfoRow icon={Calendar} label="Último Acceso" value={u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Nunca'} />
            <InfoRow icon={Calendar} label="Creado" value={fmtDate(u.createdAt)} />
          </CardContent>
        </Card>
      </div>

      {/* Domicilio */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <MapPin className="h-4 w-4" />Domicilio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={MapPin} label="Dirección" value={u.address} />
            <InfoRow icon={MapPin} label="País" value={u.country} />
            <InfoRow icon={MapPin} label="Provincia" value={u.province} />
            <InfoRow icon={MapPin} label="Departamento" value={u.department} />
            <InfoRow icon={MapPin} label="Municipio" value={u.municipality} />
            <InfoRow icon={MapPin} label="Ubicación" value={u.location} />
          </div>
          {loc && (
            <div className="text-xs text-[#8A7E70] bg-[#5C3A21]/5 rounded-md px-3 py-2">
              📍 Coordenadas: {loc[0].toFixed(4)}, {loc[1].toFixed(4)}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-[#5C3A21]/10" />

      {/* Volver al dashboard */}
      <div className="flex justify-center">
        <Button asChild variant="outline" className="border-[#5C3A21]/20 text-[#5C3A21]">
          <Link href="/cm/cocina/dashboard"><ArrowLeft className="h-4 w-4" />Volver al Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Info Row component (mismo estilo que /cm/profile)
// ============================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-[#5C3A21]/8 flex items-center justify-center text-[#5C3A21] shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#8A7E70]">{label}</p>
        <p className="text-sm font-medium text-[#5C3A21] capitalize">
          {value || <span className="text-[#8A7E70]/50">—</span>}
        </p>
      </div>
    </div>
  )
}
