"use client"

import type React from "react"
import { useState } from "react"
import { AIChatModal } from "./ai-chat-modal"
import { DashboardHeader } from "./dashboard-header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { MessageCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "./dashboard-sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <DashboardHeader onMobileMenuToggle={handleMobileMenuToggle} />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="flex">
            <DashboardSidebar 
              isMobileMenuOpen={isMobileMenuOpen} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
            />
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>

        {/* Floating Help Button */}
        <Button
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-secondary hover:bg-secondary/90 shadow-lg"
          size="sm"
          onClick={() => setIsAIChatOpen(true)}
        >
          <MessageCircle size={24} className="text-white" />
        </Button>

        {/* AI Chat Modal */}
        <AIChatModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      </div>
    </ProtectedRoute>
  )
}
