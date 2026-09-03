'use client'

/**
 * ============================================================
 * Perfil de Usuario — Cocina Móvil
 * ============================================================
 * URL: /cm/profile
 *
 * El usuario autenticado ve sus propios datos completos y puede:
 *  - Editar su perfil (firstName, lastName, avatar)
 *  - Cambiar su contraseña (con validación de contraseña actual)
 * ============================================================
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, IdCard, MapPin, Calendar, Heart, Users as UsersIcon, Key, Pencil, Save, X, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { getCmUserFromStorage, logoutCm, type CmUser } from '@/lib/cocina-movil/auth-client'
import { getFullName, getInitials, parseLocation, type CmUserRecord } from '@/lib/cocina-movil/users'
import { toast } from 'sonner'

export default function CmProfilePage() {
  const router = useRouter()
  const [user, setUser] = React.useState<CmUser | null>(null)
  const [fullUser, setFullUser] = React.useState<CmUserRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [passwordOpen, setPasswordOpen] = React.useState(false)

  React.useEffect(() => {
    const localUser = getCmUserFromStorage()
    if (!localUser) {
      router.push('/login')
      return
    }
    setUser(localUser)
    // Fetch full user data from API (to get all fields like firstName, lastName, dni, etc.)
    fetch(`/api/cocina-movil/users/${localUser.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setFullUser(data.user)
      })
      .catch(console.error)
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
      </div>
    )
  }

  const u = fullUser
  const loc = parseLocation(u.location)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21]">Mi Perfil</h1>
          <p className="text-sm text-[#8A7E70]">Tus datos personales y de acceso</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditOpen(true)} size="sm" className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
            <Pencil className="h-4 w-4" />
            Editar Perfil
          </Button>
          <Button onClick={() => setPasswordOpen(true)} size="sm" variant="outline" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <Key className="h-4 w-4" />
            Cambiar Contraseña
          </Button>
        </div>
      </div>

      {/* Avatar + name card */}
      <Card className="border-[#5C3A21]/10 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#5C3A21] via-[#E1AD01] to-[#708238]" />
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-2xl font-bold shrink-0 ring-4 ring-[#E1AD01]/20">
            {getInitials(u)}
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

      {/* Datos personales */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <User className="h-4 w-4" />
            Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User} label="Nombre" value={u.firstName} />
          <InfoRow icon={User} label="Apellido" value={u.lastName} />
          <InfoRow icon={IdCard} label="DNI" value={u.dni} />
          <InfoRow icon={Calendar} label="Fecha de Nacimiento" value={u.birthDate ? formatDate(u.birthDate) : null} />
          <InfoRow icon={User} label="Género" value={u.gender} />
          <InfoRow icon={Heart} label="Estado Civil" value={u.maritalStatus} />
        </CardContent>
      </Card>

      {/* Domicilio */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Domicilio
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

      {/* Acceso */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Datos de Acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Mail} label="Email" value={u.email} />
          <InfoRow icon={UsersIcon} label="Rol" value={u.role} />
          <InfoRow icon={Calendar} label="Último Acceso" value={u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Nunca'} />
          <InfoRow icon={Calendar} label="Creado" value={formatDate(u.createdAt)} />
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        user={u}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setFullUser(updated)
          setEditOpen(false)
          toast.success('Perfil actualizado')
        }}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        userId={u.id}
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSaved={() => {
          setPasswordOpen(false)
          toast.success('Contraseña actualizada')
        }}
      />
    </div>
  )
}

// ============================================================
// Info Row component
// ============================================================
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
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

// ============================================================
// Edit Profile Dialog
// ============================================================
function EditProfileDialog({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: CmUserRecord
  open: boolean
  onClose: () => void
  onSaved: (updated: CmUserRecord) => void
}) {
  const [firstName, setFirstName] = React.useState(user.firstName)
  const [lastName, setLastName] = React.useState(user.lastName)
  const [avatar, setAvatar] = React.useState(user.avatar || '')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setAvatar(user.avatar || '')
      setError(null)
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!firstName.trim()) return setError('El nombre es obligatorio')
    if (!lastName.trim()) return setError('El apellido es obligatorio')

    setSaving(true)
    try {
      const res = await fetch(`/api/cocina-movil/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, avatar: avatar || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      onSaved(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21]">Editar Perfil</DialogTitle>
          <DialogDescription>Modificá tu nombre y foto de perfil</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Nombre</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-[#5C3A21]/15" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Apellido</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-[#5C3A21]/15" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Avatar (URL)</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" className="border-[#5C3A21]/15" />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Change Password Dialog (with current password validation)
// ============================================================
function ChangePasswordDialog({
  userId,
  open,
  onClose,
  onSaved,
}: {
  userId: string
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!currentPassword) return setError('La contraseña actual es obligatoria')
    if (newPassword.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres')
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden')

    setSaving(true)
    try {
      // First verify current password by attempting a login
      const loginRes = await fetch('/api/cocina-movil/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getCmUserFromStorage()?.email, password: currentPassword }),
      })
      if (!loginRes.ok) {
        throw new Error('La contraseña actual es incorrecta')
      }

      // Then change the password
      const res = await fetch(`/api/cocina-movil/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'HTTP ' + res.status)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21]">Cambiar Contraseña</DialogTitle>
          <DialogDescription>Verificá tu contraseña actual antes de cambiarla</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Contraseña actual</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border-[#5C3A21]/15"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Nueva contraseña</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="border-[#5C3A21]/15"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Confirmar contraseña</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-[#5C3A21]/15"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              Cambiar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
