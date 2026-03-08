"use client"

import { useState } from "react"
import Image from "next/image"
import { Bell, Grid3X3, Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { NotificationDrawer } from "./notification-drawer"

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void
}

export function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Mobile Menu Button + Cuenta Única Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 hover:bg-gray-100"
            >
              <Menu size={20} className="text-primary" />
            </Button>

            <Image
              src="/images/cuenta-unica-logo.png"
              alt="Cuenta Única"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </div>

          {/* Right side - Notifications and Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 relative hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => setIsNotificationDrawerOpen(true)}
            >
              <Bell
                size={20}
                className={`text-primary transition-all duration-300 ${isNotificationDrawerOpen
                    ? 'animate-pulse scale-110'
                    : 'hover:rotate-12 hover:scale-110'
                  }`}
              />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                2
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotificationDrawerOpen} onClose={() => setIsNotificationDrawerOpen(false)} />
    </header>
  )
}
