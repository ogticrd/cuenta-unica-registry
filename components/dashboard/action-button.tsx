"use client"

import type React from "react"

import { Button } from "@/components/ui/button"

interface ActionButtonProps {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "danger"
  onClick?: () => void
  className?: string
}

export function ActionButton({ children, variant = "primary", onClick, className = "" }: ActionButtonProps) {
  const variantClasses = {
    primary: "bg-primary hover:bg-primary/90 text-white",
    secondary: "text-secondary hover:text-secondary/80 bg-transparent hover:bg-blue-50",
    danger: "text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50",
  }

  return (
    <Button
      variant={variant === "primary" ? "default" : "ghost"}
      onClick={onClick}
      className={`${variantClasses[variant]} text-sm px-3 py-2 h-auto min-h-[36px] ${className}`}
    >
      {children}
    </Button>
  )
}
