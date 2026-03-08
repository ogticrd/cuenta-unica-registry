"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/reset-password"

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError("")

    if (!token) {
      setError("Token de verificación no válido. Por favor, solicite un nuevo enlace de restablecimiento.")
      return
    }

    try {
      // Simulate API call to reset password
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, you would send the new password and token to your backend
      console.log("Password reset for:", email, "with token:", token)
      console.log("New password:", data.password)

      setIsSuccess(true)

    } catch (error) {
      setError("Error al restablecer la contraseña. Por favor, intente nuevamente.")
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Image
              src="/images/cuenta-unica-icon.png"
              alt="Cuenta Única"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-xl font-semibold text-primary">¡Contraseña actualizada!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-6">
            Su contraseña ha sido restablecida exitosamente.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3">
            <Link href="/login">Ir al inicio de sesión</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Image src="/images/cuenta-unica-icon.png" alt="Cuenta Única" width={64} height={64} className="rounded-lg" />
        </div>
        <CardTitle className="text-xl font-semibold text-primary">Restablecer contraseña</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Introduce tu nueva contraseña y confírmala para completar el proceso
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Nueva contraseña <span className="text-accent">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••••••"
                {...register("password")}
                className={errors.password ? "border-accent pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-accent text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar contraseña <span className="text-accent">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••••••••••"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-accent pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-accent text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Actualizando..." : "CONTINUAR"}
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
