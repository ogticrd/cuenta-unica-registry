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
      return "Puedes usar tu numero de cedula para iniciar sesion en la plataforma. Tu cedula es tu identificador principal para acceder a los servicios del Estado."
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
      {!isMinimized && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />}

      {/* Chat Modal */}
      <div
        className={`fixed z-50 bg-white rounded-lg shadow-2xl transition-all duration-300 ease-in-out ${
          isMinimized ? "bottom-6 right-20 w-80 h-16" : "bottom-6 right-6 w-[400px] h-[500px]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Asistente Virtual</h3>
              <p className="text-xs opacity-90">Cuenta Única Ciudadana</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 text-white h-6 w-6"
            >
              {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1 hover:bg-white/20 text-white h-6 w-6">
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Chat Content - only show when not minimized */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 h-[380px] overflow-y-auto bg-gray-50">
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-start space-x-2 max-w-[85%]`}>
                      {message.type === "ai" && (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot size={14} className="text-white" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.type === "user"
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <p
                          className={`text-xs mt-1 px-2 ${message.type === "user" ? "text-right text-gray-500" : "text-left text-gray-500"}`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={14} className="text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu pregunta aquí..."
                  disabled={isLoading}
                  className="flex-1 border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsMinimized(false)}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-primary">Asistente Virtual</span>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </>
  )
}
