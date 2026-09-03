'use client'

/**
 * ============================================================
 * Gestión de Usuarios (ABM) — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/users
 *
 * Funcionalidades:
 *  - Tabla de usuarios con columnas: Avatar, Nombre, Email, Rol, Estado, Último Acceso, Acciones
 *  - Búsqueda por nombre o email
 *  - Filtros por rol (Todos, Admin, Cocinero) y estado (Todos, Activo, Inactivo)
 *  - Acciones por fila: Editar, Eliminar, Activar/Desactivar, Cambiar contraseña
 *  - Botón "Nuevo Usuario" (abre modal)
 *  - Exportación: Imprimir, PDF, Word, Excel
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Printer, FileText, FileSpreadsheet, FileDown, Pencil, Trash2, Key, MoreHorizontal, Loader2, Users as UsersIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface CmUserRow {
  id: string
  name: string
  email: string
  role: 'admin' | 'cocinero' | 'supervisor'
  avatar: string | null
  isActive: boolean
  lastLoginAt: number | null
  createdAt: number
  updatedAt: number
}

type FormMode = 'create' | 'edit'

export default function CmUsersPage() {
  const searchParams = useSearchParams()
  const [users, setUsers] = React.useState<CmUserRow[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<'all' | 'admin' | 'cocinero' | 'supervisor'>('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')

  // Modals
  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editingUser, setEditingUser] = React.useState<CmUserRow | null>(null)
  const [passwordUser, setPasswordUser] = React.useState<CmUserRow | null>(null)
  const [deleteUser, setDeleteUser] = React.useState<CmUserRow | null>(null)

  // Abrir modal de creación si viene ?action=new
  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateForm()
    }
  }, [searchParams])

  const loadUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      params.set('pageSize', '200')
      const res = await fetch(`/api/cocina-movil/users?${params.toString()}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('[CmUsers] Error loading users:', err)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  React.useEffect(() => {
    const id = setTimeout(loadUsers, 250)
    return () => clearTimeout(id)
  }, [loadUsers])

  // ----- Handlers -----
  const openCreateForm = () => {
    setFormMode('create')
    setEditingUser(null)
    setFormOpen(true)
  }

  const openEditForm = (u: CmUserRow) => {
    setFormMode('edit')
    setEditingUser(u)
    setFormOpen(true)
  }

  const handleToggleActive = async (u: CmUserRow) => {
    try {
      const res = await fetch(`/api/cocina-movil/users/${u.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      toast.success(`Usuario ${u.isActive ? 'desactivado' : 'activado'}`)
      loadUsers()
    } catch (err) {
      toast.error('Error al cambiar estado')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      const res = await fetch(`/api/cocina-movil/users/${deleteUser.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'HTTP ' + res.status)
      }
      toast.success('Usuario eliminado')
      setDeleteUser(null)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (roleFilter !== 'all') params.set('role', roleFilter)
    if (statusFilter === 'active') params.set('isActive', 'true')
    if (statusFilter === 'inactive') params.set('isActive', 'false')
    window.open(`/api/cocina-movil/users/export?${params.toString()}`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  // ----- Render -----
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <UsersIcon className="h-6 w-6" />
            Usuarios
          </h1>
          <p className="text-sm text-[#8A7E70]">
            {total} usuario{total !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros + búsqueda + export */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70]" />
              <Input
                placeholder="Buscar por nombre o email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            {/* Rol filter */}
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | 'admin' | 'cocinero' | 'supervisor')}>
              <SelectTrigger className="w-full lg:w-40 border-[#5C3A21]/15">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cocinero">Cocinero</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
            {/* Estado filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="w-full lg:w-40 border-[#5C3A21]/15">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#5C3A21]/8">
            <span className="text-xs text-[#8A7E70] self-center mr-1">Exportar:</span>
            <Button size="sm" variant="outline" onClick={handlePrint} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('pdf')} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <FileText className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('word')} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <FileDown className="h-3.5 w-3.5" />
              Word
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('excel')} className="border-[#5C3A21]/20 text-[#5C3A21]">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
              <span className="ml-2 text-sm text-[#8A7E70]">Cargando usuarios…</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <UsersIcon className="h-10 w-10 mx-auto mb-2 text-[#8A7E70]/40" />
              <p className="text-sm text-[#8A7E70]">No se encontraron usuarios.</p>
              <p className="text-xs text-[#8A7E70]/70 mt-1">Probá cambiar los filtros o crear uno nuevo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FBF1DC] border-[#5C3A21]/15">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u, i) => (
                    <TableRow key={u.id} className="border-[#5C3A21]/8 hover:bg-[#FBF1DC]/50">
                      <TableCell className="text-xs text-[#8A7E70]">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center text-xs font-bold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#5C3A21] truncate">{u.name}</p>
                            <p className="text-xs text-[#8A7E70] truncate md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            u.role === 'admin'
                              ? 'border-[#5C3A21] text-[#5C3A21]'
                              : u.role === 'cocinero'
                              ? 'border-[#708238] text-[#708238]'
                              : 'border-[#E1AD01] text-[#7a5c00]'
                          }`}
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            u.isActive
                              ? 'bg-[#708238] hover:bg-[#708238]'
                              : 'bg-[#8A7E70] hover:bg-[#8A7E70]'
                          }`}
                        >
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-[#8A7E70]">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Nunca'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-[#5C3A21]">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditForm(u)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPasswordUser(u)}>
                                <Key className="h-4 w-4 mr-2" />
                                Cambiar contraseña
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                                <Switch checked={u.isActive} className="scale-75 mr-1" />
                                {u.isActive ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteUser(u)}
                                className="text-[#B91C1C] focus:text-[#B91C1C]"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== Modal: Crear/Editar Usuario ====== */}
      <UserFormDialog
        open={formOpen}
        mode={formMode}
        user={editingUser}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          loadUsers()
        }}
      />

      {/* ====== Modal: Cambiar Contraseña ====== */}
      <PasswordChangeDialog
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
        onSaved={() => {
          setPasswordUser(null)
          loadUsers()
        }}
      />

      {/* ====== Modal: Confirmar Eliminación ====== */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">¿Eliminar usuario?</DialogTitle>
            <DialogDescription>
              Estás por eliminar a <strong>{deleteUser?.name}</strong> ({deleteUser?.email}).
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} className="bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Sub-componente: Form Dialog (Crear/Editar)
// ============================================================
function UserFormDialog({
  open,
  mode,
  user,
  onClose,
  onSaved,
}: {
  open: boolean
  mode: FormMode
  user: CmUserRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [role, setRole] = React.useState<'admin' | 'cocinero' | 'supervisor'>('cocinero')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        setName(user.name)
        setEmail(user.email)
        setRole(user.role)
        setPassword('')
      } else {
        setName('')
        setEmail('')
        setRole('cocinero')
        setPassword('')
      }
      setError(null)
    }
  }, [open, mode, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('El nombre es obligatorio')
    if (!email.trim()) return setError('El email es obligatorio')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Email inválido')
    if (mode === 'create' && password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }

    setSaving(true)
    try {
      const url = mode === 'create'
        ? '/api/cocina-movil/users'
        : `/api/cocina-movil/users/${user!.id}`
      const body: Record<string, unknown> = { name, email, role }
      if (mode === 'create' || password) body.password = password

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)

      toast.success(mode === 'create' ? 'Usuario creado' : 'Usuario actualizado')
      onSaved()
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
          <DialogTitle className="text-[#5C3A21]">
            {mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Creá un nuevo usuario para la Cocina Móvil'
              : `Editando a ${user?.name}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="border-[#5C3A21]/15"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="border-[#5C3A21]/15"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'cocinero' | 'supervisor')}>
              <SelectTrigger className="border-[#5C3A21]/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cocinero">Cocinero</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">
              Contraseña {mode === 'edit' && '(dejar vacío para no cambiar)'}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-[#5C3A21]/15"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Sub-componente: Cambiar Contraseña
// ============================================================
function PasswordChangeDialog({
  user,
  onClose,
  onSaved,
}: {
  user: CmUserRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (user) {
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
    }
  }, [user])

  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 6) return setError('Mínimo 6 caracteres')
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden')

    setSaving(true)
    try {
      const res = await fetch(`/api/cocina-movil/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'HTTP ' + res.status)
      }
      toast.success('Contraseña actualizada')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21]">Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Cambiando la contraseña de <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Nueva contraseña</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="border-[#5C3A21]/15"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Confirmar contraseña</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="border-[#5C3A21]/15"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cambiar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Helpers
// ============================================================
function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
