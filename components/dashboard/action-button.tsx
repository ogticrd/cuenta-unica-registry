"use client";

import type React from "react";

import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  className?: string;
}

export function ActionButton({
  children,
  variant = "primary",
  onClick,
  className = "",
}: ActionButtonProps) {
  const variantClasses = {
    primary: "bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow transition-all",
    secondary:
      "text-secondary hover:text-secondary/80 bg-blue-50/50 hover:bg-blue-50 border border-transparent hover:border-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 dark:text-blue-400 dark:hover:border-blue-800/50 transition-all",
    danger:
      "text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-100/80 border border-red-100/50 hover:border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20 dark:hover:border-red-500/30 transition-all",
  };

  return (
    <Button
      variant={variant === "primary" ? "default" : "ghost"}
      onClick={onClick}
      className={`${variantClasses[variant]} text-sm px-3 py-2 h-auto min-h-[36px] ${className}`}
    >
      {children}
    </Button>
  );
}
