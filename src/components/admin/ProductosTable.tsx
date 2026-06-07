'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Search, Loader2 } from 'lucide-react'

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
import ProductoForm from './ProductoForm'

interface Producto {
  id: number
  nombre: string
  descripcion?: string | null
  categoria: string
  precio: number
  peso: string
  imagen?: string | null
  stock: boolean
  destacado: boolean
  orden: number
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

export default function ProductosTable() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/productos?stock=false')
      if (!res.ok) throw new Error('Error al cargar productos')
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/productos?id=${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Producto eliminado')
      fetchProductos()
    } catch {
      toast.error('Error al eliminar producto')
    } finally {
      setDeleteId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedProducto(null)
    fetchProductos()
  }

  const openNewProduct = () => {
    setSelectedProducto(null)
    setFormOpen(true)
  }

  const openEditProduct = (producto: Producto) => {
    setSelectedProducto(producto)
    setFormOpen(true)
  }

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={openNewProduct}
          className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Img</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? 'No se encontraron productos' : 'No hay productos cargados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProductos.map((producto) => (
                  <TableRow key={producto.id} className="hover:bg-mostaza/5">
                    <TableCell>
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                        {producto.imagen ? (
                          <Image
                            src={producto.imagen}
                            alt={producto.nombre}
                            fill
                            loading="lazy"
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            N/A
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-marron">
                      <div>
                        {producto.nombre}
                        {producto.destacado && (
                          <Badge className="ml-2 bg-mostaza/20 text-mostaza text-[10px] px-1.5">
                            ★
                          </Badge>
                        )}
                      </div>
                      <div className="sm:hidden text-xs text-muted-foreground">
                        {producto.categoria}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="border-marron/20 text-marron">
                        {producto.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(producto.precio)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        className={
                          producto.stock
                            ? 'bg-oliva/10 text-oliva hover:bg-oliva/20'
                            : 'bg-rojo/10 text-rojo hover:bg-rojo/20'
                        }
                      >
                        {producto.stock ? 'En stock' : 'Sin stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-mostaza/10"
                          onClick={() => openEditProduct(producto)}
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rojo/10"
                          onClick={() => setDeleteId(producto.id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open)
        if (!open) setSelectedProducto(null)
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">
              {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <ProductoForm
            producto={selectedProducto}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente del catálogo.
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
