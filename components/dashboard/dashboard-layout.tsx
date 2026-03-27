"use client";

import { Bot } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/lib/protected-route";
import { AIChatModal } from "./ai-chat-modal";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
          className={`fixed bottom-6 right-6 rounded-2xl w-14 h-14 bg-background border border-border shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 z-40 group ${isAIChatOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          size="icon"
          onClick={() => setIsAIChatOpen(true)}
        >
          <div className="absolute inset-0 rounded-2xl bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Bot
            size={24}
            className="text-secondary relative z-10 group-hover:scale-110 transition-transform duration-300"
          />
        </Button>

        {/* AI Chat Modal */}
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
