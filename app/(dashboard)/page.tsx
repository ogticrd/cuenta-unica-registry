"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivityItem } from "@/components/dashboard/recent-activity-item"
import { ActionButton } from "@/components/dashboard/action-button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants/routes"
import type { ReactNode } from "react"
import { User, Shield, Clock, Bell, Smartphone, Globe, CheckCircle, AlertTriangle, Info, Calendar, Activity, Lock } from 'lucide-react'

export default function DashboardPage() {
  const { user, session } = useAuth()
  const router = useRouter()
  // -- Dynamic Session Data --
  let lastAccessStr = "Cargando..."
  if (session?.authenticated_at) {
    const authDate = new Date(session.authenticated_at)
    lastAccessStr = authDate.toLocaleString("es-DO", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const isVerified = session?.identity?.verifiable_addresses?.some((addr) => addr.verified === true) || false
  const devicesCount = session ? 1 + (session.other_sessions?.length || 0) : 1
  const isAal2 = session?.authenticator_assurance_level === "aal2"
  const securityLevel = isAal2 ? "Alto" : "Estándar"
  const securityDesc = isAal2 ? "2FA activado" : "Contraseña"

  type QuickAction = {
    title: string
    description: string
    icon: ReactNode
    href: string
    badge?: {
      text: string
      variant: "info" | "warning" | "success"
    }
  }

  const quickActions: QuickAction[] = [
    {
      title: "Datos Personales",
      description: "Consulta y actualiza tu información personal registrada",
      icon: <User size={24} />,
      href: ROUTES.settings
    },
    {
      title: "Privacidad y Seguridad",
      description: "Configura la seguridad de tu cuenta y revisa accesos",
      icon: <Shield size={24} />,
      href: ROUTES.settings,
    },
    {
      title: "Historial de Actividad",
      description: "Revisa dispositivos conectados y actividad reciente",
      icon: <Clock size={24} />,
      href: ROUTES.history
    },
    {
      title: "Soporte y Ayuda",
      description: "Encuentra ayuda y contacta con nuestro equipo de soporte",
      icon: <Bell size={24} />,
      href: ROUTES.support
    }
  ]

  const recentActivities = [
    {
      icon: <CheckCircle size={16} />,
      title: "Inicio de sesion exitoso",
      description: "Accediste desde Chrome en Windows",
      time: "Hace 2 horas",
      type: "success" as const
    },
    {
      icon: <Shield size={16} />,
      title: "Configuracion de seguridad actualizada",
      description: "Se activo la autenticacion de dos factores",
      time: "Hace 1 dia",
      type: "info" as const
    },
    {
      icon: <AlertTriangle size={16} />,
      title: "Nuevo dispositivo detectado",
      description: "Se registro un nuevo inicio de sesion desde iPhone 15",
      time: "Hace 2 dias",
      type: "warning" as const
    },
    {
      icon: <Info size={16} />,
      title: "Contrasena actualizada",
      description: "Tu contrasena fue cambiada exitosamente",
      time: "Hace 5 dias",
      type: "info" as const
    }
  ]

  const governmentServices = [
    {
      title: "Consulta de Seguro",
      description: "Verifica tu estado en el sistema de seguridad social",
      icon: <Shield size={20} />,
      href: "#"
    },
    {
      title: "Portal de Servicios",
      description: "Accede a los portales de servicios gubernamentales",
      icon: <Globe size={20} />,
      href: "#"
    },
    {
      title: "Mi Historial",
      description: "Revisa tu historial de actividad y accesos recientes",
      icon: <Activity size={20} />,
      href: ROUTES.history
    },
    {
      title: "Configuracion de Cuenta",
      description: "Administra la seguridad y privacidad de tu cuenta",
      icon: <Lock size={20} />,
      href: ROUTES.settings
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="py-6 sm:py-8 border-b dark:border-border">
          <div className="flex flex-col gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                ¡Bienvenido, <span className="text-secondary dark:text-blue-400">{user?.name}</span>!
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-6">
                Administra tu identidad digital, revisa tu seguridad y accede a los servicios del Estado desde un solo lugar.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full dark:bg-secondary/20">
                  <Calendar size={16} className="text-secondary" />
                  <span className="font-medium text-secondary">Último acceso: {lastAccessStr}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full dark:bg-green-50/20">
                  {isVerified ? (
                    <>
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-600 dark:text-green-400">Cuenta verificada</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-orange-600 dark:text-orange-400" />
                      <span className="font-medium text-orange-700 dark:text-orange-400">Cuenta no verificada</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            title="Dispositivos Conectados"
            value={devicesCount.toString()}
            icon={<Smartphone size={24} />}
            description={devicesCount === 1 ? "Dispositivo activo" : "Dispositivos activos"}
          />
          <StatsCard
            title="Servicios Utilizados"
            value="12"
            icon={<Globe size={24} />}
            description="Este mes"
          />
          <StatsCard
            title="Acciones Realizadas"
            value="8"
            icon={<Activity size={24} />}
            description="Últimos 30 días"
          />
          <StatsCard
            title="Nivel de Seguridad"
            value={securityLevel}
            icon={<Shield size={24} />}
            description={securityDesc}
          />
        </div>

        {/* Quick Actions */}
        <DashboardCard title="Accesos Rápidos">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                href={action.href}
                badge={action.badge}
              />
            ))}
          </div>
        </DashboardCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <DashboardCard
            title="Actividad Reciente"
            action={
              <ActionButton variant="secondary" onClick={() => router.push(ROUTES.history)}>
                Ver todo
              </ActionButton>
            }
          >
            <div className="space-y-1">
              {recentActivities.map((activity, index) => (
                <RecentActivityItem
                  key={index}
                  icon={activity.icon}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                  type={activity.type}
                />
              ))}
            </div>
          </DashboardCard>

          {/* Security Status */}
          <DashboardCard
            title="Estado de Seguridad"
            action={
              <ActionButton variant="secondary" onClick={() => router.push(ROUTES.settings)}>
                Configurar
              </ActionButton>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-transparent dark:border-border/50 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 p-2 rounded-full">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Autenticación de dos factores</p>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Activada - Correo electrónico</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-transparent dark:border-border/50 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-2 rounded-full">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Contraseña</p>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Última actualización: Hace 2 meses</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-transparent dark:border-border/50 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 p-2 rounded-full">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Passkeys</p>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Recomendado configurar</p>
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Government Services */}
        <DashboardCard title="Servicios Gubernamentales Populares">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {governmentServices.map((service, index) => (
              <QuickActionCard
                key={index}
                title={service.title}
                description={service.description}
                icon={service.icon}
                href={service.href}
              />
            ))}
          </div>
        </DashboardCard>

        {/* Important Notifications */}
        <DashboardCard title="Notificaciones Importantes">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 bg-secondary/5 rounded-2xl border border-transparent dark:border-border/50 transition-colors hover:bg-secondary/10">
              <div className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 p-2.5 rounded-full flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-foreground mb-1">
                  Revisa tu seguridad
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Te recomendamos activar la autenticación de dos factores y configurar un Passkey para mayor protección de tu cuenta.
                </p>
                <ActionButton variant="primary" onClick={() => router.push(ROUTES.settings)}>
                  Ir a Seguridad
                </ActionButton>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-secondary/5 rounded-2xl border border-transparent dark:border-border/50 transition-colors hover:bg-secondary/10">
              <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-2.5 rounded-full flex-shrink-0">
                <Info size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-foreground mb-1">
                  Nueva Funcionalidad Disponible
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Ahora puedes usar Passkeys para acceder sin contraseña. Configúralo para mayor seguridad.
                </p>
                <ActionButton
                  variant="secondary"
                  onClick={() => router.push(ROUTES.settings)}
                  className="hover:bg-secondary/10"
                >
                  Configurar Ahora
                </ActionButton>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  )
}




