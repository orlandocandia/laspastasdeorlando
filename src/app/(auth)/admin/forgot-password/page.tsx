'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordForm) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || 'Error al enviar el email de recuperación')
        return
      }

      setIsSuccess(true)
    } catch {
      toast.error('Error al enviar el email de recuperación', {
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
        <h1 className="text-2xl font-bold text-marron">Recuperar Contraseña</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Te enviaremos un link para restablecer tu contraseña
        </p>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-marron font-semibold">
                <Mail className="h-5 w-5" />
                <span>Email enviado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Si el email existe en nuestro sistema, recibirás un link de recuperación.
              </p>
            </div>
          </div>
        ) : (
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
                          placeholder="orlando.candia@gmail.com"
                          className="pl-10 border-marron/20 focus:border-mostaza"
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperación'
                )}
              </Button>
            </form>
          </Form>
        )}
        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-marron transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
