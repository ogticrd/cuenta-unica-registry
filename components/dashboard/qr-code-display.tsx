"use client"

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeDisplay({ value, size = 200, className = "" }: QRCodeDisplayProps) {
  // In a real implementation, you would use a QR code library like 'qrcode' or 'react-qr-code'
  // For now, we'll use a placeholder that represents a QR code

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="bg-gray-100 flex items-center justify-center rounded" style={{ width: size, height: size }}>
        {/* Simulated QR Code Pattern */}
        <div className="grid grid-cols-8 gap-1 w-full h-full p-2">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className={`${Math.random() > 0.5 ? "bg-black" : "bg-white"} rounded-sm`} />
          ))}
        </div>
      </div>
    </div>
  )
}
