"use client";

import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ROUTES } from "@/lib/constants/routes";
import { useNotifications } from "@/lib/notifications/notification-context";
import { NotificationDrawer } from "./notification-drawer";

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] =
    useState(false);
  const { unreadCount } = useNotifications();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-background border-b border-gray-200 dark:border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Mobile Menu Button + Cuenta Única Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400"
            >
              <Menu size={20} />
            </Button>

            <Link href={ROUTES.dashboard}>
              <Image
                src="/images/cuenta-unica-logo.svg"
                alt="Cuenta Única"
                width={210}
                height={104}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Right side - Notifications and Menu */}
          <div className="flex items-center space-x-2">
            <LanguageToggle />
            <AnimatedThemeToggler />
            <Button
              variant="ghost"
              size="sm"
              className="p-2 relative hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400"
              onClick={() => setIsNotificationDrawerOpen(true)}
            >
              <Bell
                size={20}
                className={`transition-all duration-300 ${
                  isNotificationDrawerOpen
                    ? "animate-pulse scale-110"
                    : "hover:rotate-12 hover:scale-110"
                }`}
              />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full size-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </header>
  );
}
