import Image from "next/image";
import type React from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PointsDecoration } from "@/components/auth/points-decoration";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#eff7ff] dark:bg-background overflow-x-hidden">
      <PointsDecoration />

      <div className="pointer-events-none fixed bottom-0 right-0 opacity-70 dark:opacity-20 z-0 translate-x-1/4 translate-y-1/4 md:translate-x-1/3 md:translate-y-1/3">
        <Image
          src="/images/forms.svg"
          alt=""
          width={500}
          height={500}
          className="w-64 h-64 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px]"
          priority
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
}
