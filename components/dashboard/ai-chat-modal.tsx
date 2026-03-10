"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Send, Bot, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        "Hola! Soy tu asistente virtual de Cuenta Unica Ciudadana. Estoy aqui para ayudarte con cualquier pregunta sobre la plataforma, seguridad de tu cuenta o como usar nuestros servicios. En que puedo ayudarte hoy?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const lowerMessage = userMessage.toLowerCase()

    // Predefined responses for common topics
    if (lowerMessage.includes("contraseña") || lowerMessage.includes("password")) {
      return "Para cambiar tu contraseña, ve a 'Privacidad y seguridad' en el menú lateral y selecciona 'Cambiar contraseña'. Te recomendamos usar una contraseña segura con al menos 8 caracteres, incluyendo mayúsculas, minúsculas y números."
    }

    if (
      lowerMessage.includes("autenticación") ||
      lowerMessage.includes("autenticacion") ||
      lowerMessage.includes("dos factores") ||
      lowerMessage.includes("2fa")
    ) {
      return "La autenticación de dos factores agrega una capa extra de seguridad a tu cuenta. Puedes configurarla en 'Privacidad y seguridad' > 'Autenticación multifactor'. Puedes elegir entre correo electrónico, SMS o una aplicación de autenticación."
    }

    if (lowerMessage.includes("passkey") || lowerMessage.includes("biométrico")) {
      return "Los Passkeys te permiten acceder sin contraseña usando tu huella dactilar, Face ID o PIN del dispositivo. Para configurarlos, ve a 'Privacidad y seguridad' > 'Creación y administración de Passkeys'. Es más seguro y conveniente que las contraseñas tradicionales."
    }

    if (lowerMessage.includes("trámite") || lowerMessage.includes("servicio") || lowerMessage.includes("documento")) {
      return "Con tu Cuenta Unica puedes acceder a todos los servicios gubernamentales digitales. Cada institucion tiene sus propios servicios disponibles a traves de sus portales enlazados con tu cuenta."
    }

    if (lowerMessage.includes("cédula") || lowerMessage.includes("cedula") || lowerMessage.includes("identidad")) {
      return "Puedes usar tu numero de cédula para iniciar sesión en la plataforma. Tu cédula es tu identificador principal para acceder a los servicios del Estado."
    }

    if (lowerMessage.includes("datos") || lowerMessage.includes("información") || lowerMessage.includes("perfil")) {
      return "Tus datos personales se encuentran en la sección 'Datos personales' del menú. Allí puedes ver tu información registrada. Para modificar datos oficiales como nombre o fecha de nacimiento, debes acudir a las oficinas correspondientes."
    }

    if (
      lowerMessage.includes("seguridad") ||
      lowerMessage.includes("privacidad") ||
      lowerMessage.includes("protección")
    ) {
      return "Tu seguridad es nuestra prioridad. Utilizamos encriptación de datos, autenticación multifactor y monitoreo de accesos. En 'Privacidad y seguridad' puedes revisar tus dispositivos conectados, cambiar contraseñas y configurar medidas adicionales de protección."
    }

    if (lowerMessage.includes("dispositivo") || lowerMessage.includes("sesión") || lowerMessage.includes("acceso")) {
      return "En 'Historial de actividad' puedes ver todos los dispositivos desde donde has accedido a tu cuenta. Si detectas algún acceso sospechoso, puedes desvincular dispositivos y cambiar tu contraseña inmediatamente."
    }

    if (lowerMessage.includes("ayuda") || lowerMessage.includes("soporte") || lowerMessage.includes("contacto")) {
      return "Para soporte adicional puedes: 1) Llamar al (809)-123-4567, 2) Escribir a soporte@cuentaciudadana.gob.do, 3) Visitar la sección 'Soporte y ayuda' en el menú, o 4) consultar las preguntas frecuentes (FAQs)."
    }

    if (lowerMessage.includes("hola") || lowerMessage.includes("buenos") || lowerMessage.includes("buenas")) {
      return "¡Hola! Me da mucho gusto saludarte. Estoy aquí para ayudarte con cualquier duda sobre tu Cuenta Única Ciudadana. ¿Hay algo específico en lo que pueda asistirte?"
    }

    if (lowerMessage.includes("gracias") || lowerMessage.includes("thank")) {
      return "¡De nada! Es un placer ayudarte. Si tienes más preguntas sobre tu Cuenta Única Ciudadana, no dudes en preguntarme. Estoy aquí para hacer tu experiencia más fácil y segura."
    }

    // Default response
    return "Entiendo tu consulta. Te recomiendo revisar las secciones del menú lateral para encontrar la información que necesitas, o puedes contactar a nuestro soporte técnico al (809)-123-4567 o soporte@cuentaciudadana.gob.do para asistencia personalizada. ¿Hay algo más específico en lo que pueda ayudarte?"
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const aiResponse = await getAIResponse(userMessage.content)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "Lo siento, hubo un error procesando tu mensaje. Por favor intenta nuevamente o contacta a soporte técnico.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date
      .toLocaleTimeString("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/AM|PM/, (match) => (match.toLowerCase() === "am" ? "a. m." : "p. m."))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay - only show when not minimized */}
      {!isMinimized && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={onClose} />}

      {/* Chat Modal */}
      <div
        className={`fixed z-50 bg-background border border-border shadow-2xl transition-all duration-300 ease-in-out flex flex-col ${isMinimized ? "bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-80 h-16 rounded-2xl cursor-pointer hover:bg-secondary/5" : "bottom-0 right-0 left-0 w-full h-[85vh] sm:left-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl border-b-0 sm:border-b"
          }`}
        onClick={isMinimized ? () => setIsMinimized(false) : undefined}
      >
        {/* Header */}
        {!isMinimized ? (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2.5 rounded-full">
                <Bot size={20} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Asistente Virtual</h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Siempre activo</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMinimized(true)
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-gray-100 hover:dark:bg-gray-100/10 rounded-full w-8 h-8"
              >
                <Minimize2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-gray-100 hover:dark:bg-gray-100/10 rounded-full w-8 h-8"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 h-full">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2 rounded-full relative">
                <Bot size={18} className="text-secondary" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></span>
              </div>
              <span className="text-sm font-bold text-foreground">Asistente Virtual</span>
            </div>
            <Maximize2 size={16} className="text-muted-foreground" />
          </div>
        )}

        {/* Chat Content - only show when not minimized */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-secondary/5 p-6 pb-2">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-end gap-2 max-w-[85%]`}>
                      {message.type === "ai" && (
                        <div className="w-8 h-8 bg-background border border-border shadow-sm rounded-full flex items-center justify-center flex-shrink-0 mb-5">
                          <Bot size={14} className="text-secondary" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div
                          className={`px-5 py-3 rounded-2xl ${message.type === "user"
                            ? "bg-secondary text-primary-foreground"
                            : "bg-background text-foreground border border-border shadow-sm"
                            }`}
                        >
                          <p className="text-[13px] leading-relaxed font-medium">{message.content}</p>
                        </div>
                        <p
                          className={`text-[10px] uppercase tracking-wider font-semibold mt-1.5 px-1 ${message.type === "user" ? "text-right text-muted-foreground/60" : "text-left text-muted-foreground/60"
                            }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 bg-background border border-border shadow-sm rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                        <Bot size={14} className="text-secondary" />
                      </div>
                      <div className="bg-background border border-border px-4 py-4 rounded-2xl shadow-sm">
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce"></div>
                          <div
                            className="w-1.5 h-1.5 bg-secondary/60 rounded-full animate-bounce"
                            style={{ animationDelay: "0.15s" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-background border-t border-border mt-auto">
              <div className="flex items-center gap-2 bg-secondary/5 border border-border rounded-full pr-2 pl-4 py-1.5 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary transition-all">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1 border-0 bg-transparent px-0 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm h-10"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className={`rounded-full h-9 w-9 flex-shrink-0 transition-colors ${inputMessage.trim() && !isLoading
                    ? 'bg-secondary hover:bg-secondary/90 text-primary-foreground'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                >
                  <Send size={15} className={inputMessage.trim() && !isLoading ? 'ml-0.5' : ''} />
                </Button>
              </div>
              <div className="text-center mt-3">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                  <Bot size={10} />
                  IA Generativa
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
