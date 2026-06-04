'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Lock, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/\d/, 'La contraseña debe contener al menos un número')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula'),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

function PasswordRequirement({
  met,
  text,
}: {
  met: boolean
  text: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm transition-colors">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      )}
      <span className={met ? 'text-green-700' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const newPasswordValue = form.watch('newPassword')
  const confirmPasswordValue = form.watch('confirmPassword')

  // Real-time password requirement checks
  const hasMinLength = newPasswordValue.length >= 8
  const hasNumber = /\d/.test(newPasswordValue)
  const hasUppercase = /[A-Z]/.test(newPasswordValue)
  const passwordsMatch =
    newPasswordValue.length > 0 &&
    confirmPasswordValue.length > 0 &&
    newPasswordValue === confirmPasswordValue

  async function onSubmit(data: ResetPasswordForm) {
    if (!token) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error || 'Error al cambiar la contraseña'
        setErrorMessage(errorMsg)
        toast.error('Error', {
          description: errorMsg,
        })
        return
      }

      setIsSuccess(true)
      toast.success('Contraseña actualizada', {
        description: 'Tu contraseña fue cambiada correctamente',
      })
    } catch {
      const errorMsg = 'Error de conexión. Intentá de nuevo.'
      setErrorMessage(errorMsg)
      toast.error('Error', {
        description: errorMsg,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // No token in URL — show error card
  if (!token) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-xl border-marron/10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-full bg-mostaza/10 flex items-center justify-center p-2">
              <Image
                src="/images/logo.png"
                alt="Pastas Orlando"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-marron">Link inválido</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Este link de recuperación no es válido o está incompleto.
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Link
              href="/admin/forgot-password"
              className="inline-flex items-center text-sm text-mostaza hover:text-marron font-medium transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Solicitar un nuevo link
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-xl border-marron/10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-marron">¡Contraseña actualizada!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Contraseña actualizada correctamente
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center text-sm text-mostaza hover:text-marron font-medium transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Form state
  return (
    <Card className="w-full max-w-md mx-4 shadow-xl border-marron/10">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24 rounded-full bg-mostaza/10 flex items-center justify-center p-2">
            <Image
              src="/images/logo.png"
              alt="Pastas Orlando"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-marron">Nueva Contraseña</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ingresá tu nueva contraseña
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-marron">Nueva contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 border-marron/20 focus:border-mostaza"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-marron">Confirmar contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 border-marron/20 focus:border-mostaza"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password requirements checklist */}
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-marron/5">
              <p className="text-xs font-medium text-marron mb-2">Requisitos de la contraseña:</p>
              <PasswordRequirement
                met={hasMinLength}
                text="Mínimo 8 caracteres"
              />
              <PasswordRequirement
                met={hasNumber}
                text="Al menos un número"
              />
              <PasswordRequirement
                met={hasUppercase}
                text="Al menos una letra mayúscula"
              />
              <PasswordRequirement
                met={passwordsMatch}
                text="Las contraseñas coinciden"
              />
            </div>

            {/* Error message from API */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando contraseña...
                </>
              ) : (
                'Cambiar contraseña'
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-marron transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md mx-4 shadow-xl border-marron/10">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full bg-mostaza/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-mostaza animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-marron">Cargando...</h1>
          </CardHeader>
        </Card>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
