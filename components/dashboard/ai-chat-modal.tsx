"use client";

import { Bot, Maximize2, Minimize2, Send, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale, useT } from "@/hooks/use-t";
import { DEFAULT_LOCALE } from "@/lib/constants/locales";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const t = useT("assistant");
  const locale = useLocale();
  const timeLocale = locale === DEFAULT_LOCALE ? "es-DO" : "en-US";

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      type: "ai",
      content: t("welcome_message"),
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    const lowerMessage = userMessage.toLowerCase();

    if (
      lowerMessage.includes("contraseña") ||
      lowerMessage.includes("contrasena") ||
      lowerMessage.includes("password")
    ) {
      return t("response_password");
    }

    if (
      lowerMessage.includes("autenticación") ||
      lowerMessage.includes("autenticacion") ||
      lowerMessage.includes("dos factores") ||
      lowerMessage.includes("2fa")
    ) {
      return t("response_2fa");
    }

    if (
      lowerMessage.includes("passkey") ||
      lowerMessage.includes("biométrico") ||
      lowerMessage.includes("biometrico")
    ) {
      return t("response_passkey");
    }

    if (
      lowerMessage.includes("trámite") ||
      lowerMessage.includes("tramite") ||
      lowerMessage.includes("servicio") ||
      lowerMessage.includes("documento")
    ) {
      return t("response_services");
    }

    if (
      lowerMessage.includes("cédula") ||
      lowerMessage.includes("cedula") ||
      lowerMessage.includes("identidad")
    ) {
      return t("response_identity");
    }

    if (
      lowerMessage.includes("datos") ||
      lowerMessage.includes("información") ||
      lowerMessage.includes("informacion") ||
      lowerMessage.includes("perfil")
    ) {
      return t("response_profile");
    }

    if (
      lowerMessage.includes("seguridad") ||
      lowerMessage.includes("privacidad") ||
      lowerMessage.includes("protección") ||
      lowerMessage.includes("proteccion")
    ) {
      return t("response_security");
    }

    if (
      lowerMessage.includes("dispositivo") ||
      lowerMessage.includes("sesión") ||
      lowerMessage.includes("sesion") ||
      lowerMessage.includes("acceso")
    ) {
      return t("response_devices");
    }

    if (
      lowerMessage.includes("ayuda") ||
      lowerMessage.includes("soporte") ||
      lowerMessage.includes("contacto")
    ) {
      return t("response_support");
    }

    if (
      lowerMessage.includes("hola") ||
      lowerMessage.includes("buenos") ||
      lowerMessage.includes("buenas")
    ) {
      return t("response_greeting");
    }

    if (lowerMessage.includes("gracias") || lowerMessage.includes("thank")) {
      return t("response_thanks");
    }

    return t("response_default");
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const aiResponse = await getAIResponse(userMessage.content);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (_error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: t("response_error"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    const formattedTime = date.toLocaleTimeString(timeLocale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (locale === DEFAULT_LOCALE) {
      return formattedTime.replace(/AM|PM/, (match) =>
        match.toLowerCase() === "am" ? "a. m." : "p. m.",
      );
    }

    return formattedTime;
  };

  if (!isOpen) return null;

  return (
    <>
      {!isMinimized && (
        <button
          type="button"
          aria-label={t("close") || "Close chat"}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {isMinimized ? (
        <button
          type="button"
          aria-label={t("open_chat") || "Open chat"}
          className="fixed z-50 bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-80 h-16 rounded-2xl bg-background border border-border shadow-2xl transition-all duration-300 ease-in-out flex items-center justify-between p-4 hover:bg-secondary/5"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-secondary/10 p-2 rounded-full relative">
              <Bot size={18} className="text-secondary" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {t("title")}
            </span>
          </div>
          <Maximize2 size={16} className="text-muted-foreground" />
        </button>
      ) : (
        <div
          role="dialog"
          aria-label={t("title")}
          className="fixed z-50 bottom-0 right-0 left-0 w-full h-[85vh] sm:left-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] bg-background border border-border shadow-2xl rounded-t-3xl sm:rounded-3xl border-b-0 sm:border-b transition-all duration-300 ease-in-out flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2.5 rounded-full">
                <Bot size={20} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">
                  {t("title")}
                </h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                  {t("status_active")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-gray-100 hover:dark:bg-gray-100/10 rounded-full w-8 h-8"
              >
                <Minimize2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-gray-100 hover:dark:bg-gray-100/10 rounded-full w-8 h-8"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-secondary/5 p-6 pb-2">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={"flex items-end gap-2 max-w-[85%]"}>
                    {message.type === "ai" && (
                      <div className="w-8 h-8 bg-background border border-border shadow-sm rounded-full flex items-center justify-center flex-shrink-0 mb-5">
                        <Bot size={14} className="text-secondary" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div
                        className={`px-5 py-3 rounded-2xl ${
                          message.type === "user"
                            ? "bg-secondary text-primary-foreground"
                            : "bg-background text-foreground border border-border shadow-sm"
                        }`}
                      >
                        <p className="text-[13px] leading-relaxed font-medium">
                          {message.content}
                        </p>
                      </div>
                      <p
                        className={`text-[10px] uppercase tracking-wider font-semibold mt-1.5 px-1 ${
                          message.type === "user"
                            ? "text-right text-muted-foreground/60"
                            : "text-left text-muted-foreground/60"
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
                        <div className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 bg-secondary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          <div className="p-4 bg-background border-t border-border mt-auto">
            <div className="flex items-center gap-2 bg-secondary/5 border border-border rounded-full pr-2 pl-4 py-1.5 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary transition-all">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("input_placeholder")}
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent px-0 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm h-10"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className={`rounded-full h-9 w-9 flex-shrink-0 transition-colors ${
                  inputMessage.trim() && !isLoading
                    ? "bg-secondary hover:bg-secondary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Send
                  size={15}
                  className={inputMessage.trim() && !isLoading ? "ml-0.5" : ""}
                />
              </Button>
            </div>
            <div className="text-center mt-3">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                <Bot size={10} />
                {t("generative_ai")}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
