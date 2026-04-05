"use client";

import Image from "next/image";
import Link from "next/link";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ROUTES } from "@/lib/constants/routes";

export function Header() {
  return (
    <header className="bg-white dark:bg-background border-b border-gray-200 dark:border-border">
      <div className="container w-full mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Cuenta Única Logo */}
          <div className="flex items-center">
            <Link href={ROUTES.login}>
              <Image
                src="/images/cuenta-unica-logo.svg"
                alt="Cuenta Única"
                width={210}
                height={104}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageToggle />
            <AnimatedThemeToggler />
          </div>
        </div>
      </div>
    </header>
  );
}
