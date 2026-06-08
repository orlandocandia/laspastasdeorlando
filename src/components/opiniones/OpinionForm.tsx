'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import StarRating from './StarRating'

export default function OpinionForm() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error('Por favor ingresá tu nombre')
      return
    }
    if (calificacion === 0) {
      toast.error('Por favor seleccioná una calificación')
      return
    }
    if (!comentario.trim()) {
      toast.error('Por favor escribí un comentario')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/opiniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim() || null,
          calificacion,
          comentario: comentario.trim(),
        }),
      })

      if (res.ok) {
        toast.success('¡Gracias por tu opinión! Se revisará antes de publicarse.')
        setNombre('')
        setEmail('')
        setCalificacion(0)
        setComentario('')
      } else {
        toast.error('Error al enviar la opinión. Intentá de nuevo.')
      }
    } catch {
      toast.error('Error de conexión. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-crema rounded-xl shadow-md p-6"
    >
      <h3 className="text-lg font-bold text-marron mb-1">
        Dejá tu opinión
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        ✅ Tu experiencia nos ayuda a seguir mejorando. Todos los comentarios son revisados antes de ser publicados.
      </p>

      {/* Nombre */}
      <div className="mb-4">
        <label htmlFor="opinion-nombre" className="block text-sm font-medium text-marron mb-1">
          Nombre
        </label>
        <Input
          id="opinion-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="border-border focus:border-mostaza focus:ring-mostaza/30"
          maxLength={50}
        />
      </div>

      {/* Email (opcional) */}
      <div className="mb-4">
        <label htmlFor="opinion-email" className="block text-sm font-medium text-marron mb-1">
          Email <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <Input
          id="opinion-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com (opcional)"
          className="border-border focus:border-mostaza focus:ring-mostaza/30"
          maxLength={255}
        />
      </div>

      {/* Calificación */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-marron mb-1">
          Calificación
        </label>
        <StarRating
          rating={calificacion}
          size={28}
          interactive
          onChange={setCalificacion}
        />
      </div>

      {/* Comentario */}
      <div className="mb-4">
        <label htmlFor="opinion-comentario" className="block text-sm font-medium text-marron mb-1">
          Comentario
        </label>
        <Textarea
          id="opinion-comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Contanos tu experiencia..."
          className="border-border focus:border-mostaza focus:ring-mostaza/30 min-h-[100px]"
          maxLength={500}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="bg-mostaza text-marron hover:bg-mostaza/90 font-semibold w-full sm:w-auto"
      >
        <Send className="h-4 w-4 mr-2" />
        {submitting ? 'Enviando...' : 'Enviar opinión'}
      </Button>
    </form>
  )
}
