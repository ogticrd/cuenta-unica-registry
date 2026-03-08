import Image from "next/image"

interface UserAvatarProps {
  src?: string
  alt: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
}

export function UserAvatar({ src, alt, size = "md", className = "" }: UserAvatarProps) {
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 ${className}`}>
      <Image
        src={src || "/placeholder.svg?height=128&width=128&query=user+avatar"}
        alt={alt}
        width={size === "xl" ? 128 : size === "lg" ? 80 : size === "md" ? 48 : 32}
        height={size === "xl" ? 128 : size === "lg" ? 80 : size === "md" ? 48 : 32}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
