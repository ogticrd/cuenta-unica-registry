"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

interface FAQItemProps {
  question: string
  answer: string
  defaultOpen?: boolean
}

export function FAQItem({ question, answer, defaultOpen = false }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 dark:border-border py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left">
        <span className="text-primary dark:text-blue-400 font-bold pr-4">{question}</span>
        <div className="flex-shrink-0">
          {isOpen ? <X size={20} className="text-gray-500 dark:text-gray-400" /> : <Plus size={20} className="text-gray-500 dark:text-gray-400" />}
        </div>
      </button>
      {isOpen && <div className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</div>}
    </div>
  )
}
