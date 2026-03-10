"use client"

import type React from "react"

import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText: string
  cancelText?: string
  confirmVariant?: "default" | "destructive"
  children?: React.ReactNode
  isLoading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = "CANCELAR",
  confirmVariant = "destructive",
  children,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-lg font-semibold text-primary dark:text-blue-400 pr-8">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-gray-900 dark:text-gray-300 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-secondary text-secondary hover:bg-secondary hover:text-white font-medium px-6 bg-transparent dark:hover:bg-secondary/25"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className={
              confirmVariant === "destructive"
                ? "bg-accent hover:bg-accent/90 text-white font-medium px-6"
                : "bg-primary hover:bg-primary/90 text-white font-medium px-6"
            }
          >
            {isLoading ? "Procesando..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
