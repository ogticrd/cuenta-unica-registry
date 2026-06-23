"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DotField from "@/components/home/hero/DotField";
import { Backlight } from "@/components/ui/backlight";
import { Button } from "@/components/ui/button";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";

export function Hero() {
  const t = useT("landing.hero");
  return (
    <section className="relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
      {/* DotField Background */}
      <div className="absolute inset-0 w-full h-full bg-white dark:bg-card">
        <DotField
          dotRadius={1.5}
          dotSpacing={25}
          cursorRadius={500}
          cursorForce={0.1}
          // bulgeOnly
          bulgeStrength={67}
          glowRadius={160}
          waveAmplitude={5}
          // sparkle
          gradientFrom={"#c9e0f0ff"}
          gradientTo={"#233e51ff"}
          glowColor={"#0087ff50"}
        />
      </div>
      {/* Subtle background pattern */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left z-10">
            <h1 className="text-4xl/tight sm:text-5xl/tight lg:text-5xl/tight font-extrabold text-primary dark:text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              {t.rich("welcome_title", {
                citizen: t("citizen"),
                highlight: (chunks) => (
                  <span className="text-accent dark:text-red-400">
                    {chunks}
                  </span>
                ),
              })}
            </h1>

            <div className="text-lg text-primary dark:text-blue-200 font-semibold leading-relaxed mb-4 [--text-color:#003876] dark:[--text-color:#bfdbfe]">
              <DiaTextReveal
                text={t("welcome_subtitle")}
                colors={["#6db0e2", "#EE2A24", "#0087ff"]}
                delay={0.25}
                duration={2.5}
                textColor="var(--text-color)"
              />
            </div>

            <div className="text-sm sm:text-base text-gray-600 font-medium dark:text-gray-300 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 [--text-color:#4b5563] dark:[--text-color:#d1d5db]">
              <DiaTextReveal
                text={t("welcome_body")}
                colors={["#6db0e2", "#EE2A24", "#0087ff"]}
                delay={0.25}
                duration={2.5}
                textColor="var(--text-color)"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href={ROUTES.register}>
                <Button className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                  {t("register_btn")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={ROUTES.login}>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-semibold rounded-full border-2 border-primary text-primary hover:bg-gray-100 hover:border-primary/50 hover:text-primary px-8 dark:border-white dark:text-white dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  {t("login_btn")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-200 fill-mode-both">
              {/* Glow backdrop */}
              <div className="absolute" />
              {/* Decorative elements */}
              <Backlight blur={50}>
                <Image
                  src="/images/hero.svg"
                  alt="Autenticación Digital"
                  width={450}
                  height={360}
                  className="w-full max-w-md"
                />
              </Backlight>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
