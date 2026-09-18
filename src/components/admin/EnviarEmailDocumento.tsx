'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

interface EnviarEmailDocumentoProps {
  /** Tipo de documento: factura, orden_compra, etc. */
  tipo: string
  /** ID de la entidad */
  id: number
  /** Email pre-cargado del cliente/proveedor (si existe) */
  emailDefault?: string | null
  /** Número de comprobante para mostrar */
  label?: string
  variant?: 'icon' | 'sm'
}

/**
 * Botón + diálogo para enviar un documento por email (PDF adjunto).
 * El PDF se genera server-side en /api/documentos/enviar-pdf.
 */
export default function EnviarEmailDocumento({
  tipo, id, emailDefault, label, variant = 'icon',
}: EnviarEmailDocumentoProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(emailDefault || '')
  const [asunto, setAsunto] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error('Ingrese un email destinatario')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/documentos/enviar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id, destinatario: email.trim(), asunto: asunto.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      toast.success(data.mensaje || 'Documento enviado por email')
      setOpen(false)
      setAsunto('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el documento'
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  const labelText = label || 'Enviar por email'

  if (variant === 'sm') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-oliva/30 text-oliva hover:bg-oliva/10"
          onClick={() => setOpen(true)}
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-marron">Enviar {labelText} por email</DialogTitle>
              <DialogDescription>
                Se generará el PDF y se enviará como adjunto al email indicado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-sm font-medium text-marron">Email destinatario</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-marron">Asunto (opcional)</label>
                <Input
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder={`Se usará un asunto por defecto si lo deja vacío`}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nota: Requiere configurar las variables SMTP_USER y SMTP_PASS en Vercel.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button onClick={handleSend} disabled={sending || !email.trim()} className="gap-1.5">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-oliva/10"
        onClick={() => setOpen(true)}
        title={`Enviar ${labelText} por email`}
      >
        <Mail className="h-4 w-4 text-oliva" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-marron">Enviar {labelText} por email</DialogTitle>
            <DialogDescription>
              Se generará el PDF y se enviará como adjunto al email indicado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium text-marron">Email destinatario</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-marron">Asunto (opcional)</label>
              <Input
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Se usará un asunto por defecto si lo deja vacío"
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Nota: Requiere configurar las variables SMTP_USER y SMTP_PASS en Vercel.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending || !email.trim()} className="gap-1.5">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
