"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SetupSteps } from "@/components/dashboard/setup-steps"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { VerificationCodeInput } from "@/components/auth/verification-code-input"

export default function TwoFactorAuthPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMethod, setSelectedMethod] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if we're coming from a specific step
  useEffect(() => {
    const step = searchParams.get("step")
    if (step) {
      setCurrentStep(Number.parseInt(step))
    }
  }, [searchParams])

  const steps = [
    {
      number: 1,
      title: "Autenticación",
      subtitle: "Activar autenticación",
      status: currentStep > 1 ? ("completed" as const) : ("active" as const),
    },
    {
      number: 2,
      title: "Código",
      subtitle: "Código para autenticación",
      status: currentStep === 2 ? ("active" as const) : currentStep > 2 ? ("completed" as const) : ("pending" as const),
    },
    {
      number: 3,
      title: "Activada",
      subtitle: "Autenticación activada",
      status: currentStep === 3 ? ("active" as const) : ("pending" as const),
    },
  ]

  const handleContinue = () => {
    if (selectedMethod && currentStep === 1) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length === 6) {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setCurrentStep(3)
      } catch (error) {
        console.error("Error verifying code:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleFinish = () => {
    router.push("/settings")
  }

  const getMethodText = () => {
    switch (selectedMethod) {
      case "email":
        return "correo electrónico registrado"
      case "sms":
        return "número de teléfono registrado"
      default:
        return "método seleccionado"
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Privacidad y seguridad / Autenticación de dos factores</h1>
        </div>

        <div>
          {/* Steps */}
          <SetupSteps steps={steps} />

          {/* Step 1: Method Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-secondary font-bold text-base">
                  Agrega una capa adicional de seguridad a tu cuenta.
                </p>
                <p className="text-secondary font-bold text-base mb-6">
                  Recibirás un código de verificación cada vez que inicies sesión.
                </p>
              </div>

              <div>
                <h3 className="text-gray-500 font-bold mb-4">Selecciona tu método preferido:</h3>

                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="text-gray-700 cursor-pointer">
                      Correo electrónico
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="text-gray-700 cursor-pointer">
                      Mensaje de texto (SMS)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="app" id="app" />
                    <Label htmlFor="app" className="text-gray-700 cursor-pointer">
                      Aplicación de autenticación
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-l-4 border-secondary p-4 rounded-lg">
                <p className="text-sm font-bold text-secondary">
                  Luego de activar la autenticación de dos factores, te pediremos este código además de tu contraseña
                  para iniciar sesión.
                </p>
              </div>

              {/* Continue Button */}
              <div className="pt-4">
                <Button
                  onClick={handleContinue}
                  disabled={!selectedMethod}
                  className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3"
                >
                  CONTINUAR
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Code Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Email/SMS Method */}
              {(selectedMethod === "email" || selectedMethod === "sms") && (
                <>
                  <div>
                    <p className="text-secondary font-bold text-base mb-2">
                      Hemos enviado un código a tu {getMethodText()}.
                    </p>
                    <p className="text-gray-600">Ingresa el código para activar la autenticación de dos pasos.</p>
                  </div>

                  <div className="space-y-4">
                    <VerificationCodeInput onComplete={setVerificationCode} onCodeChange={setVerificationCode} />
                  </div>
                </>
              )}

              {/* Authenticator App Method */}
              {selectedMethod === "app" && (
                <>
                  <div>
                    <p className="text-secondary font-bold text-base mb-6">
                      Escanea este código QR con tu app de autenticación.
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-start mb-6">
                    <div className="bg-white p-4 border border-gray-200 rounded-lg">
                      <img
                        src="/placeholder.svg?height=200&width=200"
                        alt="Código QR para autenticación"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Luego, ingresa el código de 6 dígitos que aparece en la app para confirmar el enlace.
                    </p>

                    {/* Manual Setup Info */}
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                      <p className="text-sm font-bold text-orange-700 mb-2">¿No puedes escanear el código?</p>
                      <p className="text-sm text-orange-700 mb-2">Usa esta clave en tu aplicación de autenticación:</p>
                      <p className="text-sm font-mono font-bold text-orange-800 bg-orange-100 px-2 py-1 rounded mb-2">
                        JESWVIDFHFK3PXP
                      </p>
                      <p className="text-xs text-orange-600">
                        Esta clave te permitirá configurar manualmente tu autenticador si no puedes escanear el código
                        QR. Es igual de seguro y válido.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <VerificationCodeInput onComplete={setVerificationCode} onCodeChange={setVerificationCode} />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-secondary text-secondary hover:bg-secondary hover:text-white font-medium px-8 py-3 bg-transparent"
                >
                  ATRÁS
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6 || isLoading}
                  className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3"
                >
                  {isLoading ? "Verificando..." : "VERIFICAR"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <div className="text-center space-y-6 py-8">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Message */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">¡Autenticación activada!</h2>
                <p className="text-gray-600 text-lg mb-2">
                  La autenticación de dos factores ha sido configurada exitosamente.
                </p>
                <p className="text-gray-600">
                  A partir de ahora, necesitarás ingresar un código de verificación cada vez que inicies sesión.
                </p>
              </div>

              {/* Method Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-blue-800">
                  Método configurado:{" "}
                  <span className="font-bold">
                    {selectedMethod === "email" && "Correo electrónico"}
                    {selectedMethod === "sms" && "Mensaje de texto (SMS)"}
                    {selectedMethod === "app" && "Aplicación de autenticación"}
                  </span>
                </p>
              </div>

              {/* Back Button */}
              <div className="pt-4">
                <Button
                  onClick={handleFinish}
                  className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3"
                >
                  VOLVER A PRIVACIDAD Y SEGURIDAD
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
