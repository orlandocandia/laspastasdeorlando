'use client'

/**
 * ============================================================
 * Gestión de Usuarios (ABM) — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/users
 *
 * Funcionalidades:
 *  - Tabla de usuarios con columnas: #, Usuario (avatar+nombre), Email,
 *    DNI, Rol (badge), Estado (badge), Último Acceso, Acciones
 *  - Búsqueda por nombre / email / DNI (debounce 250ms)
 *  - Filtros por rol (Todos/Admin/Cocinero/Supervisor) y estado
 *    (Todos/Activos/Inactivos)
 *  - Acciones por fila (dropdown): Editar, Cambiar contraseña,
 *    Activar/Desactivar, Eliminar
 *  - Botón "Nuevo Usuario" (abre modal)
 *  - Exportación: Imprimir, PDF, Word, Excel
 *
 * Modal de formulario (Crear/Editar) con 3 secciones:
 *   1. Datos Personales (firstName, lastName, dni, birthDate,
 *      gender, maritalStatus, avatar)
 *   2. Domicilio (address, country, province, department,
 *      municipality, location con LocationPicker/Leaflet)
 *   3. Acceso (email, password [solo create], role, isActive
 *      [solo edit] + botón "Modificar Contraseña" en edit)
 *
 * Paleta: marron #5C3A21, mostaza #E1AD01, crema #FFF8E7,
 *         oliva #708238, rojo #B91C1C, gris medio #8A7E70
 * ============================================================
 */

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Printer, FileText, FileSpreadsheet, FileDown,
  Pencil, Trash2, Key, MoreHorizontal, Loader2, Users as UsersIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

import LocationPicker from '@/components/(cocina-movil)/admin/location-picker'
import AvatarUploader from '@/components/(cocina-movil)/admin/avatar-uploader'
import {
  getFullName, getInitials,
  type CmUserRecord, type CmRole, type CmGender, type CmMaritalStatus,
} from '@/lib/cocina-movil/users'

type FormMode = 'create' | 'edit'

const DEFAULT_COUNTRY = 'Argentina'
const DEFAULT_PROVINCE = 'Misiones'

const NONE = 'none' // sentinel for "no selection" in Select components

// ============================================================
// Helpers
// ============================================================
function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// epoch ms -> 'YYYY-MM-DD' para input[type=date]
function epochToDateInput(ts: number | null | undefined): string {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 'YYYY-MM-DD' -> epoch ms (a la medianoche local)
function dateInputToEpoch(s: string): number | null {
  if (!s) return null
  const ts = new Date(s + 'T00:00:00').getTime()
  return isNaN(ts) ? null : ts
}

function roleBadgeClass(role: CmRole): string {
  if (role === 'admin') return 'border-[#5C3A21] text-[#5C3A21] bg-[#5C3A21]/5'
  if (role === 'cocinero') return 'border-[#708238] text-[#708238] bg-[#708238]/5'
  return 'border-[#E1AD01] text-[#7a5c00] bg-[#E1AD01]/10'
}

function avatarColorClass(role: CmRole): string {
  if (role === 'admin') return 'bg-[#5C3A21] text-[#FFF8E7]'
  if (role === 'cocinero') return 'bg-[#708238] text-[#FFF8E7]'
  return 'bg-[#E1AD01] text-[#5C3A21]'
}

// ============================================================
// Estado del formulario (campos strings para inputs controlados)
// ============================================================
interface UserFormState {
  firstName: string
  lastName: string
  dni: string
  birthDate: string // 'YYYY-MM-DD' o ''
  gender: CmGender
  maritalStatus: CmMaritalStatus
  avatar: string
  address: string
  country: string
  province: string
  department: string
  municipality: string
  location: string | null // 'lat,lng'
  email: string
  password: string
  role: CmRole
  isActive: boolean
}

function emptyForm(): UserFormState {
  return {
    firstName: '',
    lastName: '',
    dni: '',
    birthDate: '',
    gender: null,
    maritalStatus: null,
    avatar: '',
    address: '',
    country: DEFAULT_COUNTRY,
    province: DEFAULT_PROVINCE,
    department: '',
    municipality: '',
    location: null,
    email: '',
    password: '',
    role: 'cocinero',
    isActive: true,
  }
}

function formFromUser(u: CmUserRecord): UserFormState {
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    dni: u.dni || '',
    birthDate: epochToDateInput(u.birthDate),
    gender: u.gender,
    maritalStatus: u.maritalStatus,
    avatar: u.avatar || '',
    address: u.address || '',
    country: u.country || DEFAULT_COUNTRY,
    province: u.province || DEFAULT_PROVINCE,
    department: u.department || '',
    municipality: u.municipality || '',
    location: u.location,
    email: u.email,
    password: '',
    role: u.role,
    isActive: u.isActive,
  }
}

// ============================================================
// Componente principal
// ============================================================
export default function CmUsersPage() {
  const searchParams = useSearchParams()
  const [users, setUsers] = React.useState<CmUserRecord[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<'all' | CmRole>('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')

  // Modales
  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>('create')
  const [editingUser, setEditingUser] = React.useState<CmUserRecord | null>(null)
  const [passwordUser, setPasswordUser] = React.useState<CmUserRecord | null>(null)
  const [deleteUser, setDeleteUser] = React.useState<CmUserRecord | null>(null)

  // Abrir modal de creación si viene ?action=new
  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openEditForm = (u: CmUserRecord) => {
    setFormMode('edit')
    setEditingUser(u)
    setFormOpen(true)
  }

  const handleToggleActive = async (u: CmUserRecord) => {
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
                placeholder="Buscar por nombre, email o DNI…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#5C3A21]/15 bg-white"
              />
            </div>
            {/* Rol filter */}
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | CmRole)}>
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
                    <TableHead className="hidden md:table-cell">DNI</TableHead>
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
                          <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-1 ring-[#5C3A21]/10">
                            {u.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.avatar}
                                alt={getFullName(u)}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  // Si falla la carga, ocultar img y mostrar iniciales
                                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className={`h-full w-full flex items-center justify-center text-xs font-bold ${avatarColorClass(u.role)}`}>
                                {getInitials(u)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#5C3A21] truncate">{getFullName(u)}</p>
                            <p className="text-xs text-[#8A7E70] truncate md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">{u.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#4A3F36]">
                        {u.dni || <span className="text-[#8A7E70]/60">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize ${roleBadgeClass(u.role)}`}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            u.isActive ? 'bg-[#708238] hover:bg-[#708238]' : 'bg-[#8A7E70] hover:bg-[#8A7E70]'
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
        onRequestPasswordChange={(u) => {
          setPasswordUser(u)
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
              Estás por eliminar a <strong>{deleteUser ? getFullName(deleteUser) : ''}</strong> ({deleteUser?.email}).
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
// Sub-componente: header de sección numerada
// ============================================================
function SectionHeader({ num, title, hint }: { num: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-full bg-[#5C3A21] text-[#FFF8E7] flex items-center justify-center text-xs font-bold shrink-0">
        {num}
      </div>
      <h3 className="text-sm font-semibold text-[#5C3A21]">{title}</h3>
      {hint && <span className="text-xs text-[#8A7E70]">{hint}</span>}
    </div>
  )
}

// ============================================================
// Sub-componente: Form Dialog (Crear/Editar) — 3 secciones
// ============================================================
function UserFormDialog({
  open,
  mode,
  user,
  onClose,
  onSaved,
  onRequestPasswordChange,
}: {
  open: boolean
  mode: FormMode
  user: CmUserRecord | null
  onClose: () => void
  onSaved: () => void
  onRequestPasswordChange: (u: CmUserRecord) => void
}) {
  const [form, setForm] = React.useState<UserFormState>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Sincronizar form cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        setForm(formFromUser(user))
      } else {
        setForm(emptyForm())
      }
      setError(null)
    }
  }, [open, mode, user])

  // Helper para actualizar un campo
  const setField = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!form.firstName.trim()) return setError('El nombre es obligatorio')
    if (!form.lastName.trim()) return setError('El apellido es obligatorio')
    if (!form.email.trim()) return setError('El email es obligatorio')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError('Email inválido')
    }
    if (mode === 'create' && form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }

    setSaving(true)
    try {
      const url = mode === 'create'
        ? '/api/cocina-movil/users'
        : `/api/cocina-movil/users/${user!.id}`
      const body: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        // Datos personales opcionales
        dni: form.dni.trim() || null,
        birthDate: dateInputToEpoch(form.birthDate),
        gender: form.gender,
        maritalStatus: form.maritalStatus,
        avatar: form.avatar.trim() || null,
        // Domicilio
        address: form.address.trim() || null,
        country: form.country.trim() || null,
        province: form.province.trim() || null,
        department: form.department.trim() || null,
        municipality: form.municipality.trim() || null,
        location: form.location,
      }
      if (mode === 'create') {
        body.password = form.password
        body.isActive = true
      } else {
        body.isActive = form.isActive
      }

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#5C3A21]">
            {mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Creá un nuevo usuario para la Cocina Móvil'
              : user
              ? `Editando a ${getFullName(user)}`
              : 'Editar usuario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* ====== Sección 1: Datos Personales ====== */}
          <div className="space-y-3">
            <SectionHeader num={1} title="Datos Personales" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 sm:pl-0">
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Nombre *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  placeholder="Nombre"
                  className="border-[#5C3A21]/15"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Apellido *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  placeholder="Apellido"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">DNI</Label>
                <Input
                  value={form.dni}
                  onChange={(e) => setField('dni', e.target.value)}
                  placeholder="12.345.678"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setField('birthDate', e.target.value)}
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Género</Label>
                <Select
                  value={form.gender ?? NONE}
                  onValueChange={(v) => setField('gender', v === NONE ? null : (v as CmGender))}
                >
                  <SelectTrigger className="border-[#5C3A21]/15">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Estado civil</Label>
                <Select
                  value={form.maritalStatus ?? NONE}
                  onValueChange={(v) =>
                    setField('maritalStatus', v === NONE ? null : (v as CmMaritalStatus))
                  }
                >
                  <SelectTrigger className="border-[#5C3A21]/15">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    <SelectItem value="soltero">Soltero/a</SelectItem>
                    <SelectItem value="casado">Casado/a</SelectItem>
                    <SelectItem value="divorciado">Divorciado/a</SelectItem>
                    <SelectItem value="viudo">Viudo/a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[#5C3A21]">Avatar</Label>
                <AvatarUploader
                  value={form.avatar || null}
                  onChange={(url) => setField('avatar', url || '')}
                  initials={getInitials(form)}
                  role={form.role}
                  size="lg"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#5C3A21]/15" />

          {/* ====== Sección 2: Domicilio ====== */}
          <div className="space-y-3">
            <SectionHeader num={2} title="Domicilio" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 sm:pl-0">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Dirección</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Calle, número, piso, depto…"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">País</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Provincia</Label>
                <Input
                  value={form.province}
                  onChange={(e) => setField('province', e.target.value)}
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Departamento</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setField('department', e.target.value)}
                  placeholder="Capital, Iguazú…"
                  className="border-[#5C3A21]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Municipio</Label>
                <Input
                  value={form.municipality}
                  onChange={(e) => setField('municipality', e.target.value)}
                  placeholder="Posadas, Oberá…"
                  className="border-[#5C3A21]/15"
                />
              </div>
            </div>

            <div className="space-y-1.5 pl-8 sm:pl-0">
              <Label className="text-[#5C3A21]">Ubicación (mapa)</Label>
              <LocationPicker
                location={form.location}
                onLocationChange={(loc) => setField('location', loc)}
              />
            </div>
          </div>

          <Separator className="bg-[#5C3A21]/15" />

          {/* ====== Sección 3: Acceso ====== */}
          <div className="space-y-3">
            <SectionHeader num={3} title="Acceso" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 sm:pl-0">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[#5C3A21]">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="email@ejemplo.com"
                  className="border-[#5C3A21]/15"
                />
              </div>
              {mode === 'create' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[#5C3A21]">Contraseña *</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="border-[#5C3A21]/15"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-[#5C3A21]">Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setField('role', v as CmRole)}
                >
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
              {mode === 'edit' && (
                <div className="space-y-1.5">
                  <Label className="text-[#5C3A21]">Estado</Label>
                  <div className="flex items-center gap-2 h-9 px-3 border border-[#5C3A21]/15 rounded-md bg-[#FFF8E7]/30">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(c) => setField('isActive', c)}
                    />
                    <span className="text-sm text-[#5C3A21]">
                      {form.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {mode === 'edit' && user && (
              <div className="pl-8 sm:pl-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRequestPasswordChange(user)}
                  className="border-[#5C3A21]/20 text-[#5C3A21] hover:bg-[#FBF1DC]/50"
                >
                  <Key className="h-4 w-4" />
                  Modificar Contraseña
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-1 px-1 py-2 border-t border-[#5C3A21]/8">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
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
  user: CmUserRecord | null
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
            Cambiando la contraseña de <strong>{getFullName(user)}</strong> ({user.email})
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
