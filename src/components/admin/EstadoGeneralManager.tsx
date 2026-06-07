'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Loader2, Check, X, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'

interface EstadoGeneral {
  id: number
  nombre_estado: string
  entidad_aplicable: string | null
  es_final: boolean
}

const ENTIDADES_APLICABLES = [
  { value: 'compra', label: 'Compra' },
  { value: 'pedido_proveedor', label: 'Pedido a Proveedor' },
  { value: 'pedido_cliente', label: 'Pedido de Cliente' },
  { value: 'produccion', label: 'Producción' },
  { value: 'general', label: 'General' },
]

function getEntidadLabel(entidad: string | null): string {
  if (!entidad) return '-'
  return ENTIDADES_APLICABLES.find((e) => e.value === entidad)?.label || entidad
}

export default function EstadoGeneralManager() {
  const [estados, setEstados] = useState<EstadoGeneral[]>([])
  const [loading, setLoading] = useState(true)

  // Inline create form
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaEntidad, setNuevaEntidad] = useState('')
  const [nuevoEsFinal, setNuevoEsFinal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editItem, setEditItem] = useState<EstadoGeneral | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editEntidad, setEditEntidad] = useState('')
  const [editEsFinal, setEditEsFinal] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Delete
  const [deleteItem, setDeleteItem] = useState<EstadoGeneral | null>(null)

  const fetchEstados = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/estados-generales')
      if (!res.ok) throw new Error('Error al cargar estados generales')
      const data = await res.json()
      setEstados(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar estados generales')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEstados()
  }, [fetchEstados])

  const handleCreate = async () => {
    if (!nuevoNombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/estados-generales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_estado: nuevoNombre.trim(),
          entidad_aplicable: nuevaEntidad || null,
          es_final: nuevoEsFinal,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al crear estado')
      }
      toast.success('Estado general creado')
      setNuevoNombre('')
      setNuevaEntidad('')
      setNuevoEsFinal(false)
      fetchEstados()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear estado')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (estado: EstadoGeneral) => {
    setEditItem(estado)
    setEditNombre(estado.nombre_estado)
    setEditEntidad(estado.entidad_aplicable || '')
    setEditEsFinal(estado.es_final)
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editItem || !editNombre.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/estados-generales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItem.id,
          nombre_estado: editNombre.trim(),
          entidad_aplicable: editEntidad || null,
          es_final: editEsFinal,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al actualizar estado')
      }
      toast.success('Estado general actualizado')
      setEditOpen(false)
      setEditItem(null)
      fetchEstados()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/estados-generales?id=${deleteItem.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar estado')
      }
      toast.success('Estado general eliminado')
      fetchEstados()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar estado')
    } finally {
      setDeleteItem(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Inline create form */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 rounded-lg border border-marron/10 bg-muted/30">
        <div className="flex-1 w-full">
          <Label className="text-sm font-medium text-marron mb-1 block">Nombre Estado *</Label>
          <Input
            placeholder="Ej: Pendiente, Completado..."
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Label className="text-sm font-medium text-marron mb-1 block">Entidad Aplicable</Label>
          <Select value={nuevaEntidad} onValueChange={setNuevaEntidad}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {ENTIDADES_APLICABLES.map((ent) => (
                <SelectItem key={ent.value} value={ent.value}>
                  {ent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Checkbox
            id="es-final-new"
            checked={nuevoEsFinal}
            onCheckedChange={(checked) => setNuevoEsFinal(checked === true)}
          />
          <Label htmlFor="es-final-new" className="text-sm font-normal cursor-pointer whitespace-nowrap">
            Es Final
          </Label>
        </div>
        <Button
          onClick={handleCreate}
          disabled={creating || !nuevoNombre.trim()}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Agregar
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-mostaza" />
        </div>
      ) : estados.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay estados generales cargados
        </div>
      ) : (
        <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre Estado</TableHead>
                <TableHead>Entidad Aplicable</TableHead>
                <TableHead className="text-center">Es Final</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estados.map((estado) => (
                <TableRow key={estado.id} className="hover:bg-mostaza/5">
                  <TableCell className="font-medium text-marron">
                    {estado.nombre_estado}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-marron/20 text-marron">
                      {getEntidadLabel(estado.entidad_aplicable)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {estado.es_final ? (
                      <Badge className="bg-oliva/15 text-oliva hover:bg-oliva/25">
                        <ShieldAlert className="mr-1 h-3 w-3" />
                        Final
                      </Badge>
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 hover:bg-mostaza/10"
                        onClick={() => handleEdit(estado)}
                      >
                        <Pencil className="h-4 w-4 text-mostaza" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 hover:bg-rojo/10"
                        onClick={() => setDeleteItem(estado)}
                      >
                        <Trash2 className="h-4 w-4 text-rojo" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditItem(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-marron">Editar Estado General</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-marron mb-1 block">Nombre Estado *</Label>
              <Input
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Nombre del estado..."
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-marron mb-1 block">Entidad Aplicable</Label>
              <Select value={editEntidad} onValueChange={setEditEntidad}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {ENTIDADES_APLICABLES.map((ent) => (
                    <SelectItem key={ent.value} value={ent.value}>
                      {ent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="es-final-edit"
                checked={editEsFinal}
                onCheckedChange={(checked) => setEditEsFinal(checked === true)}
              />
              <Label htmlFor="es-final-edit" className="text-sm font-normal cursor-pointer">
                Es estado final (no permite transiciones posteriores)
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false)
                  setEditItem(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving || !editNombre.trim()}
                className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estado general?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El estado &quot;{deleteItem?.nombre_estado}&quot; será eliminado permanentemente.
              Si está siendo usado en compras o pedidos, no se podrá eliminar.
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
