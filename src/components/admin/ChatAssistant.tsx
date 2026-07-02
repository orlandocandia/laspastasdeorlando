'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    '¡Hola! Soy tu asistente virtual de Pastas Orlando. Preguntame cualquier duda sobre cómo usar el sistema.',
}

const SUGGESTED_QUESTIONS = [
  '¿Cómo creo un producto nuevo?',
  '¿Cómo cargo stock?',
  '¿Cómo vendo un producto?',
  '¿Qué significa stock crítico?',
  '¿Cómo creo una receta?',
  '¿Cómo registro una producción?',
]

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Initialize welcome message on first open
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true
      setMessages([WELCOME_MESSAGE])
    }
  }, [isOpen])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build conversation history excluding the welcome message
      const conversationHistory = [...messages, userMessage].filter(
        (msg, idx) => !(idx === 0 && msg.role === 'assistant' && msg.content === WELCOME_MESSAGE.content)
      )

      const res = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      })

      if (!res.ok) {
        throw new Error('Error al comunicarse con el asistente')
      }

      const data = await res.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu consulta.',
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        role: 'assistant',
        content:
          'Lo siento, hubo un error al conectar con el asistente. Por favor, intentá de nuevo en unos momentos.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
  }

  // Show suggested questions only when we have just the welcome message
  const showSuggestions = messages.length === 1 && messages[0].content === WELCOME_MESSAGE.content

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={toggleChat}
            className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-mostaza text-marron shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            aria-label="Abrir asistente virtual"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
            {/* Notification dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rojo opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-rojo" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-0 right-0 left-0 z-50 flex flex-col bg-white shadow-2xl sm:bottom-20 sm:right-6 sm:left-auto sm:h-[520px] sm:w-[380px] sm:rounded-2xl h-[100dvh] sm:max-h-[520px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-marron px-4 py-3 sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mostaza/20">
                  <Bot className="h-5 w-5 text-mostaza" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-crema">
                    Asistente Virtual
                  </h3>
                  <p className="text-xs text-crema/70">Pastas Orlando</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="h-8 w-8 text-crema/70 hover:text-crema hover:bg-crema/10"
                aria-label="Cerrar asistente"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 overflow-hidden px-4 py-3">
              <div className="flex flex-col gap-3">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        msg.role === 'user'
                          ? 'bg-mostaza/20 text-marron'
                          : 'bg-oliva/15 text-oliva'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-mostaza text-marron rounded-br-md'
                          : 'bg-crema border border-border text-marron rounded-bl-md shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-2"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-oliva/15 text-oliva">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-crema border border-border px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          className="h-2 w-2 rounded-full bg-marron/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: 0,
                          }}
                        />
                        <motion.div
                          className="h-2 w-2 rounded-full bg-marron/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                        />
                        <motion.div
                          className="h-2 w-2 rounded-full bg-marron/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Suggested Questions */}
                {showSuggestions && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="flex flex-wrap gap-2 pl-9 pt-1"
                  >
                    {SUGGESTED_QUESTIONS.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="rounded-full border border-mostaza/30 bg-mostaza/5 px-3 py-1.5 text-xs text-marron transition-colors hover:bg-mostaza/15 hover:border-mostaza/50 cursor-pointer"
                      >
                        {question}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border bg-white px-4 py-3 sm:rounded-b-2xl">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribí tu pregunta..."
                  disabled={isLoading}
                  className="flex-1 border-border bg-crema/50 text-marron placeholder:text-marron/40 focus-visible:ring-mostaza"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="h-10 w-10 shrink-0 bg-mostaza text-marron hover:bg-mostaza/90 disabled:opacity-50"
                  aria-label="Enviar mensaje"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
