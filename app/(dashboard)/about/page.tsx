"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PlatformFeature } from "@/components/dashboard/platform-feature"
import { YouTubeVideo } from "@/components/dashboard/youtube-video"
import { User, Headphones, Shield, FileText, Bell, Bot, Users, Clock, Globe } from "lucide-react"

export default function AboutPage() {
  const features = [
    {
      icon: <User size={24} className="text-blue-600 dark:text-blue-400" />,
      title: "Datos personales",
      description: "Accede a los datos personales asociados a su cuenta de forma segura y actualizada.",
    },
    {
      icon: <FileText size={24} className="text-purple-600 dark:text-purple-400" />,
      title: "Historial completo",
      description: "Consulta y revisa todos los movimientos y acciones realizadas en la plataforma.",
    },
    {
      icon: <Shield size={24} className="text-red-600 dark:text-red-400" />,
      title: "Seguridad avanzada",
      description: "Mantén tu cuenta protegida con autenticación de dos factores y revisión de accesos.",
    },
    {
      icon: <Bell size={24} className="text-orange-600 dark:text-orange-400" />,
      title: "Notificaciones",
      description: "Recibe alertas importantes y actualizaciones sobre los servicios que utilizas.",
    },
    {
      icon: <Bot size={24} className="text-indigo-600 dark:text-indigo-400" />,
      title: "Asistente virtual (IA)",
      description: "Recibe ayuda instantánea para resolver dudas sobre la plataforma rápidamente.",
    },
    {
      icon: <Headphones size={24} className="text-green-600 dark:text-green-400" />,
      title: "Soporte técnico",
      description: "Encuentra ayuda especializada y múliples canales de contacto para cualquier problema.",
    },
  ]

  const stats = [
    { number: "2.5M+", label: "Ciudadanos registrados", icon: <Users size={20} /> },
    { number: "15M+", label: "Consultas realizadas", icon: <FileText size={20} /> },
    { number: "99.9%", label: "Tiempo de actividad", icon: <Clock size={20} /> },
    { number: "24/7", label: "Disponibilidad", icon: <Globe size={20} /> },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-16 pb-12 pt-6">
        {/* Minimalist Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">
            Acerca de tu Cuenta Única Ciudadana
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            La plataforma oficial del gobierno, diseñada para que interactúes con el Estado de
            manera centralizada, segura y eficiente desde cualquier lugar.
          </p>
        </div>

        {/* Minimalist Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="text-muted-foreground mb-3">{stat.icon}</div>
              <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">{stat.number}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-center">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Video Tutorial */}
        <div className="pt-8 border-t dark:border-border">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3">Conoce la plataforma</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre en este video cómo utilizar todas las herramientas que tienes a tu disposición una vez inicias sesión.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border dark:border-border">
            <YouTubeVideo title="Cuenta Única Ciudadana - Guía Completa" />
          </div>
        </div>

        {/* Clean Features Grid */}
        <div className="pt-8 border-t dark:border-border">
          <h2 className="text-xl font-bold text-foreground mb-8 text-center">¿Qué puedes hacer?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
      </div>
    </DashboardLayout>
  )
}
