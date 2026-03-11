"use client"

import Image from "next/image"
import { useT } from "@/hooks/use-t"

export function WelcomeSection() {
  const t = useT("login")

  return (
    <div className="flex flex-col justify-center space-y-6 text-left">
      <div className="space-y-4">
        <h1 className="text-3xl lg:text-4xl font-medium text-primary dark:text-blue-400 leading-tight">
          {t("welcome_title")}{" "}
          <span className="text-accent dark:text-red-400 font-bold">
            {t("welcome_highlight")}
          </span>!
        </h1>

        <p className="text-lg text-primary dark:text-blue-200 font-medium leading-relaxed">
          {t("welcome_subtitle")}
        </p>

        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          {t("welcome_body")}
        </p>
      </div>

      <div className="flex justify-center lg:justify-start">
        <div className="relative w-full max-w-lg">
          <Image
            src="/images/digital-authentication-illustration.png"
            alt="Ilustración de acceso digital seguro a servicios gubernamentales"
            width={500}
            height={400}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </div>
  )
}

