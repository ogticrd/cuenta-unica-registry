"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { useAuth } from "@/lib/auth-context"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError("")
    try {
      const success = await login(data.identifier, data.password)
      if (!success) {
        setError("Credenciales inválidas. Por favor, intente nuevamente.")
      }
    } catch (error) {
      setError("Error al iniciar sesión. Por favor, intente nuevamente.")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Image src="/images/cuenta-unica-icon.png" alt="Cuenta Única" width={64} height={64} className="rounded-lg" />
        </div>
        <CardTitle className="text-xl font-semibold text-primary">Acceso Cuenta Única</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Puedes acceder a tu cuenta con tu número de identidad "Cédula" o correo electrónico registrado
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-sm font-medium">
              Coloca la cédula o correo electrónico <span className="text-accent">*</span>
            </Label>
            <Input
              id="identifier"
              type="text"
              placeholder="Cédula o Correo Electrónico"
              {...register("identifier")}
              className={errors.identifier ? "border-accent" : ""}
            />
            {errors.identifier && <p className="text-accent text-xs mt-1">{errors.identifier.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña <span className="text-accent">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
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

          <div className="text-left">
            <Link href="/auth/forgot-password" className="text-secondary text-sm hover:underline">
              ¿Has olvidado tu contraseña?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Iniciando sesión..." : "INICIAR SESIÓN"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            <span className="font-medium text-secondary">¿No tienes cuenta?</span> Registrate, accede a los
            servicios del Estado Dominicano con un unico usuario y contrasena, de forma segura y confiable
          </p>
          <Button
            variant="outline"
            className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white font-medium py-3 bg-transparent"
            asChild
          >
            <Link href="/auth/register">CREAR SU CUENTA ÚNICA CIUDADANA</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
