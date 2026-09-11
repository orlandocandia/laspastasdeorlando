'use client'

/**
 * ============================================================
 * Perfil de Usuario — Cocina Móvil
 * ============================================================
 * URL: /cm/profile
 *
 * Layout:
 *  - Botón "Volver al Dashboard" arriba a la izquierda
 *  - Header con título + botones de acción
 *  - 2 columnas (desktop): Foto+datos básicos | Datos personales
 *  - 1 fila completa: Domicilio
 *  - Responsive: 1 columna en mobile
 * ============================================================
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, IdCard, MapPin, Calendar, Heart, Users as UsersIcon, Key, Pencil, Save, X, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { getCmUserFromStorage, type CmUser } from '@/lib/cocina-movil/auth-client'
import { getFullName, getInitials, parseLocation, type CmUserRecord } from '@/lib/cocina-movil/users'
import { toast } from 'sonner'
import Link from 'next/link'

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
    fetch(`/api/cocina-movil/users/${localUser.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.user) setFullUser(data.user) })
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
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Botón volver */}
      <div>
        <Button asChild variant="ghost" size="sm" className="text-[#5C3A21] hover:bg-[#5C3A21]/5">
          <Link href="/cm/admin/dashboard"><ArrowLeft className="h-4 w-4" />Volver al Dashboard</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21]">Mi Perfil</h1>
          <p className="text-sm text-[#8A7E70]">Tus datos personales y de acceso</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditOpen(true)} size="sm" className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
            <Pencil className="h-4 w-4" />Editar Perfil
          </Button>
          <Button onClick={() => setPasswordOpen(true)} size="sm" variant="outline" className="border-[#5C3A21]/20 text-[#5C3A21]">
            <Key className="h-4 w-4" />Cambiar Contraseña
          </Button>
        </div>
      </div>

      {/* 2 columnas: Foto+datos básicos | Datos personales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna 1: Foto y datos básicos */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
              <User className="h-4 w-4" />Foto y Datos Básicos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-xl font-bold shrink-0 ring-2 ring-[#E1AD01]/20">
              {u.avatar ? (
                <img src={u.avatar} alt={getFullName(u)} className="h-full w-full object-cover" />
              ) : (
                getInitials(u)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#5C3A21] truncate">{getFullName(u)}</p>
              <p className="text-sm text-[#8A7E70] truncate">{u.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] capitalize border-[#5C3A21]/20">{u.role}</Badge>
                <Badge className={`text-[10px] ${u.isActive ? 'bg-[#708238]' : 'bg-[#8A7E70]'}`}>
                  {u.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columna 2: Datos personales */}
        <Card className="border-[#5C3A21]/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
              <IdCard className="h-4 w-4" />Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2">
              <IdCard className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
              <div><p className="text-[10px] text-[#8A7E70]">DNI</p><p className="text-sm text-[#5C3A21] capitalize">{u.dni || '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
              <div><p className="text-[10px] text-[#8A7E70]">Nacimiento</p><p className="text-sm text-[#5C3A21]">{u.birthDate ? formatDate(u.birthDate) : '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
              <div><p className="text-[10px] text-[#8A7E70]">Género</p><p className="text-sm text-[#5C3A21] capitalize">{u.gender || '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Heart className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
              <div><p className="text-[10px] text-[#8A7E70]">Estado Civil</p><p className="text-sm text-[#5C3A21] capitalize">{u.maritalStatus || '—'}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila completa: Domicilio */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
            <MapPin className="h-4 w-4" />Domicilio
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Dirección</p><p className="text-sm text-[#5C3A21]">{u.address || '—'}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">País</p><p className="text-sm text-[#5C3A21]">{u.country || '—'}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Provincia</p><p className="text-sm text-[#5C3A21]">{u.province || '—'}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Departamento</p><p className="text-sm text-[#5C3A21]">{u.department || '—'}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Municipio</p><p className="text-sm text-[#5C3A21]">{u.municipality || '—'}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Ubicación</p><p className="text-sm text-[#5C3A21] truncate">{u.location || '—'}</p></div>
          </div>
        </CardContent>
        {loc && (
          <CardContent className="pt-0">
            <div className="text-xs text-[#8A7E70] bg-[#5C3A21]/5 rounded-md px-3 py-2 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#E1AD01]" />
              Coordenadas: <strong className="text-[#5C3A21]">{loc[0].toFixed(4)}, {loc[1].toFixed(4)}</strong>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Fila completa: Datos de acceso */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#5C3A21] flex items-center gap-2">
            <Mail className="h-4 w-4" />Datos de Acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Email</p><p className="text-sm text-[#5C3A21] truncate">{u.email}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <UsersIcon className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Rol</p><p className="text-sm text-[#5C3A21] capitalize">{u.role}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Último Acceso</p><p className="text-sm text-[#5C3A21]">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Nunca'}</p></div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-[#5C3A21] mt-0.5 shrink-0" />
            <div><p className="text-[10px] text-[#8A7E70]">Creado</p><p className="text-sm text-[#5C3A21]">{formatDate(u.createdAt)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <EditProfileDialog user={u} open={editOpen} onClose={() => setEditOpen(false)} onSaved={(updated) => { setFullUser(updated); setEditOpen(false); toast.success('Perfil actualizado') }} />

      {/* Change Password Dialog */}
      <ChangePasswordDialog userId={u.id} open={passwordOpen} onClose={() => setPasswordOpen(false)} onSaved={() => { setPasswordOpen(false); toast.success('Contraseña actualizada') }} />
    </div>
  )
}

// ============================================================
// Edit Profile Dialog
// ============================================================
function EditProfileDialog({ user, open, onClose, onSaved }: { user: CmUserRecord; open: boolean; onClose: () => void; onSaved: (updated: CmUserRecord) => void }) {
  const [firstName, setFirstName] = React.useState(user.firstName)
  const [lastName, setLastName] = React.useState(user.lastName)
  const [avatar, setAvatar] = React.useState(user.avatar || '')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) { setFirstName(user.firstName); setLastName(user.lastName); setAvatar(user.avatar || ''); setError(null) }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!firstName.trim()) return setError('El nombre es obligatorio')
    if (!lastName.trim()) return setError('El apellido es obligatorio')
    setSaving(true)
    try {
      const res = await fetch(`/api/cocina-movil/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName, avatar: avatar || null }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
      onSaved(data.user)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21]">Editar Perfil</DialogTitle>
          <DialogDescription>Modificá tu nombre y foto de perfil</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (<div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">{error}</div>)}
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Nombre</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-[#5C3A21]/15" autoFocus /></div>
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Apellido</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-[#5C3A21]/15" /></div>
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Avatar (URL)</Label><Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" className="border-[#5C3A21]/15" /></div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}><X className="h-4 w-4" />Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Change Password Dialog
// ============================================================
function ChangePasswordDialog({ userId, open, onClose, onSaved }: { userId: string; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => { if (open) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(null) } }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!currentPassword) return setError('La contraseña actual es obligatoria')
    if (newPassword.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres')
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden')
    setSaving(true)
    try {
      const loginRes = await fetch('/api/cocina-movil/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: getCmUserFromStorage()?.email, password: currentPassword }) })
      if (!loginRes.ok) throw new Error('La contraseña actual es incorrecta')
      const res = await fetch(`/api/cocina-movil/users/${userId}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) })
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'HTTP ' + res.status) }
      onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21]">Cambiar Contraseña</DialogTitle>
          <DialogDescription>Verificá tu contraseña actual antes de cambiarla</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (<div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2 flex items-start gap-2"><ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>)}
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Contraseña actual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border-[#5C3A21]/15" autoFocus /></div>
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Nueva contraseña</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="border-[#5C3A21]/15" /></div>
          <div className="space-y-1.5"><Label className="text-[#5C3A21]">Confirmar contraseña</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border-[#5C3A21]/15" /></div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}Cambiar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatDate(ts: number): string {
  const d = new Date(ts); const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
