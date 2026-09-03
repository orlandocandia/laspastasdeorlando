'use client'

/**
 * ============================================================
 * Página — Login de la Cocina Móvil
 * ============================================================
 * URL: /login
 * Accesible desde: cocinamovil.laspastasdeorlando.com.ar
 *
 * Componentes:
 *  - Card con branding de "Cocina Móvil" (logo imagen)
 *  - Campo Email con ícono
 *  - Campo Contraseña con ícono + toggle mostrar/ocultar
 *  - Botón "Ingresar" (mostaza, full width)
 *  - Link "Olvidé mi contraseña" → /recover-password
 *  - Link al sitio principal
 *
 * Conectado a API: POST /api/cocina-movil/auth/login
 *
 * Usuarios demo:
 *  - proyectos.orlando.candia@gmail.com / cocinero123
 *  - orlando.candia@gmail.com / admin123
 *
 * NOTA: `useSearchParams()` debe estar envuelto en <Suspense>.
 * El componente principal exporta un <Suspense> que envuelve a
 * <LoginContent />, que es donde se usa el hook.
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { loginCm, getRedirectPathByRole } from '@/lib/cocina-movil/auth-client'
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
} from 'lucide-react'

type FormState = {
  email: string
  password: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

/**
 * Componente interno con toda la lógica del login.
 * Usa `useSearchParams()` (que requiere Suspense en el padre).
 */
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Si viene ?next=... en la URL, se usa ese path (explicit redirect).
  // Si no, se redirige según el rol del usuario:
  //   admin → /admin/dashboard, cocinero → /cook/dashboard
  const explicitNext = searchParams.get('next')

  const [form, setForm] = React.useState<FormState>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const updateField = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
    setSubmitError(null)
  }

  const validate = (): boolean => {
    const newErrors: FieldErrors = {}
    if (!form.email.trim()) {
      newErrors.email = 'El email es obligatorio.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresá un email válido.'
    }
    if (!form.password) {
      newErrors.password = 'La contraseña es obligatoria.'
    } else if (form.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const result = await loginCm(form.email, form.password)
      if (result.ok && result.user) {
        // Redirigir al destino (por defecto /dashboard)
        const redirectTo = explicitNext || getRedirectPathByRole(result.user.role)
        router.push(redirectTo)
      } else {
        setSubmitError(
          result.error ||
            'Credenciales inválidas. Verificá tu email y contraseña.'
        )
      }
    } catch {
      setSubmitError('Ocurrió un error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-[#5C3A21]/30 shadow-2xl shadow-black/40 overflow-hidden bg-[#FFF8E7]/95 backdrop-blur-sm">
      {/* Banda de color en el borde superior */}
      <div className="h-1.5 bg-gradient-to-r from-[#5C3A21] via-[#E1AD01] to-[#708238]" />

      <CardHeader className="space-y-3 text-center pb-2 pt-6">
        {/* Logo imagen */}
        <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden shadow-lg shadow-[#5C3A21]/40 ring-2 ring-[#E1AD01]/30 bg-white">
          <Image
            src="/images/(cocina-movil)/logo.png"
            alt="Logo Cocina Móvil — El Amigo de las Pastas"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold text-[#5C3A21] tracking-tight">
            Cocina Móvil
          </CardTitle>
          <CardDescription className="text-[#6B5F52] text-sm">
            Iniciá sesión para gestionar pedidos y stock desde el móvil
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 pb-2">
          {/* Email */}
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
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="pl-9 h-11 border-[#5C3A21]/15 bg-white/80 focus-visible:border-[#E1AD01] focus-visible:ring-[#E1AD01]/30"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-xs text-[#B91C1C] mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-[#5C3A21] font-medium"
              >
                Contraseña
              </Label>
              <Link
                href="/recover-password"
                className="text-xs text-[#5C3A21] hover:text-[#E1AD01] hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7E70] pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                className="pl-9 pr-9 h-11 border-[#5C3A21]/15 bg-white/80 focus-visible:border-[#E1AD01] focus-visible:ring-[#E1AD01]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7E70] hover:text-[#5C3A21] transition-colors disabled:opacity-50"
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-[#B91C1C] mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Error de submit */}
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 text-sm text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-3 py-2"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Credenciales demo (solo en dev) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-[11px] text-[#8A7E70] bg-[#5C3A21]/5 border border-[#5C3A21]/10 rounded-md px-3 py-2 space-y-0.5">
              <p className="font-semibold text-[#5C3A21]">Credenciales demo:</p>
              <p>proyectos.orlando.candia@gmail.com / cocinero123</p>
              <p>orlando.candia@gmail.com / admin123</p>
            </div>
          )}
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
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </Button>

          <p className="text-xs text-center text-[#8A7E70]">
            ¿Problemas para ingresar?{' '}
            <a
              href="https://laspastasdeorlando.com.ar"
              className="text-[#5C3A21] hover:text-[#E1AD01] hover:underline font-medium"
            >
              Volvé al sitio principal
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

/**
 * Componente principal de la página.
 * Envuelve <LoginContent /> en un <Suspense> boundary porque
 * `useSearchParams()` lo requiere (Next.js App Router).
 * Mientras carga, muestra un spinner simple en la paleta de marca.
 */
export default function CmLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  )
}
