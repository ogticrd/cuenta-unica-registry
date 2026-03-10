"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, HelpCircle, Info, Shield, Clock, LogOut, X, Loader2 } from 'lucide-react'
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { DashboardSidebarProps } from './dashboard-sidebar-props'
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"

export function DashboardSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: DashboardSidebarProps) {
  const { user, logout, isLoggingOut } = useAuth()
  const pathname = usePathname()
  console.log(user)
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
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
        bg-white dark:bg-background border-r border-gray-200 dark:border-border
        transform transition-transform duration-300 ease-in-out
        overflow-y-auto
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-border md:border-b-0">
          <div className="flex items-center space-x-3">
            <Avatar className="relative overflow-visible" size="lg">
              {/* <AvatarImage
                src="https://github.com/evilrabbit.png"
                alt="@evilrabbit"
              /> */}
              <AvatarFallback className="dark:bg-gray-800">{user?.name?.trim()?.[0]?.toUpperCase()}</AvatarFallback>
              <AvatarBadge className="bg-green-600 dark:bg-green-500 border-white dark:border-gray-900" />
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-extrabold text-primary dark:text-white truncate">{user?.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.cedula}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 md:p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${isActive ? "text-primary dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                  >
                    <Icon size={20} />
                    <span className={`${isActive ? "font-extrabold" : "font-medium"}`}>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-2 md:p-4 border-t border-gray-200 dark:border-border md:border-t-0">
          <Button
            variant="ghost"
            onClick={() => {
              logout()
              setIsMobileMenuOpen(false)
            }}
            disabled={isLoggingOut}
            className="w-full justify-start text-secondary dark:text-blue-400 hover:text-secondary dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 size={20} className="mr-3 animate-spin" />
            ) : (
              <LogOut size={20} className="mr-3" />
            )}
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar la sesión"}
          </Button>
        </div>
      </aside>
    </>
  )
}

const menuItems = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: User, label: "Datos personales", href: "/profile" },
  { icon: HelpCircle, label: "Soporte y ayuda", href: "/support" },
  { icon: Info, label: "Conoce la plataforma", href: "/about" },
  { icon: Shield, label: "Privacidad y seguridad", href: "/settings" },
  { icon: Clock, label: "Historial de actividad", href: "/history" },
]
