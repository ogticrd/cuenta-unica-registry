"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PlatformFeature } from "@/components/dashboard/platform-feature"
import { YouTubeVideo } from "@/components/dashboard/youtube-video"
import { User, Headphones, Shield, FileText, Bell, Bot, Users, Clock, CheckCircle, Globe } from "lucide-react"

export default function AboutPage() {
  const features = [
    {
      icon: <User size={24} className="text-blue-600" />,
      title: "Datos personales",
      description: "Accede a los datos personales asociados a su cuenta única de forma segura y actualizada.",
    },
    {
      icon: <Headphones size={24} className="text-green-600" />,
      title: "Soporte técnico",
      description: "Encuentra ayuda especializada, guías detalladas y múltiples canales de contacto disponibles 24/7.",
    },
    {
      icon: <Shield size={24} className="text-red-600" />,
      title: "Seguridad",
      description:
        "Cambie su contraseña, revisar accesos recientes y activar medidas adicionales como la autenticación de dos factores para mantener su cuenta protegida.",
    },
    {
      icon: <FileText size={24} className="text-purple-600" />,
      title: "Historial",
      description:
        "Consulta detalladamente todos los movimientos y acciones realizadas en su cuenta con timestamps precisos.",
    },
    {
      icon: <Bell size={24} className="text-orange-600" />,
      title: "Notificaciones",
      description:
        "Recibe alertas importantes, recordatorios del Estado y actualizaciones sobre tu cuenta en tiempo real.",
    },
    {
      icon: <Bot size={24} className="text-indigo-600" />,
      title: "Asistente virtual con IA",
      description:
        "Recibe ayuda instantanea con nuestro asistente virtual impulsado por inteligencia artificial. Consulta dudas sobre la plataforma, como usar los servicios, o resolver problemas comunes de manera rapida y eficiente.",
    },
  ]

  const stats = [
    { number: "2.5M+", label: "Ciudadanos registrados", icon: <Users size={20} /> },
    { number: "15M+", label: "Consultas realizadas", icon: <FileText size={20} /> },
    { number: "99.9%", label: "Tiempo de actividad", icon: <Clock size={20} /> },
    { number: "24/7", label: "Disponibilidad", icon: <Globe size={20} /> },
  ]

  const benefits = [
    "Un solo lugar para acceder a todos los servicios gubernamentales",
    "Ahorro de tiempo y eliminacion de filas",
    "Seguridad de nivel bancario para tus datos",
    "Acceso desde cualquier dispositivo, en cualquier momento",
    "Historial completo de todas tus gestiones",
    "Soporte técnico especializado disponible",
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">
              Conoce todo lo que puedes hacer con tu <span className="text-yellow-300">Cuenta Única Ciudadana</span>
            </h1>
            <p className="text-xl text-blue-100 mb-6 max-w-3xl">
              La plataforma digital del gobierno dominicano que revoluciona la forma en que los ciudadanos interactúan
              con el Estado. Segura, eficiente y disponible las 24 horas del día.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-300" />
                <span>Plataforma oficial del gobierno</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield size={16} className="text-green-300" />
                <span>Certificada y segura</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-center mb-3 text-blue-600">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Cómo funciona tu Cuenta Única?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Este video te muestra paso a paso todas las funcionalidades y herramientas que tendrás disponibles una vez
              hayas iniciado sesión con tu cuenta.
            </p>
          </div>
          <YouTubeVideo title="Cuenta Única Ciudadana - Guía Completa de Funcionalidades" />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Funcionalidades Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <PlatformFeature
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Beneficios de usar la Cuenta Única</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">¿Listo para aprovechar al máximo tu cuenta?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Explora todas las funcionalidades disponibles y descubre como la tecnologia puede simplificar tu experiencia con los servicios del Estado.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
