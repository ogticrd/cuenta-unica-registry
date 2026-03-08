import Image from "next/image"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
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
        </div>
      </div>
    </header>
  )
}
