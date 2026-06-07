'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Search, Loader2, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import UsuarioForm from './UsuarioForm'

// ==================== Interfaces ====================

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
    contactos: Array<{
      id: number
      valor: string
      es_principal: boolean
      tipo: { id: number; nombre: string }
    }>
  }
  roles: Array<{
    id_usuario: number
    id_rol: number
    rol: { id: number; nombre: string; descripcion?: string | null }
  }>
}

interface Rol {
  id: number
  nombre: string
}

// ==================== Component ====================

export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rolFilter, setRolFilter] = useState('todos')
  const [roles, setRoles] = useState<Rol[]>([])
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchUsuarios = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('buscar', search.trim())
      if (rolFilter !== 'todos') params.set('rol', rolFilter)

      const res = await fetch(`/api/usuarios?${params}`)
      if (!res.ok) throw new Error('Error al cargar usuarios')
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [search, rolFilter])

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/geografia?tipo=roles')
      if (!res.ok) return
      const data = await res.json()
      setRoles(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/usuarios/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Usuario eliminado')
      fetchUsuarios()
    } catch {
      toast.error('Error al eliminar usuario')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedUsuario(null)
    fetchUsuarios()
  }

  const openNewUsuario = () => {
    setSelectedUsuario(null)
    setFormOpen(true)
  }

  const openEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setFormOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={rolFilter} onValueChange={setRolFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              {roles.map((rol) => (
                <SelectItem key={rol.id} value={rol.nombre}>
                  {rol.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={openNewUsuario}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Foto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search || rolFilter !== 'todos'
                      ? 'No se encontraron usuarios'
                      : 'No hay usuarios registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="hover:bg-mostaza/5">
                    <TableCell>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                        {usuario.imagen ? (
                          <Image
                            src={usuario.imagen}
                            alt={usuario.email}
                            fill
                            loading="lazy"
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserCircle className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      {usuario.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {usuario.persona?.nombre} {usuario.persona?.apellido}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {usuario.roles?.[0] ? (
                        <Badge className="bg-mostaza/10 text-mostaza hover:bg-mostaza/20">
                          {usuario.roles[0].rol.nombre}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin rol</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          usuario.estado
                            ? 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                            : 'bg-rojo/10 text-rojo hover:bg-rojo/20'
                        }
                      >
                        {usuario.estado ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-mostaza/10"
                          onClick={() => openEditUsuario(usuario)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-rojo/10"
                          onClick={() => setDeleteId(usuario.id)}
                        >
                          <Trash2 className="h-4 w-4 text-rojo" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground">
        {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedUsuario(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>
          <UsuarioForm
            usuario={selectedUsuario}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
              La persona asociada no será eliminada.
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
