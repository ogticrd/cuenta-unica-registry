"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/forgot-password"

export function ForgotPasswordForm() {
  const [error, setError] = useState("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError("")
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Password reset requested for:", data.email)

      // Redirect to verification page with email parameter
      router.push(`/auth/forgot-password/verify?email=${encodeURIComponent(data.email)}`)
    } catch (error) {
      setError("Error al procesar la solicitud. Por favor, intente nuevamente.")
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
          Para restablecer la contraseña, ingrese su correo electrónico registrado
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo electrónico <span className="text-accent">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Correo Electrónico"
              {...register("email")}
              className={errors.email ? "border-accent" : ""}
            />
            {errors.email && <p className="text-accent text-xs mt-1">{errors.email.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "RECUPERAR CONTRASEÑA"}
          </Button>
        </form>

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
