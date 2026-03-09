"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivityItem } from "@/components/dashboard/recent-activity-item"
import { ActionButton } from "@/components/dashboard/action-button"
import { useAuth } from "@/lib/auth-context"
import { User, Shield, Clock, Bell, Smartphone, Globe, CheckCircle, AlertTriangle, Info, Calendar, Activity, Lock } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  const quickActions = [
    {
      title: "Datos Personales",
      description: "Consulta y actualiza tu información personal registrada",
      icon: <User size={24} />,
      href: "/settings"
    },
    {
      title: "Privacidad y Seguridad",
      description: "Configura la seguridad de tu cuenta y revisa accesos",
      icon: <Shield size={24} />,
      href: "/settings",
    },
    {
      title: "Historial de Actividad",
      description: "Revisa dispositivos conectados y actividad reciente",
      icon: <Clock size={24} />,
      href: "/history"
    },
    {
      title: "Soporte y Ayuda",
      description: "Encuentra ayuda y contacta con nuestro equipo de soporte",
      icon: <Bell size={24} />,
      href: "/support"
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
      href: "/history"
    },
    {
      title: "Configuracion de Cuenta",
      description: "Administra la seguridad y privacidad de tu cuenta",
      icon: <Lock size={20} />,
      href: "/settings"
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold mb-2">
                ¡Bienvenido, {user?.name}!
              </h1>
              <p className="text-blue-100 mb-4">
                Administra tu identidad digital, revisa tu seguridad y accede a los servicios del Estado desde un solo lugar.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Último acceso: Hoy, 2:30 PM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock size={16} />
                  <span>Cuenta verificada</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <User size={40} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            title="Dispositivos Conectados"
            value="4"
            icon={<Smartphone size={24} />}
            description="Dispositivos activos"
          />
          <StatsCard
            title="Servicios Utilizados"
            value="12"
            icon={<Globe size={24} />}
            description="Este mes"
            trend={{ value: "+3", isPositive: true }}
          />
          <StatsCard
            title="Acciones Realizadas"
            value="8"
            icon={<Activity size={24} />}
            description="Ultimos 30 dias"
          />
          <StatsCard
            title="Nivel de Seguridad"
            value="Alto"
            icon={<Shield size={24} />}
            description="2FA activado"
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
                badge={(action as any).badge}
              />
            ))}
          </div>
        </DashboardCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <DashboardCard
            title="Actividad Reciente"
            action={
              <ActionButton variant="secondary" onClick={() => window.location.href = '/history'}>
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
              <ActionButton variant="secondary" onClick={() => window.location.href = '/settings'}>
                Configurar
              </ActionButton>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">Autenticación de dos factores</p>
                    <p className="text-xs text-green-700 dark:text-green-400">Activada - Correo electrónico</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Info size={20} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Contraseña</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">Última actualización: Hace 2 meses</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-300">Passkeys</p>
                    <p className="text-xs text-orange-700 dark:text-orange-400">Recomendado configurar</p>
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
            <div className="flex items-start space-x-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-1">
                  Revisa tu seguridad
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-400 mb-2">
                  Te recomendamos activar la autenticacion de dos factores y configurar un Passkey para mayor protección de tu cuenta.
                </p>
                <ActionButton variant="primary" onClick={() => window.location.href = '/settings'}>
                  Ir a Seguridad
                </ActionButton>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  Nueva Funcionalidad Disponible
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
                  Ahora puedes usar Passkeys para acceder sin contraseña. Configúralo para mayor seguridad.
                </p>
                <ActionButton variant="secondary" onClick={() => window.location.href = '/settings'}>
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
