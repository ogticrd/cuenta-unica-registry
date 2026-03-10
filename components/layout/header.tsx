"use client"

import Image from "next/image"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { LanguageToggle } from "@/components/ui/language-toggle"

export function Header() {
  return (
    <header className="bg-white dark:bg-background border-b border-gray-200 dark:border-border">
      <div className="container w-full mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Cuenta Única Logo */}
          <div className="flex items-center">
            <Image
              src="/images/cuenta-unica-logo.png"
              alt="Cuenta Única"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <div className="flex items-center space-x-2">
            <LanguageToggle />
            <AnimatedThemeToggler />
          </div>
        </div>
      </div>
    </header>
  )
}
