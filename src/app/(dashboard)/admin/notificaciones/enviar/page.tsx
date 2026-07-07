'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Send,
  Mail,
  MessageCircle,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Calendar,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  extraerVariables,
  renderPlantilla,
} from '@/lib/plantillas'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Plantilla {
  id: number
  nombre: string
  canal: string
  asunto: string | null
  mensaje: string
  activo: boolean
  notificacionesCount: number
}

interface SendResult {
  success: boolean
  notificacion?: Record<string, unknown>
  envio?: Record<string, unknown>
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function highlightVariables(text: string): React.ReactNode[] {
  // Detecta tanto {var} como {{var}}
  const parts = text.split(/(\{\{\w+\}\}|\{\w+\})/g)
  return parts.map((part, i) => {
    if (/^\{\{\w+\}\}$/.test(part) || /^\{\w+\}$/.test(part)) {
      return (
        <span key={i} className="bg-mostaza/20 text-marron font-semibold px-1 rounded">
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function canalLabel(canal: string): string {
  switch (canal) {
    case 'email': return 'Email'
    case 'whatsapp': return 'WhatsApp'
    case 'ambos': return 'Email + WhatsApp'
    default: return canal
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EnviarNotificacionPage() {
  // Plantillas
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loadingPlantillas, setLoadingPlantillas] = useState(true)

  // Form state
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>('personalizado')
  const [tipo, setTipo] = useState<'email' | 'whatsapp'>('email')
  const [destinatario, setDestinatario] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})

  // Programar
  const [programar, setProgramar] = useState(false)
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [horaProgramada, setHoraProgramada] = useState('')

  // Sending
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<SendResult | null>(null)

  // Selected plantilla data
  const selectedPlantilla = useMemo(
    () => plantillas.find((p) => p.id.toString() === selectedPlantillaId),
    [plantillas, selectedPlantillaId]
  )

  // Extracted variables from template or message
  const currentVariables = useMemo(() => {
    if (selectedPlantilla) {
      return extraerVariables(selectedPlantilla.mensaje)
    }
    return extraerVariables(mensaje)
  }, [selectedPlantilla, mensaje])

  // Rendered preview
  const previewMessage = useMemo(() => {
    if (selectedPlantilla) {
      return renderPlantilla(selectedPlantilla.mensaje, variables)
    }
    return renderPlantilla(mensaje, variables)
  }, [selectedPlantilla, mensaje, variables])

  // Fetch plantillas
  const fetchPlantillas = useCallback(async () => {
    setLoadingPlantillas(true)
    try {
      const res = await fetch('/api/notificaciones/plantillas')
      if (!res.ok) throw new Error()
      const data: Plantilla[] = await res.json()
      setPlantillas(data.filter((p) => p.activo))
    } catch {
      toast.error('Error al cargar las plantillas')
    } finally {
      setLoadingPlantillas(false)
    }
  }, [])

  useEffect(() => {
    fetchPlantillas()
  }, [fetchPlantillas])

  // Whether user can choose tipo (personalizado or canal='ambos')
  const canChooseTipo = selectedPlantillaId === 'personalizado' ||
    (selectedPlantilla?.canal === 'ambos')

  // When plantilla changes, auto-fill tipo and asunto
  const handlePlantillaChange = (value: string) => {
    setSelectedPlantillaId(value)
    setVariables({})

    if (value === 'personalizado') {
      // Keep current tipo and mensaje
      return
    }

    const plantilla = plantillas.find((p) => p.id.toString() === value)
    if (plantilla) {
      // Set tipo based on plantilla canal
      if (plantilla.canal === 'whatsapp') {
        setTipo('whatsapp')
      } else if (plantilla.canal === 'ambos') {
        // For 'ambos', keep current selection (user can change it)
      } else {
        setTipo('email')
      }
      if (plantilla.asunto) {
        setAsunto(plantilla.asunto)
      } else {
        setAsunto('')
      }
      setMensaje(plantilla.mensaje)
    }
  }

  // Update variable value
  const updateVariable = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  // Validate and send
  const handleSend = async (esProgramado: boolean = false) => {
    if (!destinatario.trim()) {
      toast.error('El destinatario es obligatorio')
      return
    }

    const mensajeFinal = selectedPlantilla
      ? renderPlantilla(selectedPlantilla.mensaje, variables)
      : renderPlantilla(mensaje, variables)

    if (!mensajeFinal.trim()) {
      toast.error('El mensaje no puede estar vacío')
      return
    }

    if (tipo === 'email' && !asunto.trim()) {
      toast.error('El asunto es obligatorio para emails')
      return
    }

    if (esProgramado && (!fechaProgramada || !horaProgramada)) {
      toast.error('Debes seleccionar fecha y hora para programar el envío')
      return
    }

    setSending(true)
    setLastResult(null)

    try {
      const body: Record<string, unknown> = {
        tipo,
        destinatario: destinatario.trim(),
        mensaje: mensajeFinal,
      }

      if (selectedPlantilla) {
        body.id_plantilla = selectedPlantilla.id
      }

      if (tipo === 'email') {
        body.asunto = asunto.trim()
      }

      // Only send variables if there are filled ones
      const filledVars = Object.fromEntries(
        Object.entries(variables).filter(([, v]) => v.trim())
      )
      if (Object.keys(filledVars).length > 0) {
        body.variables = filledVars
      }

      if (esProgramado) {
        body.fecha_programada = `${fechaProgramada}T${horaProgramada}:00`
      }

      const res = await fetch('/api/notificaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar la notificación')
      }

      setLastResult(data)
      toast.success(
        esProgramado
          ? 'Notificación programada correctamente'
          : 'Notificación enviada correctamente'
      )
    } catch (err: unknown) {
      const errorResult: SendResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
      }
      setLastResult(errorResult)
      toast.error(err instanceof Error ? err.message : 'Error al enviar la notificación')
    } finally {
      setSending(false)
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <Send className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Enviar Notificación</h1>
          <p className="text-sm text-muted-foreground">Envía notificaciones manuales por email o WhatsApp</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ---- Form (2 cols) ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plantilla selector */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                <FileText className="h-4 w-4 text-mostaza" />
                Plantilla
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPlantillaId} onValueChange={handlePlantillaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personalizado">Mensaje personalizado</SelectItem>
                  <Separator className="my-1" />
                  {loadingPlantillas ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : plantillas.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No hay plantillas disponibles
                    </SelectItem>
                  ) : (
                    plantillas.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nombre} ({canalLabel(p.canal)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Template message preview with highlighted variables */}
              {selectedPlantilla && (
                <div className="rounded-lg bg-crema/50 border border-marron/10 p-4 space-y-2">
                  <p className="text-xs font-medium text-marron flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Plantilla original
                  </p>
                  <p className="text-sm text-marron whitespace-pre-wrap leading-relaxed">
                    {highlightVariables(selectedPlantilla.mensaje)}
                  </p>
                  {selectedPlantilla.asunto && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      Asunto: {highlightVariables(selectedPlantilla.asunto)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                {tipo === 'email' ? (
                  <Mail className="h-4 w-4 text-rojo" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-oliva" />
                )}
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo */}
              {canChooseTipo && (
                <div className="grid gap-2">
                  <Label className="text-marron font-medium">Tipo de notificación</Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v as 'email' | 'whatsapp')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </span>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <span className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Destinatario */}
              <div className="grid gap-2">
                <Label className="text-marron font-medium">
                  Destinatario {tipo === 'email' ? '(email)' : '(teléfono)'}
                </Label>
                <Input
                  type={tipo === 'email' ? 'email' : 'tel'}
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  placeholder={tipo === 'email' ? 'correo@ejemplo.com' : '3624123456'}
                />
              </div>

              {/* Asunto (only for email) */}
              {tipo === 'email' && (
                <div className="grid gap-2">
                  <Label className="text-marron font-medium">Asunto</Label>
                  <Input
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Asunto del email"
                    disabled={!!selectedPlantilla?.asunto && selectedPlantillaId !== 'personalizado'}
                  />
                </div>
              )}

              {/* Mensaje (only for personalizado) */}
              {selectedPlantillaId === 'personalizado' && (
                <div className="grid gap-2">
                  <Label className="text-marron font-medium">Mensaje</Label>
                  <Textarea
                    rows={5}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe el mensaje... Puedes usar {{variable}} para insertar variables dinámicas."
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa {'{{variable}}'} para insertar valores dinámicos en el mensaje.
                  </p>
                </div>
              )}

              {/* Variable inputs */}
              {currentVariables.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-marron font-medium">Variables</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {currentVariables.map((varName) => (
                      <div key={varName} className="grid gap-1.5">
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <span className="bg-mostaza/20 text-marron px-1.5 py-0.5 rounded text-xs font-mono">
                            {`{{${varName}}}`}
                          </span>
                        </Label>
                        <Input
                          value={variables[varName] || ''}
                          onChange={(e) => updateVariable(varName, e.target.value)}
                          placeholder={varName}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programar */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-marron flex items-center gap-2">
                  <Clock className="h-4 w-4 text-mostaza" />
                  Programar envío
                </CardTitle>
                <Switch
                  checked={programar}
                  onCheckedChange={setProgramar}
                />
              </div>
            </CardHeader>
            {programar && (
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-marron font-medium">Fecha</Label>
                    <Input
                      type="date"
                      value={fechaProgramada}
                      onChange={(e) => setFechaProgramada(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-marron font-medium">Hora</Label>
                    <Input
                      type="time"
                      value={horaProgramada}
                      onChange={(e) => setHoraProgramada(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  La notificación se enviará automáticamente en la fecha y hora seleccionada.
                </p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* ---- Sidebar (1 col) ---- */}
        <div className="space-y-6">
          {/* Preview */}
          <Card className="border-marron/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-marron flex items-center gap-2">
                <Eye className="h-4 w-4 text-mostaza" />
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Tipo badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    tipo === 'email'
                      ? 'border-rojo/30 text-rojo'
                      : 'border-oliva/30 text-oliva'
                  }
                >
                  {tipo === 'email' ? (
                    <Mail className="h-3 w-3 mr-1" />
                  ) : (
                    <MessageCircle className="h-3 w-3 mr-1" />
                  )}
                  {tipo === 'email' ? 'Email' : 'WhatsApp'}
                </Badge>
                {programar && fechaProgramada && horaProgramada && (
                  <Badge variant="outline" className="border-mostaza/30 text-mostaza">
                    <Calendar className="h-3 w-3 mr-1" />
                    {fechaProgramada} {horaProgramada}
                  </Badge>
                )}
              </div>

              {/* Destinatario */}
              <div className="text-sm">
                <span className="text-muted-foreground">Para: </span>
                <span className="text-marron font-medium">
                  {destinatario || '(sin destinatario)'}
                </span>
              </div>

              {/* Asunto (email) */}
              {tipo === 'email' && asunto && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Asunto: </span>
                  <span className="text-marron font-medium">{asunto}</span>
                </div>
              )}

              <Separator className="bg-marron/5" />

              {/* Message preview */}
              <div className="rounded-lg bg-crema/50 border border-marron/10 p-3 max-h-60 overflow-y-auto custom-scrollbar">
                {previewMessage ? (
                  <p className="text-sm text-marron whitespace-pre-wrap leading-relaxed">
                    {previewMessage}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    El mensaje aparecerá aquí...
                  </p>
                )}
              </div>

              {/* WhatsApp sending info */}
              {tipo === 'whatsapp' && destinatario && previewMessage && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs text-green-700 font-medium mb-1">
                    📱 El mensaje se enviará directamente por WhatsApp
                  </p>
                  <p className="text-xs text-green-600">
                    Destino: +{destinatario.replace(/\D/g, '').startsWith('54') ? destinatario.replace(/\D/g, '') : '54' + destinatario.replace(/\D/g, '')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <Card className="border-marron/10">
            <CardContent className="pt-6 space-y-3">
              <Button
                className="w-full bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
                onClick={() => handleSend(false)}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar ahora
              </Button>

              <Button
                variant="outline"
                className="w-full border-marron/20 text-marron hover:bg-marron/5"
                onClick={() => handleSend(true)}
                disabled={sending || !programar}
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                Programar
              </Button>

              {!programar && (
                <p className="text-xs text-muted-foreground text-center">
                  Activa &quot;Programar envío&quot; para enviar en una fecha futura
                </p>
              )}
            </CardContent>
          </Card>

          {/* Result */}
          {lastResult && (
            <Card
              className={`border-2 ${
                lastResult.success
                  ? 'border-oliva/30 bg-oliva/5'
                  : 'border-rojo/30 bg-rojo/5'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {lastResult.success ? (
                    <CheckCircle className="h-5 w-5 text-oliva shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rojo shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm space-y-1">
                    <p className={`font-semibold ${lastResult.success ? 'text-oliva' : 'text-rojo'}`}>
                      {lastResult.success
                        ? lastResult.envio && (lastResult.envio as Record<string, unknown>).link
                          ? 'Link de WhatsApp generado'
                          : 'Notificación enviada correctamente'
                        : 'Error al enviar'}
                    </p>
                    {lastResult.error && (
                      <p className="text-rojo text-xs">{lastResult.error}</p>
                    )}
                    {lastResult.success && lastResult.envio && (lastResult.envio as Record<string, unknown>).message && (
                      <p className="text-xs text-muted-foreground">
                        {(lastResult.envio as Record<string, unknown>).message as string}
                      </p>
                    )}
                    {lastResult.success && lastResult.notificacion && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>
                          ID: #{(lastResult.notificacion as Record<string, unknown>).id}
                        </p>
                        <p>
                          Estado:{' '}
                          {(lastResult.notificacion as Record<string, unknown>).estado as string}
                        </p>
                        {lastResult.envio &&
                          (lastResult.envio as Record<string, unknown>).link && (
                            <a
                              href={(lastResult.envio as Record<string, unknown>).link as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-oliva underline block mt-1"
                            >
                              Abrir WhatsApp ↗
                            </a>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
