'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react'
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

const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
  codigo2fa: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      codigo2fa: '',
    },
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        codigo2fa: data.codigo2fa || '',
        redirect: false,
      })

      if (result?.error) {
        toast.error('Credenciales incorrectas', {
          description: 'Verificá tu email y contraseña',
        })
        return
      }

      if (result?.ok) {
        toast.success('Bienvenido!', {
          description: 'Iniciando sesión...',
        })
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Error al iniciar sesión', {
        description: 'Intentá de nuevo más tarde',
      })
    } finally {
      setIsLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-marron">Panel de Administración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pastas Orlando - Posadas, Misiones
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-marron">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="tu@email.com"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-marron">Contraseña</FormLabel>
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
              name="codigo2fa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-marron">Código 2FA (opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="6 dígitos"
                        maxLength={6}
                        className="pl-10 border-marron/20 focus:border-mostaza tracking-widest font-mono"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-mostaza hover:bg-mostaza/90 text-marron font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center">
          <Link
            href="/admin/forgot-password"
            className="text-sm text-mostaza hover:text-marron transition-colors font-medium"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-marron transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al sitio
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
