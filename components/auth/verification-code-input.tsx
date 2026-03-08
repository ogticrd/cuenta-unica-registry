"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"

interface VerificationCodeInputProps {
  length?: number
  onComplete: (code: string) => void
  onCodeChange?: (code: string) => void
  error?: boolean
}

export function VerificationCodeInput({
  length = 6,
  onComplete,
  onCodeChange,
  error = false,
}: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(new Array(length).fill(""))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const codeString = code.join("")
    onCodeChange?.(codeString)
    if (codeString.length === length) {
      onComplete(codeString)
    }
  }, [code, length, onComplete, onCodeChange])

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false

    setCode([...code.map((d, idx) => (idx === index ? element.value : d))])

    // Focus next input
    if (element.value !== "" && element.nextSibling) {
      ; (element.nextSibling as HTMLInputElement).focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        // Focus previous input if current is empty
        inputs.current[index - 1]?.focus()
      }
      // Clear current input
      setCode([...code.map((d, idx) => (idx === index ? "" : d))])
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData("text")
    const pasteCode = pasteData.slice(0, length).split("")

    if (pasteCode.every((char) => !isNaN(Number(char)))) {
      const newCode = [...code]
      pasteCode.forEach((char, idx) => {
        if (idx < length) newCode[idx] = char
      })
      setCode(newCode)
    }
  }

  return (
    <div className="flex justify-center space-x-3">
      {code.map((data, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${error ? "border-accent" : "border-gray-300"
            }`}
          autoFocus={index === 0}
        />
      ))}
    </div>
  )
}
