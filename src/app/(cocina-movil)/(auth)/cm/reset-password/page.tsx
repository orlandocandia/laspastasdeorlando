'use client'

/**
 * ============================================================
 * Página — Restablecer contraseña de la Cocina Móvil
 * ============================================================
 * URL: /reset-password?token=XXX
 *
 * Flujo:
 *  1. El usuario llega desde el enlace del email (con token).
 *  2. Si el token es inválido/expirado/usado, muestra error.
 *  3. Ingresa nueva contraseña + confirmación.
 *  4. POST /api/cocina-movil/auth/reset-password con { token, newPassword }.
 *  5. Si OK, muestra mensaje de éxito y link a /login.
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldAlert,
  XCircle,
} from 'lucide-react'

type ViewState = 'form' | 'success' | 'error'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [view, setView] = React.useState<ViewState>('form')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<{
    password?: string
    confirm?: string
  }>({})

  // Si no hay token, mostrar error inmediatamente
  React.useEffect(() => {
    if (!token) {
      setView('error')
      setErrorMessage(
        'Falta el token de recuperación. Solicitá un nuevo enlace desde la página de recuperación.'
      )
    }
  }, [token])

  const validate = (): boolean => {
    const errors: { password?: string; confirm?: string } = {}
    if (!password) {
      errors.password = 'La contraseña es obligatoria.'
    } else if (password.length < 6) {
      errors.password = 'Mínimo 6 caracteres.'
    }
    if (!confirmPassword) {
      errors.confirm = 'Confirmá la contraseña.'
    } else if (password !== confirmPassword) {
      errors.confirm = 'Las contraseñas no coinciden.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setView('error')
      return
    }
    if (!validate()) return

    setLoading(true)
    setFieldErrors({})

    try {
      const res = await fetch('/api/cocina-movil/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.ok) {
        setView('success')
      } else {
        // Token inválido/expirado/usado → ir a error
        setView('error')
        setErrorMessage(
          typeof data.error === 'string'
            ? data.error
            : 'El enlace de recuperación no es válido o expiró.'
        )
      }
    } catch {
      setView('error')
      setErrorMessage('No se pudo conectar con el servidor. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Pantalla de error ----------
  if (view === 'error') {
    return (
      <Card className="border-[#5C3A21]/30 shadow-2xl shadow-black/40 overflow-hidden bg-[#FFF8E7]/95 backdrop-blur-sm text-center">
        <div className="h-1.5 bg-gradient-to-r from-[#B91C1C] via-[#5C3A21] to-[#B91C1C]" />
        <CardHeader className="space-y-3 pb-2 pt-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-[#B91C1C]/10 flex items-center justify-center ring-4 ring-[#B91C1C]/15">
            <XCircle className="h-8 w-8 text-[#B91C1C]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#5C3A21]">
            Enlace inválido
          </CardTitle>
          <CardDescription className="text-[#6B5F52] text-sm leading-relaxed">
            {errorMessage ||
              'El enlace de recuperación no es válido, ha expirado o ya fue utilizado.'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col gap-2 pt-2 pb-6">
          <Button
            variant="outline"
            asChild
            className="w-full h-11 border-[#5C3A21]/20 text-[#5C3A21] hover:bg-[#5C3A21]/5"
          >
            <Link href="/recover-password">
              <ArrowLeft className="h-4 w-4" />
              Solicitar nuevo enlace
            </Link>
          </Button>
          <Link
            href="/login"
            className="text-xs text-[#8A7E70] hover:text-[#5C3A21] hover:underline mt-1"
          >
            Volver a iniciar sesión
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // ---------- Pantalla de éxito ----------
  if (view === 'success') {
    return (
      <Card className="border-[#5C3A21]/30 shadow-2xl shadow-black/40 overflow-hidden bg-[#FFF8E7]/95 backdrop-blur-sm text-center">
        <div className="h-1.5 bg-gradient-to-r from-[#708238] via-[#E1AD01] to-[#5C3A21]" />
        <CardHeader className="space-y-3 pb-2 pt-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-[#708238]/15 flex items-center justify-center ring-4 ring-[#708238]/20">
            <CheckCircle2 className="h-8 w-8 text-[#708238]" />
          </div>
          <CardTitle className="text-xl font-bold text-[#5C3A21]">
            ¡Contraseña actualizada!
          </CardTitle>
          <CardDescription className="text-[#6B5F52] text-sm leading-relaxed">
            Tu contraseña se cambió correctamente. Ya podés iniciar sesión con
            tu nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col gap-2 pt-2 pb-6">
          <Button
            asChild
            className="w-full h-11 bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611] font-semibold shadow-md shadow-[#E1AD01]/30"
          >
            <Link href="/login">
              <Lock className="h-4 w-4" />
              Iniciar sesión
            </Link>
          </Button>
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
            Nueva contraseña
          </CardTitle>
          <CardDescription className="text-[#6B5F52] text-sm">
            Ingresá tu nueva contraseña. Debe tener al menos 6 caracteres.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 pb-2">
          {/* Nueva contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[#5C3A21] font-medium">
              Nueva contraseña
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70] pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
                aria-invalid={!!fieldErrors.password}
                className="pl-9 pr-9 h-11 border-[#5C3A21]/15 bg-white/80 focus-visible:border-[#E1AD01] focus-visible:ring-[#E1AD01]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7E70] hover:text-[#5C3A21] transition-colors disabled:opacity-50"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-[#5C3A21] font-medium">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70] pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
                aria-invalid={!!fieldErrors.confirm}
                className="pl-9 pr-9 h-11 border-[#5C3A21]/15 bg-white/80 focus-visible:border-[#E1AD01] focus-visible:ring-[#E1AD01]/30"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7E70] hover:text-[#5C3A21] transition-colors disabled:opacity-50"
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirm && (
              <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.confirm}</p>
            )}
          </div>

          {/* Aviso de seguridad */}
          <div className="rounded-md bg-[#E1AD01]/10 border border-[#E1AD01]/30 px-3 py-2 text-xs text-[#7a5c00] flex items-start gap-2">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Este enlace expira en 1 hora y puede usarse una sola vez. Si no
              solicitaste este cambio, ignorá este mensaje.
            </span>
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
                Actualizando…
              </>
            ) : (
              'Cambiar contraseña'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

/**
 * Componente principal envuelto en Suspense (useSearchParams lo requiere).
 */
export default function CmResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  )
}
