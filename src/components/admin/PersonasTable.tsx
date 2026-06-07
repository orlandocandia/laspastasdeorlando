'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Search, Loader2, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react'

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ==================== Interfaces ====================

interface Contacto {
  id: number
  id_tipo_contacto: number
  valor: string
  es_principal: boolean
  tipo: { id: number; nombre: string }
}

interface Persona {
  id: number
  nombre: string
  apellido: string
  numero_documento: string
  tipo_persona: string
  imagen?: string | null
  contactos: Contacto[]
}

interface PersonasResponse {
  personas: Persona[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

// ==================== Tipo badge colors ====================

const tipoBadgeColors: Record<string, string> = {
  cliente: 'bg-oliva/10 text-oliva hover:bg-oliva/20',
  proveedor: 'bg-mostaza/10 text-mostaza hover:bg-mostaza/20',
  empleado: 'bg-rojo/10 text-rojo hover:bg-rojo/20',
}

const defaultBadgeColor = 'bg-marron/10 text-marron hover:bg-marron/20'

// ==================== Component ====================

interface PersonasTableProps {
  onNewPersona?: () => void
}

export default function PersonasTable({ onNewPersona }: PersonasTableProps) {
  const router = useRouter()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchPersonas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: '10',
      })
      if (tipoFilter !== 'todos') params.set('tipo', tipoFilter)
      if (search.trim()) params.set('buscar', search.trim())

      const res = await fetch(`/api/personas?${params}`)
      if (!res.ok) throw new Error('Error al cargar personas')
      const data: PersonasResponse = await res.json()

      setPersonas(data.personas || [])
      setTotalPaginas(data.totalPaginas || 1)
      setTotal(data.total || 0)
    } catch {
      toast.error('Error al cargar personas')
    } finally {
      setLoading(false)
    }
  }, [pagina, tipoFilter, search])

  useEffect(() => {
    fetchPersonas()
  }, [fetchPersonas])

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setPagina(1)
  }, [tipoFilter, search])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/personas/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Persona eliminada')
      fetchPersonas()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar persona'
      toast.error(message)
    } finally {
      setDeleteId(null)
    }
  }

  const getTelefonoPrincipal = (persona: Persona): string => {
    const principal = persona.contactos?.find((c) => c.es_principal)
    if (principal) return principal.valor
    return persona.contactos?.[0]?.valor || '-'
  }

  if (loading && personas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => onNewPersona?.()}
            className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Persona
          </Button>
        </div>

        <Tabs value={tipoFilter} onValueChange={setTipoFilter}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="cliente">Clientes</TabsTrigger>
            <TabsTrigger value="proveedor">Proveedores</TabsTrigger>
            <TabsTrigger value="empleado">Empleados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Foto</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido</TableHead>
                <TableHead className="hidden sm:table-cell">Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search || tipoFilter !== 'todos'
                      ? 'No se encontraron personas'
                      : 'No hay personas registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                personas.map((persona) => (
                  <TableRow
                    key={persona.id}
                    className="hover:bg-mostaza/5 cursor-pointer"
                    onClick={() => router.push(`/admin/personas/${persona.id}`)}
                  >
                    <TableCell>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                        {persona.imagen ? (
                          <Image
                            src={persona.imagen}
                            alt={`${persona.nombre} ${persona.apellido}`}
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
                      {persona.nombre}
                    </TableCell>
                    <TableCell>{persona.apellido}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {persona.numero_documento}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          tipoBadgeColors[persona.tipo_persona] || defaultBadgeColor
                        }
                      >
                        {persona.tipo_persona.charAt(0).toUpperCase() + persona.tipo_persona.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {getTelefonoPrincipal(persona)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-mostaza/10"
                          onClick={() => router.push(`/admin/personas/${persona.id}`)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rojo/10"
                          onClick={() => setDeleteId(persona.id)}
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} persona{total !== 1 ? 's' : ''} en total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="border-marron/10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {pagina} / {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="border-marron/10"
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar persona?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán los contactos y direcciones asociados.
              Si la persona tiene un usuario vinculado, deberá eliminarlo primero.
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
