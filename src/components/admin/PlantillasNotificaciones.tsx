'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import {
  Bell,
  Mail,
  MessageCircle,
  Pencil,
  Eye,
  Send,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Code2,
  FileText,
  Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  extraerVariables,
  renderPlantilla,
  renderMarkdownToHtml,
  VARIABLES_PLANTILLA,
  VARIABLES_EJEMPLO,
  type VariablePlantilla,
} from '@/lib/plantillas'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlantillaNotificacion {
  id: number
  nombre: string
  canal: string
  asunto: string | null
  mensaje: string
  activo: boolean
  createdAt: string
  updatedAt: string
  notificacionesCount?: number
}

interface FormState {
  canal: string
  asunto: string
  mensaje: string
  activo: boolean
}

type EditorMode = 'editar' | 'markdown'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getCanalIcon(canal: string) {
  if (canal === 'email') return Mail
  if (canal === 'whatsapp') return MessageCircle
  return Bell
}

function getCanalBadge(canal: string) {
  const Icon = getCanalIcon(canal)
  if (canal === 'email') {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">
        <Mail className="h-3 w-3 mr-1" />
        Email
      </Badge>
    )
  }
  if (canal === 'whatsapp') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
        <MessageCircle className="h-3 w-3 mr-1" />
        WhatsApp
      </Badge>
    )
  }
  return (
    <Badge className="bg-mostaza/15 text-mostaza border-mostaza/30 hover:bg-mostaza/25">
      <Bell className="h-3 w-3 mr-1" />
      Ambos
    </Badge>
  )
}

/**
 * Determina el contexto sugerido de una plantilla a partir de su nombre.
 * Sirve para resaltar las variables más relevantes en el editor.
 */
function getContextoByNombre(nombre: string): 'pedido' | 'stock' | 'general' {
  const n = nombre.toLowerCase()
  if (n.includes('stock')) return 'stock'
  if (n.includes('pedido') || n.includes('entrega')) return 'pedido'
  return 'general'
}

// ---------------------------------------------------------------------------
// Componente: Panel de variables disponibles
// ---------------------------------------------------------------------------

function PanelVariables({
  contexto,
  onInsert,
  detectedas,
}: {
  contexto: 'pedido' | 'stock' | 'general'
  onInsert: (nombre: string) => void
  detectedas: string[]
}) {
  // Mostrar primero las del contexto, luego el resto
  const ordenadas = useMemo(() => {
    const delContexto = VARIABLES_PLANTILLA.filter(
      (v) => v.contexto === 'general' || v.contexto === contexto
    )
    const otras = VARIABLES_PLANTILLA.filter(
      (v) => v.contexto !== 'general' && v.contexto !== contexto
    )
    return [...delContexto, ...otras]
  }, [contexto])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Code2 className="h-3.5 w-3.5 text-mostaza" />
        <p className="text-xs font-medium text-marron">Variables disponibles</p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Click en una variable para insertarla. Formatos: <code className="text-oliva">{`{variable}`}</code> o <code className="text-oliva">{`{{variable}}`}</code>.
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {ordenadas.map((v: VariablePlantilla) => {
          const esDelContexto = v.contexto === 'general' || v.contexto === contexto
          const yaUsada = detectedas.includes(v.nombre)
          return (
            <button
              key={v.nombre}
              type="button"
              onClick={() => onInsert(v.nombre)}
              title={`${v.descripcion} — Ejemplo: ${v.ejemplo}`}
              className={`text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                esDelContexto
                  ? 'text-oliva border-oliva/30 bg-oliva/5 hover:bg-oliva/10'
                  : 'text-muted-foreground border-muted/30 bg-muted/30 hover:bg-muted/50'
              } ${yaUsada ? 'ring-1 ring-oliva/40' : ''}`}
            >
              {`{${v.nombre}}`}
              {yaUsada && <span className="ml-1 text-[9px]">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PlantillasNotificaciones() {
  const [plantillas, setPlantillas] = useState<PlantillaNotificacion[]>([])
  const [loading, setLoading] = useState(true)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PlantillaNotificacion | null>(null)
  const [form, setForm] = useState<FormState>({
    canal: 'email',
    asunto: '',
    mensaje: '',
    activo: true,
  })
  const [saving, setSaving] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('editar')

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewAsunto, setPreviewAsunto] = useState('')
  const [previewCanal, setPreviewCanal] = useState('email')

  // Send test state
  const [testDestinatario, setTestDestinatario] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  // Ref al textarea para insertar variables en la posición del cursor
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchPlantillas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notificaciones/plantillas')
      if (!res.ok) throw new Error('Error al cargar plantillas')
      const data = await res.json()
      setPlantillas(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar plantillas de notificación')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlantillas()
  }, [fetchPlantillas])

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  const openEditDialog = (plantilla: PlantillaNotificacion) => {
    setEditingItem(plantilla)
    setForm({
      canal: plantilla.canal,
      asunto: plantilla.asunto || '',
      mensaje: plantilla.mensaje,
      activo: plantilla.activo,
    })
    setTestDestinatario('')
    setEditorMode('editar')
    setEditOpen(true)
  }

  const closeEditDialog = () => {
    setEditOpen(false)
    setEditingItem(null)
    setForm({ canal: 'email', asunto: '', mensaje: '', activo: true })
    setTestDestinatario('')
  }

  // Variables detectadas en el mensaje actual (formato {var} o {{var}})
  const currentVariables = useMemo(() => {
    return extraerVariables(form.mensaje)
  }, [form.mensaje])

  const contextoActual = useMemo(() => {
    return editingItem ? getContextoByNombre(editingItem.nombre) : 'general'
  }, [editingItem])

  // ---------------------------------------------------------------------------
  // Insertar variable en el cursor del textarea
  // ---------------------------------------------------------------------------

  const insertarVariable = useCallback((nombre: string) => {
    const textarea = textareaRef.current
    const insertText = `{${nombre}}`
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = form.mensaje.substring(0, start) + insertText + form.mensaje.substring(end)
      setForm((prev) => ({ ...prev, mensaje: newValue }))
      // Restaurar el foco y la posición del cursor después del insert
      requestAnimationFrame(() => {
        textarea.focus()
        const newPos = start + insertText.length
        textarea.setSelectionRange(newPos, newPos)
      })
    } else {
      // Fallback: append al final
      setForm((prev) => ({ ...prev, mensaje: prev.mensaje + insertText }))
    }
  }, [form.mensaje])

  // ---------------------------------------------------------------------------
  // Save (update)
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!editingItem) return
    if (!form.mensaje.trim()) {
      toast.error('El mensaje es requerido')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        canal: form.canal,
        mensaje: form.mensaje.trim(),
        activo: form.activo,
      }

      if (form.canal === 'email' || form.canal === 'ambos') {
        body.asunto = form.asunto.trim() || null
      } else {
        body.asunto = null
      }

      const res = await fetch(
        `/api/notificaciones/plantillas/${editingItem.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al actualizar plantilla')
      }

      toast.success('Plantilla actualizada correctamente')
      closeEditDialog()
      fetchPlantillas()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Toggle activo
  // ---------------------------------------------------------------------------

  const handleToggleActivo = async (plantilla: PlantillaNotificacion) => {
    try {
      const res = await fetch(
        `/api/notificaciones/plantillas/${plantilla.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activo: !plantilla.activo }),
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al cambiar estado')
      }
      toast.success(
        plantilla.activo ? 'Plantilla desactivada' : 'Plantilla activada'
      )
      fetchPlantillas()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // ---------------------------------------------------------------------------
  // Preview
  // ---------------------------------------------------------------------------

  const handlePreview = () => {
    const rendered = renderPlantilla(form.mensaje, VARIABLES_EJEMPLO)
    const renderedAsunto = form.asunto
      ? renderPlantilla(form.asunto, VARIABLES_EJEMPLO)
      : ''
    setPreviewContent(rendered)
    setPreviewAsunto(renderedAsunto)
    setPreviewCanal(form.canal)
    setPreviewOpen(true)
  }

  // ---------------------------------------------------------------------------
  // Send test
  // ---------------------------------------------------------------------------

  const handleSendTest = async () => {
    if (!editingItem) return
    if (!testDestinatario.trim()) {
      toast.error('Ingresa un destinatario para la prueba')
      return
    }

    const esEmail = testDestinatario.includes('@')
    const tipo = esEmail ? 'email' : 'whatsapp'

    setSendingTest(true)
    try {
      const renderedMensaje = renderPlantilla(form.mensaje, VARIABLES_EJEMPLO)
      const renderedAsunto = form.asunto
        ? renderPlantilla(form.asunto, VARIABLES_EJEMPLO)
        : undefined

      const res = await fetch('/api/notificaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_plantilla: editingItem.id,
          tipo,
          destinatario: testDestinatario.trim(),
          asunto: renderedAsunto,
          mensaje: renderedMensaje,
          variables: VARIABLES_EJEMPLO,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al enviar prueba')
      }

      const result = await res.json()

      if (tipo === 'whatsapp' && result.envio?.link) {
        toast.success('Link de WhatsApp generado. Se abrirá en una nueva pestaña.', {
          action: {
            label: 'Abrir',
            onClick: () => window.open(result.envio.link, '_blank'),
          },
        })
      } else {
        toast.success(`Notificación de prueba enviada a ${testDestinatario}`)
      }

      fetchPlantillas()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setSendingTest(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = plantillas.length
    const activas = plantillas.filter((p) => p.activo).length
    const inactivas = total - activas
    const emails = plantillas.filter(
      (p) => p.canal === 'email' || p.canal === 'ambos'
    ).length
    const whatsapps = plantillas.filter(
      (p) => p.canal === 'whatsapp' || p.canal === 'ambos'
    ).length
    return { total, activas, inactivas, emails, whatsapps }
  }, [plantillas])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <Bell className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">
            Plantillas de Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Personaliza los mensajes automáticos del sistema con variables y Markdown
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-marron/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-marron">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-marron/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Activas</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-oliva">{stats.activas}</p>
          </CardContent>
        </Card>
        <Card className="border-marron/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Inactivas</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-rojo">{stats.inactivas}</p>
          </CardContent>
        </Card>
        <Card className="border-marron/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              <Mail className="inline h-3 w-3 mr-1" />Email
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-blue-600">{stats.emails}</p>
          </CardContent>
        </Card>
        <Card className="border-marron/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              <MessageCircle className="inline h-3 w-3 mr-1" />WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-green-600">{stats.whatsapps}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
          <span className="ml-3 text-muted-foreground">Cargando plantillas...</span>
        </div>
      ) : plantillas.length === 0 ? (
        <Card className="border-marron/10">
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-marron/20" />
            <h3 className="mt-4 text-lg font-medium text-marron">
              No hay plantillas de notificación
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Las plantillas se crean automáticamente al configurar las notificaciones del sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[180px]">Nombre</TableHead>
                  <TableHead className="min-w-[120px]">Canal</TableHead>
                  <TableHead className="min-w-[180px] hidden md:table-cell">Asunto</TableHead>
                  <TableHead className="min-w-[200px] hidden lg:table-cell">Mensaje</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantillas.map((plantilla) => {
                  const varsEnMensaje = extraerVariables(plantilla.mensaje)
                  return (
                    <TableRow key={plantilla.id} className="hover:bg-mostaza/5">
                      {/* Nombre */}
                      <TableCell>
                        <div className="font-medium text-marron">
                          {plantilla.nombre.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {plantilla.notificacionesCount ?? 0} notificaciones enviadas
                        </div>
                      </TableCell>

                      {/* Canal */}
                      <TableCell>{getCanalBadge(plantilla.canal)}</TableCell>

                      {/* Asunto */}
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[250px] truncate">
                        {plantilla.asunto || (
                          <span className="italic text-muted-foreground/50">Sin asunto</span>
                        )}
                      </TableCell>

                      {/* Mensaje */}
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-[280px]">
                        <div className="truncate">{truncateText(plantilla.mensaje, 80)}</div>
                        {varsEnMensaje.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {varsEnMensaje.slice(0, 3).map((v) => (
                              <Badge key={v} variant="outline" className="text-[10px] px-1 py-0 h-4 text-oliva border-oliva/30">
                                {`{${v}}`}
                              </Badge>
                            ))}
                            {varsEnMensaje.length > 3 && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">
                                +{varsEnMensaje.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Activo */}
                      <TableCell>
                        <button
                          onClick={() => handleToggleActivo(plantilla)}
                          className="flex items-center gap-1.5 transition-colors"
                          title={plantilla.activo ? 'Click para desactivar' : 'Click para activar'}
                        >
                          {plantilla.activo ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-oliva" />
                              <Badge className="bg-oliva/10 text-oliva border-oliva/20 hover:bg-oliva/20">Activo</Badge>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-rojo" />
                              <Badge variant="outline" className="text-rojo border-rojo/20 bg-rojo/5 hover:bg-rojo/10">Inactivo</Badge>
                            </>
                          )}
                        </button>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-mostaza/10"
                          onClick={() => openEditDialog(plantilla)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4 text-mostaza" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Edit Dialog */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron flex items-center gap-2">
              <Pencil className="h-4 w-4 text-mostaza" />
              Editar Plantilla
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-5">
              {/* Nombre (read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-marron">Nombre</Label>
                <div className="flex items-center gap-2 rounded-md border border-marron/10 bg-muted/50 px-3 py-2">
                  {getCanalIcon(editingItem.canal) && (
                    <span className="text-muted-foreground">
                      {(() => {
                        const Icon = getCanalIcon(editingItem.canal)
                        return <Icon className="h-4 w-4" />
                      })()}
                    </span>
                  )}
                  <span className="font-medium text-marron">
                    {editingItem.nombre.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  El nombre de la plantilla es fijo y no se puede modificar
                </p>
              </div>

              {/* Canal selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-marron">Canal de envío</Label>
                <Select
                  value={form.canal}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, canal: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-500" />Email</div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" />WhatsApp</div>
                    </SelectItem>
                    <SelectItem value="ambos">
                      <div className="flex items-center gap-2"><Bell className="h-4 w-5 text-mostaza" />Ambos (Email + WhatsApp)</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Asunto (only when canal includes email) */}
              {(form.canal === 'email' || form.canal === 'ambos') && (
                <div className="space-y-2">
                  <Label htmlFor="asunto" className="text-sm font-medium text-marron flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />Asunto del email
                  </Label>
                  <Input
                    id="asunto"
                    placeholder="Asunto del correo electrónico..."
                    value={form.asunto}
                    onChange={(e) => setForm((prev) => ({ ...prev, asunto: e.target.value }))}
                  />
                  {form.asunto && extraerVariables(form.asunto).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extraerVariables(form.asunto).map((v) => (
                        <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-oliva border-oliva/30 bg-oliva/5">
                          {`{${v}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje con editor Markdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mensaje" className="text-sm font-medium text-marron">
                    Mensaje (plantilla con Markdown)
                  </Label>
                  <ToggleGroup
                    type="single"
                    value={editorMode}
                    onValueChange={(v) => v && setEditorMode(v as EditorMode)}
                    size="sm"
                    variant="outline"
                  >
                    <ToggleGroupItem value="editar" className="text-xs gap-1">
                      <Code2 className="h-3 w-3" />Editar
                    </ToggleGroupItem>
                    <ToggleGroupItem value="markdown" className="text-xs gap-1">
                      <FileText className="h-3 w-3" />Vista Markdown
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {editorMode === 'editar' ? (
                  <Textarea
                    ref={textareaRef}
                    id="mensaje"
                    placeholder="Escribe el mensaje con variables {variable} o {{variable}}. Soporta Markdown: **negrita**, *cursiva*, # título, - lista..."
                    value={form.mensaje}
                    onChange={(e) => setForm((prev) => ({ ...prev, mensaje: e.target.value }))}
                    className="resize-y font-mono text-sm min-h-[200px]"
                    rows={10}
                  />
                ) : (
                  <div
                    className="rounded-md border border-marron/10 bg-crema/30 p-4 min-h-[200px] text-sm text-marron leading-relaxed overflow-y-auto max-h-[400px]"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownToHtml(
                        renderPlantilla(form.mensaje, VARIABLES_EJEMPLO)
                      ),
                    }}
                  />
                )}

                {/* Panel de variables disponibles */}
                <PanelVariables
                  contexto={contextoActual}
                  onInsert={insertarVariable}
                  detectedas={currentVariables}
                />

                {/* Formato Markdown ayuda */}
                <details className="text-[11px] text-muted-foreground">
                  <summary className="cursor-pointer hover:text-marron">Formato Markdown soportado</summary>
                  <div className="mt-2 space-y-1 pl-3">
                    <p><code>**negrita**</code> → <strong>negrita</strong></p>
                    <p><code>*cursiva*</code> → <em>cursiva</em></p>
                    <p><code># Título</code> → encabezado</p>
                    <p><code>- item</code> → lista con viñetas</p>
                    <p><code>`código`</code> → <code>código inline</code></p>
                    <p>Línea en blanco separa párrafos; salto simple = salto de línea.</p>
                  </div>
                </details>
              </div>

              {/* Activo switch */}
              <div className="flex items-center justify-between rounded-lg border border-marron/10 p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-marron flex items-center gap-1.5">
                    {form.activo ? (
                      <ToggleRight className="h-4 w-4 text-oliva" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-rojo" />
                    )}
                    Activo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {form.activo
                      ? 'La plantilla se usará para enviar notificaciones'
                      : 'La plantilla está desactivada y no se enviará'}
                  </p>
                </div>
                <Switch
                  checked={form.activo}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, activo: checked }))}
                />
              </div>

              {/* Separator */}
              <div className="border-t border-marron/10 pt-4 space-y-4">
                {/* Preview & Send Test Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-mostaza/30 text-mostaza hover:bg-mostaza/10"
                    onClick={handlePreview}
                    disabled={!form.mensaje.trim()}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Previsualizar
                  </Button>
                </div>

                {/* Send test section */}
                <div className="rounded-lg border border-marron/10 p-4 bg-crema/30 space-y-3">
                  <Label className="text-sm font-medium text-marron flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-mostaza" />
                    Enviar prueba
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={
                        form.canal === 'whatsapp'
                          ? 'Número de teléfono (ej: 3624123456)'
                          : form.canal === 'email'
                            ? 'Email de destino (ej: test@ejemplo.com)'
                            : 'Email o teléfono de destino'
                      }
                      value={testDestinatario}
                      onChange={(e) => setTestDestinatario(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendTest}
                      disabled={sendingTest || !testDestinatario.trim()}
                      className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold whitespace-nowrap"
                    >
                      {sendingTest ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar prueba
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Se usará la plantilla con datos de ejemplo para enviar una notificación de prueba al destinatario indicado.
                  </p>
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeEditDialog}>Cancelar</Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.mensaje.trim()}
                  className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Preview Dialog */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron flex items-center gap-2">
              <Eye className="h-4 w-4 text-mostaza" />
              Previsualización de Plantilla
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Canal badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Canal:</span>
              {getCanalBadge(previewCanal)}
            </div>

            {/* Email asunto */}
            {(previewCanal === 'email' || previewCanal === 'ambos') && previewAsunto && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Asunto:</Label>
                <div className="rounded-md border border-marron/10 bg-blue-50 px-3 py-2 text-sm text-marron font-medium">
                  {previewAsunto}
                </div>
              </div>
            )}

            {/* Rendered message */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Mensaje renderizado (con datos de ejemplo):</Label>
              <Card className="border-marron/10 overflow-hidden">
                {(previewCanal === 'email' || previewCanal === 'ambos') ? (
                  /* Email-style preview */
                  <div>
                    <div className="bg-mostaza px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-marron" />
                        <span className="text-sm font-semibold text-marron">Pastas Orlando</span>
                      </div>
                    </div>
                    <CardContent className="p-4 bg-crema">
                      <div
                        className="text-sm text-marron leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdownToHtml(previewContent),
                        }}
                      />
                    </CardContent>
                  </div>
                ) : (
                  /* WhatsApp-style preview (texto plano, WhatsApp no renderiza HTML) */
                  <div>
                    <div className="bg-green-600 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-white" />
                        <span className="text-sm font-semibold text-white">WhatsApp Preview</span>
                      </div>
                    </div>
                    <CardContent className="p-4 bg-[#e5ddd5]">
                      <div className="bg-white rounded-lg p-3 max-w-[85%] shadow-sm">
                        <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                          {previewContent}
                        </div>
                        <div className="text-[10px] text-gray-400 text-right mt-1">12:00 ✓✓</div>
                      </div>
                    </CardContent>
                  </div>
                )}
              </Card>
            </div>

            {/* Variables usadas en esta plantilla */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Variables detectadas y datos de ejemplo:
              </Label>
              {currentVariables.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Esta plantilla no usa variables dinámicas.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {currentVariables.map((key) => {
                    const ejemplo = VARIABLES_EJEMPLO[key] || '(sin ejemplo)'
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 rounded-md border border-oliva/20 bg-oliva/5 px-2 py-1"
                      >
                        <span className="text-[10px] font-mono text-oliva">{`{${key}}`}</span>
                        <span className="text-[10px] text-muted-foreground">→</span>
                        <span className="text-[11px] text-marron truncate">{ejemplo}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Close */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
