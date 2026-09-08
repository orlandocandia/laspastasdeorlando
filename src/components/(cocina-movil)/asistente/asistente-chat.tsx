'use client'

/**
 * ============================================================
 * Cocina Móvil — Asistente IA (Chat flotante)
 * ============================================================
 * Botón flotante en la esquina inferior derecha + ventana de chat.
 * Usa /api/cocina-movil/asistente (LLM con fallback FAQ).
 * ============================================================
 */

import * as React from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  '¿Cómo creo una receta?',
  '¿Cómo registro una producción?',
  '¿Cómo genero un presupuesto?',
  '¿Qué es el margen de ganancia?',
  '¿Cómo imprimo un ticket?',
]

export default function AsistenteChat() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de la Cocina Móvil. ¿En qué puedo ayudarte? Puedes preguntarme sobre recetas, producciones, ventas, presupuestos y más.',
    },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim()
    if (!messageText || loading) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/cocina-movil/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta de nuevo o consulta el manual en la sección Ayuda.',
        }])
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#E1AD01] text-[#1F1611] shadow-lg shadow-[#E1AD01]/30 flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Abrir asistente"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#708238] border-2 border-[#FFF8E7]" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[500px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-[#5C3A21]/15 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#5C3A21] text-[#FFF8E7] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Asistente IA</p>
                <p className="text-[10px] opacity-70">Cocina Móvil</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#FFF8E7]/10 transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFF8E7]/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#5C3A21] text-[#FFF8E7]'
                    : 'bg-[#E1AD01] text-[#5C3A21]'
                }`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#5C3A21] text-[#FFF8E7]'
                    : 'bg-white text-[#1F1611] border border-[#5C3A21]/10'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-[#E1AD01] text-[#5C3A21] flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-[#5C3A21]/10 rounded-xl px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#8A7E70]" />
                </div>
              </div>
            )}
          </div>

          {/* Suggested questions (only on first interaction) */}
          {messages.length === 1 && !loading && (
            <div className="px-4 pb-2 shrink-0">
              <p className="text-[10px] text-[#8A7E70] mb-1.5">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[10px] px-2 py-1 rounded-full bg-[#FBF1DC] text-[#5C3A21] border border-[#5C3A21]/10 hover:bg-[#E1AD01]/10 hover:border-[#E1AD01]/30 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-[#5C3A21]/10 shrink-0 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu pregunta…"
                disabled={loading}
                className="border-[#5C3A21]/15 text-sm"
              />
              <Button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                size="icon"
                className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611] shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
