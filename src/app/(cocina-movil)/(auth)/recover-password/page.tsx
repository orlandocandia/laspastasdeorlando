'use client'

/**
 * ============================================================
 * Página — Recuperar contraseña de la Cocina Móvil
 * ============================================================
 * URL: /recover-password
 *
 * Flujo:
 *  1. Usuario ingresa su email.
 *  2. Se llama a POST /api/cocina-movil/auth/recover-password
 *  3. Se muestra una pantalla de confirmación genérica
 *     (no revela si el email existe o no, por seguridad).
 *
 * Conectado a API: POST /api/cocina-movil/auth/recover-password
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requestCmPasswordReset } from '@/lib/cocina-movil/auth-client'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'

export default function CmRecoverPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const [confirmMessage, setConfirmMessage] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Por favor ingresá tu email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresá un email válido.')
      return
    }

    setLoading(true)
    try {
      const result = await requestCmPasswordReset(email)
      // El backend siempre devuelve el mismo mensaje genérico
      setConfirmMessage(
        result.message ||
          'Si el email está registrado, te enviaremos las instrucciones.'
      )
      setSent(true)
    } catch {
      setError('Ocurrió un error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Pantalla de confirmación ----------
  if (sent) {
    return (
      <Card className="border-[#5C3A21]/30 shadow-2xl shadow-black/40 overflow-hidden text-center bg-[#FFF8E7]/95 backdrop-blur-sm">
        <div className="h-1.5 bg-gradient-to-r from-[#708238] via-[#E1AD01] to-[#5C3A21]" />

        <CardHeader className="space-y-3 pb-2 pt-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-[#708238]/15 flex items-center justify-center ring-4 ring-[#708238]/20">
            <CheckCircle2 className="h-8 w-8 text-[#708238]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#5C3A21]">
            Revisá tu email
          </CardTitle>
          <CardDescription className="text-[#6B5F52] text-sm leading-relaxed">
            Si el email{' '}
            <strong className="text-[#5C3A21] break-all">{email}</strong>{' '}
            está registrado en la cocina móvil, te enviamos las
            instrucciones para crear una nueva contraseña.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="rounded-md bg-[#E1AD01]/10 border border-[#E1AD01]/30 px-3 py-2 text-xs text-[#7a5c00] flex items-start gap-2 text-left">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Si no recibís el email en unos minutos, revisá la carpeta de
              spam o correo no deseado. Por seguridad, no revelamos si el
              email existe en nuestra base.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2 pt-2 pb-6">
          <Button
            variant="outline"
            asChild
            className="w-full h-11 border-[#5C3A21]/20 text-[#5C3A21] hover:bg-[#5C3A21]/5 hover:text-[#5C3A21]"
          >
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Volver a iniciar sesión
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => {
              setSent(false)
              setEmail('')
              setError(null)
              setConfirmMessage('')
            }}
            className="inline-flex items-center gap-1 text-xs text-[#8A7E70] hover:text-[#5C3A21] hover:underline transition-colors mt-1"
          >
            <RotateCcw className="h-3 w-3" />
            Enviar a otro email
          </button>
        </CardFooter>
      </Card>
    )
  }

  // ---------- Formulario ----------
  return (
    <Card className="border-[#5C3A21]/30 shadow-2xl shadow-black/40 overflow-hidden bg-[#FFF8E7]/95 backdrop-blur-sm">
      <div className="h-1.5 bg-gradient-to-r from-[#5C3A21] via-[#E1AD01] to-[#708238]" />

      <CardHeader className="space-y-3 pb-2 pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#8A7E70] hover:text-[#5C3A21] transition-colors w-fit -ml-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver al login
        </Link>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold text-[#5C3A21] tracking-tight">
            Recuperar contraseña
          </CardTitle>
          <CardDescription className="text-[#6B5F52] text-sm">
            Ingresá tu email y te enviaremos las instrucciones para crear
            una nueva contraseña.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 pb-2">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#5C3A21] font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70] pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="email"
                type="email"
                placeholder="proyectos.orlando.candia@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
                aria-invalid={!!error}
                className="pl-9 h-11 border-[#5C3A21]/15 bg-white/80 focus-visible:border-[#E1AD01] focus-visible:ring-[#E1AD01]/30"
              />
            </div>
            {error && (
              <p className="text-xs text-[#B91C1C] mt-1" role="alert">
                {error}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 pt-2 pb-6">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611] font-semibold shadow-md shadow-[#E1AD01]/30 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              'Enviar instrucciones'
            )}
          </Button>

          <p className="text-xs text-center text-[#8A7E70]">
            ¿Recordaste tu contraseña?{' '}
            <Link
              href="/login"
              className="text-[#5C3A21] hover:text-[#E1AD01] hover:underline font-medium"
            >
              Volver a iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
