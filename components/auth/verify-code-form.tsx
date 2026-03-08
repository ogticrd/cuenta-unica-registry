"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationCodeInput } from "./verification-code-input"

export function VerifyCodeForm() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const handleCodeComplete = async (verificationCode: string) => {
    setError("")
    setIsSubmitting(true)

    try {
      // Simulate API call to verify code
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, you would verify the code with your backend
      if (verificationCode === "123456") {
        // Generate a mock token for the reset password page
        const mockToken = btoa(`${email}-${Date.now()}`)
        // Redirect to reset password page
        router.push(`/auth/reset-password?token=${mockToken}&email=${encodeURIComponent(email)}`)
      } else {
        setError("Código de verificación incorrecto. Por favor, intente nuevamente.")
      }
    } catch (error) {
      setError("Error al verificar el código. Por favor, intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setError("")

    try {
      // Simulate API call to resend code
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Código reenviado a:", email)
      // Show success message or toast
    } catch (error) {
      setError("Error al reenviar el código. Por favor, intente nuevamente.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Image src="/images/cuenta-unica-icon.png" alt="Cuenta Única" width={64} height={64} className="rounded-lg" />
        </div>
        <CardTitle className="text-xl font-semibold text-primary">Restablecer contraseña</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Se ha enviado un correo electrónico con un código de recuperación a la dirección que proporcionó
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center">
              <label className="text-sm font-medium text-gray-700">
                Código de recuperación <span className="text-accent">*</span>
              </label>
            </div>

            <VerificationCodeInput onComplete={handleCodeComplete} onCodeChange={setCode} error={!!error} />
          </div>

          <Button
            onClick={() => handleCodeComplete(code)}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? "Verificando..." : "CONTINUAR"}
          </Button>

          <Button
            variant="outline"
            onClick={handleResendCode}
            className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white font-medium py-3 bg-transparent"
            disabled={isResending}
          >
            {isResending ? "Reenviando..." : "REENVIAR CÓDIGO"}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Recuerdas sus credenciales?{" "}
            <Link href="/login" className="text-secondary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
