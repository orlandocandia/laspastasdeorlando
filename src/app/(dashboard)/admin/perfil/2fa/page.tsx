'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { KeyRound, ShieldCheck, ShieldOff, Loader2, Copy, Check, AlertTriangle, QrCode } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

interface TwoFAStatus {
  activado: boolean
  fecha_activacion: string | null
}

interface TwoFAActivateResponse {
  secret: string
  qr_code_url: string
  manual_entry: string
}

export default function TwoFAPage() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id

  const [status, setStatus] = useState<TwoFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [disabling, setDisabling] = useState(false)

  // Step-based activation
  const [step, setStep] = useState<'idle' | 'qr' | 'verify' | 'done'>('idle')
  const [activateData, setActivateData] = useState<TwoFAActivateResponse | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  // Disable dialog
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [disableCode, setDisableCode] = useState('')

  // Copy states
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/2fa/status?id_usuario=${userId}`)
      if (!res.ok) throw new Error('Error al verificar estado 2FA')
      const data = await res.json()
      setStatus(data)
    } catch {
      toast.error('Error al verificar estado de 2FA')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const handleActivate = async () => {
    if (!userId) return
    setActivating(true)
    try {
      const res = await fetch('/api/2fa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al activar 2FA')
      }
      const data = await res.json()
      setActivateData(data)
      setStep('qr')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al activar 2FA')
    } finally {
      setActivating(false)
    }
  }

  const handleVerify = async () => {
    if (!userId || !verifyCode.trim()) return
    setVerifying(true)
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userId, codigo: verifyCode.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Código incorrecto')
      }
      const data = await res.json()
      setBackupCodes(data.backup_codes || [])
      setStep('done')
      toast.success('2FA activado correctamente')
      fetchStatus()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Código incorrecto')
    } finally {
      setVerifying(false)
    }
  }

  const handleDisable = async () => {
    if (!userId || !disableCode.trim()) return
    setDisabling(true)
    try {
      const res = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userId, codigo: disableCode.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Código incorrecto')
      }
      toast.success('2FA desactivado correctamente')
      setDisableDialogOpen(false)
      setDisableCode('')
      setStep('idle')
      setActivateData(null)
      fetchStatus()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Código incorrecto')
    } finally {
      setDisabling(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'secret' | 'codes') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      } else {
        setCopiedCodes(true)
        setTimeout(() => setCopiedCodes(false), 2000)
      }
      toast.success('Copiado al portapapeles')
    } catch {
      toast.error('Error al copiar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <KeyRound className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Autenticación de Dos Factores</h1>
          <p className="text-sm text-muted-foreground">
            Añade una capa extra de seguridad a tu cuenta
          </p>
        </div>
      </div>

      {/* Status Card */}
      {status?.activado ? (
        <Card className="border-oliva/20 bg-oliva/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-oliva/20 p-2">
                  <ShieldCheck className="h-6 w-6 text-oliva" />
                </div>
                <div>
                  <CardTitle className="text-oliva">2FA Activado</CardTitle>
                  <CardDescription>
                    Tu cuenta está protegida con autenticación de dos factores
                    {status.fecha_activacion && (
                      <> — Activado el {new Date(status.fecha_activacion).toLocaleDateString('es-AR')}</>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-oliva/10 text-oliva border-oliva/20">Activo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cada vez que inicies sesión, se te pedirá un código de verificación de tu aplicación autenticadora.
            </p>
            <Button
              variant="outline"
              className="border-rojo/20 text-rojo hover:bg-rojo/10"
              onClick={() => setDisableDialogOpen(true)}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Desactivar 2FA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-marron/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-mostaza/10 p-2">
                <KeyRound className="h-6 w-6 text-mostaza" />
              </div>
              <div>
                <CardTitle className="text-marron">2FA No Activado</CardTitle>
                <CardDescription>
                  Protege tu cuenta con autenticación de dos factores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La autenticación de dos factores añade una capa adicional de seguridad. 
              Al iniciar sesión, además de tu contraseña, necesitarás un código de tu aplicación autenticadora.
            </p>

            {/* Step 1: Generate QR */}
            {step === 'idle' && (
              <Button
                onClick={handleActivate}
                disabled={activating}
                className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
              >
                {activating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                ) : (
                  <><QrCode className="mr-2 h-4 w-4" /> Generar código QR</>
                )}
              </Button>
            )}

            {/* Step 2: QR Code + Secret */}
            {step === 'qr' && activateData && (
              <div className="space-y-4 border-t border-marron/10 pt-4">
                <div className="text-center">
                  <h3 className="font-semibold text-marron mb-1">Paso 1: Escaneá el código QR</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Usá tu aplicación autenticadora (Google Authenticator, Authy, etc.) para escanear este código.
                  </p>
                  <div className="inline-block bg-white p-3 rounded-xl shadow-md border border-marron/10">
                    <Image
                      src={activateData.qr_code_url}
                      alt="Código QR para 2FA"
                      width={200}
                      height={200}
                      loading="lazy"
                      className="rounded"
                      unoptimized
                    />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Clave manual (si no podés escanear el QR)</p>
                      <code className="text-sm font-mono text-marron break-all">{activateData.manual_entry}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 ml-2"
                      onClick={() => copyToClipboard(activateData.manual_entry, 'secret')}
                    >
                      {copiedSecret ? <Check className="h-4 w-4 text-oliva" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => { setStep('idle'); setActivateData(null) }}>
                    Volver
                  </Button>
                  <Button
                    onClick={() => setStep('verify')}
                    className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Verify Code */}
            {step === 'verify' && (
              <div className="space-y-4 border-t border-marron/10 pt-4">
                <h3 className="font-semibold text-marron">Paso 2: Verificá el código</h3>
                <p className="text-sm text-muted-foreground">
                  Ingresá el código de 6 dígitos que aparece en tu aplicación autenticadora.
                </p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-lg tracking-widest font-mono border-marron/20 focus:border-mostaza"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleVerify}
                    disabled={verifying || verifyCode.length !== 6}
                    className="bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
                  >
                    {verifying ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                    ) : (
                      'Verificar'
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => { setStep('qr'); setVerifyCode('') }}
                >
                  Volver al código QR
                </Button>
              </div>
            )}

            {/* Step 4: Backup Codes */}
            {step === 'done' && backupCodes.length > 0 && (
              <div className="space-y-4 border-t border-marron/10 pt-4">
                <div className="flex items-center gap-2 text-oliva">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-semibold">2FA Activado correctamente</h3>
                </div>
                <div className="bg-rojo/5 border border-rojo/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-rojo mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold text-sm">Guardá estos códigos de respaldo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Si perdés acceso a tu aplicación autenticadora, podés usar estos códigos para iniciar sesión. 
                    Cada código solo se puede usar una vez.
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-white rounded-lg p-3 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="text-center text-marron py-1">{code}</div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                  >
                    {copiedCodes ? <Check className="h-4 w-4 text-oliva" /> : <Copy className="h-4 w-4" />}
                    {copiedCodes ? 'Copiado' : 'Copiar códigos'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-marron/10">
        <CardHeader>
          <CardTitle className="text-marron text-base">¿Cómo funciona 2FA?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Activás 2FA y escaneás el código QR con una app autenticadora (Google Authenticator, Authy, etc.)</p>
          <p>2. Cada vez que inicies sesión, se te pedirá un código de 6 dígitos además de tu contraseña</p>
          <p>3. El código cambia cada 30 segundos, por lo que es único y temporal</p>
          <p>4. Si perdés tu dispositivo, usá uno de los códigos de respaldo para acceder</p>
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-marron">Desactivar 2FA</DialogTitle>
            <DialogDescription>
              Ingresá el código de tu aplicación autenticadora para confirmar la desactivación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-rojo/5 border border-rojo/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-rojo text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Esto reducirá la seguridad de tu cuenta. Solo desactivá 2FA si es necesario.</span>
              </div>
            </div>
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Código de 6 dígitos"
              className="text-center text-lg tracking-widest font-mono border-marron/20 focus:border-mostaza"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDisableDialogOpen(false); setDisableCode('') }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disabling || disableCode.length !== 6}
            >
              {disabling ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Desactivando...</>
              ) : (
                'Desactivar 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
