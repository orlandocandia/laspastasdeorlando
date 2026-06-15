'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Loader2, Upload, X, ImagePlus, Leaf, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CategoriaItem {
  id: number
  nombre: string
  descripcion?: string | null
  seccion?: string | null
  imagen?: string | null
  imagen_integral?: string | null
  imagen_sin_gluten?: string | null
  _count?: { productosTerminados?: number }
}

type TipoCategoria = 'materias-primas' | 'productos-terminados' | 'tipos-insumo'

const TABS: { value: TipoCategoria; label: string }[] = [
  { value: 'materias-primas', label: 'Materias Primas' },
  { value: 'productos-terminados', label: 'Productos Terminados' },
  { value: 'tipos-insumo', label: 'Tipos de Insumo' },
]

// Reusable variant image upload component
function VariantImageUploader({
  label,
  icon,
  imageUrl,
  onImageChange,
  onImageRemove,
  uploading,
  inputRef,
  onFileSelect,
}: {
  label: string
  icon: React.ReactNode
  imageUrl: string | null
  onImageChange: (url: string | null) => void
  onImageRemove: () => void
  uploading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}) {
  return (
    <div>
      <label className="text-sm font-medium text-marron mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
      />
      {imageUrl ? (
        <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-marron/10">
          <Image
            src={imageUrl}
            alt={label}
            fill
            loading="lazy"
            className="object-cover"
            sizes="200px"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Cambiar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onImageRemove}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Quitar
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-4 rounded-lg border-2 border-dashed border-marron/20 hover:border-mostaza/50 hover:bg-mostaza/5 transition-colors text-sm text-muted-foreground"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Subir imagen {label.toLowerCase()}
        </button>
      )}
    </div>
  )
}

export default function CategoriasManager() {
  const [activeTab, setActiveTab] = useState<TipoCategoria>('materias-primas')
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')
  const [nuevaImagen, setNuevaImagen] = useState<string | null>(null)
  const [nuevaSeccion, setNuevaSeccion] = useState<string>('pastas')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editItem, setEditItem] = useState<CategoriaItem | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editSeccion, setEditSeccion] = useState<string>('')
  const [editImagen, setEditImagen] = useState<string | null>(null)
  const [editImagenIntegral, setEditImagenIntegral] = useState<string | null>(null)
  const [editImagenSinGluten, setEditImagenSinGluten] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Delete
  const [deleteItem, setDeleteItem] = useState<CategoriaItem | null>(null)

  // Upload states
  const [uploadingNew, setUploadingNew] = useState(false)
  const [uploadingEditBase, setUploadingEditBase] = useState(false)
  const [uploadingEditIntegral, setUploadingEditIntegral] = useState(false)
  const [uploadingEditSinGluten, setUploadingEditSinGluten] = useState(false)
  const newInputRef = useRef<HTMLInputElement>(null)
  const editBaseInputRef = useRef<HTMLInputElement>(null)
  const editIntegralInputRef = useRef<HTMLInputElement>(null)
  const editSinGlutenInputRef = useRef<HTMLInputElement>(null)

  const isProductosTab = activeTab === 'productos-terminados'

  const fetchCategorias = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/categorias?tipo=${activeTab}`)
      if (!res.ok) throw new Error('Error al cargar categorías')
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload/categoria', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) throw new Error('Error al subir imagen')
    const data = await res.json()
    return data.url
  }

  const handleFileUpload = async (
    file: File,
    setUploading: (v: boolean) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
    onUrl: (url: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }
    setUploading(true)
    try {
      const url = await uploadImage(file)
      if (url) {
        onUrl(url)
        toast.success('Imagen subida')
      }
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleNewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileUpload(file, setUploadingNew, newInputRef, setNuevaImagen)
  }

  const handleEditBaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileUpload(file, setUploadingEditBase, editBaseInputRef, setEditImagen)
  }

  const handleEditIntegralUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileUpload(file, setUploadingEditIntegral, editIntegralInputRef, (url) => setEditImagenIntegral(url))
  }

  const handleEditSinGlutenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileUpload(file, setUploadingEditSinGluten, editSinGlutenInputRef, (url) => setEditImagenSinGluten(url))
  }

  const handleCreate = async () => {
    if (!nuevoNombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        tipo: activeTab,
        nombre: nuevoNombre.trim(),
        descripcion: nuevaDescripcion.trim() || null,
      }
      if (isProductosTab) {
        body.imagen = nuevaImagen || null
        body.seccion = nuevaSeccion || null
      }
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al crear categoría')
      }
      toast.success('Categoría creada')
      setNuevoNombre('')
      setNuevaDescripcion('')
      setNuevaImagen(null)
      setNuevaSeccion('pastas')
      fetchCategorias()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear categoría')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (item: CategoriaItem) => {
    setEditItem(item)
    setEditNombre(item.nombre)
    setEditDescripcion(item.descripcion || '')
    setEditSeccion(item.seccion || '')
    setEditImagen(item.imagen || null)
    setEditImagenIntegral(item.imagen_integral || null)
    setEditImagenSinGluten(item.imagen_sin_gluten || null)
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editItem || !editNombre.trim()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        id: editItem.id,
        tipo: activeTab,
        nombre: editNombre.trim(),
        descripcion: editDescripcion.trim() || null,
      }
      if (isProductosTab) {
        body.imagen = editImagen || null
        body.imagen_integral = editImagenIntegral || null
        body.imagen_sin_gluten = editImagenSinGluten || null
        body.seccion = editSeccion || null
      }
      const res = await fetch('/api/categorias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al actualizar categoría')
      }
      toast.success('Categoría actualizada')
      setEditOpen(false)
      setEditItem(null)
      fetchCategorias()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar categoría')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/categorias?id=${deleteItem.id}&tipo=${activeTab}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar categoría')
      }
      toast.success('Categoría eliminada')
      fetchCategorias()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar categoría')
    } finally {
      setDeleteItem(null)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TipoCategoria)}>
        <TabsList className="grid w-full grid-cols-3">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            {/* Inline create form */}
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-marron/10 bg-muted/30">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium text-marron mb-1 block">Nombre *</label>
                  <Input
                    placeholder="Nombre de la categoría..."
                    value={tab.value === activeTab ? nuevoNombre : ''}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate()
                    }}
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium text-marron mb-1 block">Descripción</label>
                  <Input
                    placeholder="Descripción (opcional)..."
                    value={tab.value === activeTab ? nuevaDescripcion : ''}
                    onChange={(e) => setNuevaDescripcion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate()
                    }}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !nuevoNombre.trim()}
                  className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold shrink-0"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Agregar
                </Button>
              </div>

              {/* Image upload + Seccion for productos-terminados */}
              {tab.value === 'productos-terminados' && (
                <div className="flex items-center gap-3">
                  {/* Seccion dropdown */}
                  <div>
                    <label className="text-sm font-medium text-marron mb-1 block">Sección</label>
                    <select
                      value={nuevaSeccion}
                      onChange={(e) => setNuevaSeccion(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="pastas">🍝 Pastas</option>
                      <option value="horneados">🔥 Horneados</option>
                      <option value="">Sin sección</option>
                    </select>
                  </div>
                  <input
                    ref={newInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleNewImageUpload}
                    className="hidden"
                  />
                  {nuevaImagen ? (
                    <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-marron/10">
                      <Image
                        src={nuevaImagen}
                        alt="Imagen de categoría"
                        fill
                        loading="lazy"
                        className="object-cover"
                        sizes="96px"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-white hover:bg-white/20"
                          onClick={() => setNuevaImagen(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => newInputRef.current?.click()}
                      disabled={uploadingNew}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-marron/20 hover:border-mostaza/50 hover:bg-mostaza/5 transition-colors text-sm text-muted-foreground"
                    >
                      {uploadingNew ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Subir imagen
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-mostaza" />
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay categorías de {tab.label.toLowerCase()} cargadas
              </div>
            ) : (
              <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {tab.value === 'productos-terminados' && (
                        <TableHead className="w-16">Imagen</TableHead>
                      )}
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                      {tab.value === 'productos-terminados' && (
                        <TableHead className="hidden md:table-cell">Sección</TableHead>
                      )}
                      {tab.value === 'productos-terminados' && (
                        <>
                          <TableHead className="text-center hidden md:table-cell">Productos</TableHead>
                          <TableHead className="text-center hidden lg:table-cell">Variantes</TableHead>
                        </>
                      )}
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.map((cat) => {
                      const variantCount = [cat.imagen_integral, cat.imagen_sin_gluten].filter(Boolean).length
                      return (
                        <TableRow key={cat.id} className="hover:bg-mostaza/5">
                          {tab.value === 'productos-terminados' && (
                            <TableCell>
                              {cat.imagen ? (
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-mostaza/20 bg-crema">
                                  <Image
                                    src={cat.imagen}
                                    alt={cat.nombre}
                                    width={40}
                                    height={40}
                                    loading="lazy"
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted border border-marron/10 flex items-center justify-center">
                                  <ImagePlus className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-marron">
                            {cat.nombre}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {cat.descripcion || '-'}
                          </TableCell>
                          {tab.value === 'productos-terminados' && (
                            <TableCell className="hidden md:table-cell">
                              {cat.seccion === 'pastas' ? (
                                <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-xs rounded-full px-2 py-0.5 font-medium">🍝 Pastas</span>
                              ) : cat.seccion === 'horneados' ? (
                                <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 text-xs rounded-full px-2 py-0.5 font-medium">🔥 Horneados</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {tab.value === 'productos-terminados' && (
                            <>
                              <TableCell className="text-center hidden md:table-cell">
                                <span className="bg-mostaza/15 text-marron text-xs rounded-full px-2 py-0.5 font-semibold">
                                  {cat._count?.productosTerminados ?? 0}
                                </span>
                              </TableCell>
                              <TableCell className="text-center hidden lg:table-cell">
                                {variantCount > 0 ? (
                                  <div className="flex items-center justify-center gap-1">
                                    {cat.imagen_integral && (
                                      <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-xs rounded-full px-1.5 py-0.5 font-medium">
                                        <Leaf className="h-3 w-3" />
                                        Int
                                      </span>
                                    )}
                                    {cat.imagen_sin_gluten && (
                                      <span className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-700 text-xs rounded-full px-1.5 py-0.5 font-medium">
                                        <Sparkles className="h-3 w-3" />
                                        SG
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-mostaza/10"
                                onClick={() => handleEdit(cat)}
                              >
                                <Pencil className="h-4 w-4 text-mostaza" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-rojo/10"
                                onClick={() => setDeleteItem(cat)}
                              >
                                <Trash2 className="h-4 w-4 text-rojo" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open)
        if (!open) setEditItem(null)
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">Editar Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-marron mb-1 block">Nombre *</label>
              <Input
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Nombre de la categoría..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-marron mb-1 block">Descripción</label>
              <Textarea
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                placeholder="Descripción (opcional)..."
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Seccion dropdown for productos-terminados */}
            {isProductosTab && (
              <div>
                <label className="text-sm font-medium text-marron mb-1 block">Sección</label>
                <select
                  value={editSeccion}
                  onChange={(e) => setEditSeccion(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="pastas">🍝 Pastas</option>
                  <option value="horneados">🔥 Horneados</option>
                  <option value="">Sin sección</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Define si esta categoría aparece en la sección de Pastas o Horneados en la landing page.
                </p>
              </div>
            )}

            {/* Image uploads for productos-terminados */}
            {isProductosTab && (
              <div className="space-y-4">
                {/* Base image */}
                <div>
                  <label className="text-sm font-medium text-marron mb-1 block">
                    Imagen principal (con gluten)
                  </label>
                  <input
                    ref={editBaseInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditBaseUpload}
                    className="hidden"
                  />
                  {editImagen ? (
                    <div className="relative group w-full h-32 rounded-lg overflow-hidden border border-marron/10">
                      <Image
                        src={editImagen}
                        alt="Imagen de categoría"
                        fill
                        loading="lazy"
                        className="object-cover"
                        sizes="200px"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => editBaseInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Cambiar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setEditImagen(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      {uploadingEditBase && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => editBaseInputRef.current?.click()}
                      disabled={uploadingEditBase}
                      className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-marron/20 hover:border-mostaza/50 hover:bg-mostaza/5 transition-colors text-sm text-muted-foreground"
                    >
                      {uploadingEditBase ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-5 w-5" />
                      )}
                      Subir imagen principal
                    </button>
                  )}
                </div>

                {/* Variant images section */}
                <div className="border-t border-marron/10 pt-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Las imágenes de variantes se muestran en la landing cuando el usuario filtra por tipo de harina.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VariantImageUploader
                      label="Integral"
                      icon={<Leaf className="h-3.5 w-3.5 text-green-600" />}
                      imageUrl={editImagenIntegral}
                      onImageChange={setEditImagenIntegral}
                      onImageRemove={() => setEditImagenIntegral(null)}
                      uploading={uploadingEditIntegral}
                      inputRef={editIntegralInputRef}
                      onFileSelect={handleEditIntegralUpload}
                    />
                    <VariantImageUploader
                      label="Sin Gluten"
                      icon={<Sparkles className="h-3.5 w-3.5 text-purple-600" />}
                      imageUrl={editImagenSinGluten}
                      onImageChange={setEditImagenSinGluten}
                      onImageRemove={() => setEditImagenSinGluten(null)}
                      uploading={uploadingEditSinGluten}
                      inputRef={editSinGlutenInputRef}
                      onFileSelect={handleEditSinGlutenUpload}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
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
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La categoría &quot;{deleteItem?.nombre}&quot; será eliminada permanentemente.
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
