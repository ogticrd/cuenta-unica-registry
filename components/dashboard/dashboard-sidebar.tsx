"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, HelpCircle, Info, Shield, Clock, LogOut, X, Loader2 } from 'lucide-react'
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/lib/constants/routes"
import { Button } from "@/components/ui/button"
import { DashboardSidebarProps } from './dashboard-sidebar-props'
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"

export function DashboardSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: DashboardSidebarProps) {
  const { user, logout, isLoggingOut } = useAuth()
  const pathname = usePathname()
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
        fixed top-0 left-0 z-50
        md:sticky md:top-16 md:z-auto
        w-72 h-full md:h-[calc(100vh-4rem)]
        md:flex-shrink-0
        bg-background border-r border-border
        transform transition-transform duration-300 ease-in-out
        overflow-y-auto flex flex-col
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-muted-foreground hover:bg-secondary/10 hover:text-foreground rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        {/* User Profile Section */}
        <div className="p-6 md:pt-8 md:pb-6">
          <div className="flex items-center gap-3 bg-secondary/5 rounded-2xl p-4 border border-transparent hover:border-border/50 transition-colors">
            <Avatar className="relative overflow-visible" size="lg">
              <AvatarFallback className="bg-background border border-border text-foreground font-semibold">
                {user?.name?.trim()?.[0]?.toUpperCase()}
              </AvatarFallback>
              <AvatarBadge className="bg-green-500 border-background" />
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground truncate text-sm">{user?.name}</h3>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{user?.cedula}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 pb-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                      ? "text-secondary bg-secondary/10 font-bold"
                      : "text-muted-foreground hover:bg-secondary/5 hover:text-foreground font-medium"
                      }`}
                  >
                    <Icon size={18} className={isActive ? "text-secondary" : ""} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 mt-auto border-t border-border">
          <Button
            variant="ghost"
            onClick={() => {
              logout()
              setIsMobileMenuOpen(false)
            }}
            disabled={isLoggingOut}
            className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl px-4 py-6"
          >
            {isLoggingOut ? (
              <Loader2 size={18} className="mr-3 animate-spin text-red-500" />
            ) : (
              <LogOut size={18} className="mr-3" />
            )}
            <span className="font-semibold text-sm">
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </span>
          </Button>
        </div>
      </aside>
    </>
  )
}

const menuItems = [
  { icon: Home, label: "Inicio", href: ROUTES.dashboard },
  { icon: User, label: "Datos personales", href: ROUTES.profile },
  { icon: HelpCircle, label: "Soporte y ayuda", href: ROUTES.support },
  { icon: Info, label: "Conoce la plataforma", href: ROUTES.about },
  { icon: Shield, label: "Privacidad y seguridad", href: ROUTES.settings },
  { icon: Clock, label: "Historial de actividad", href: ROUTES.history },
]
