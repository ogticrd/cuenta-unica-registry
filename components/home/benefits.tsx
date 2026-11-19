"use client";

import Image from "next/image";

import { useT } from "@/hooks/use-t";
import { Backlight } from "../ui/backlight";

export function Benefits() {
  const t = useT("landing.benefits");

  const benefits = [
    {
      title: t("items.item1.title"),
      description: t("items.item1.description"),
      color: "#6db0e2",
      image: "/images/benefits/layer1.svg",
    },
    {
      title: t("items.item2.title"),
      description: t("items.item2.description"),
      color: "#EE2A24",
      image: "/images/benefits/layer2.svg",
    },
    {
      title: t("items.item3.title"),
      description: t("items.item3.description"),
      color: "#003876",
      image: "/images/benefits/layer3.svg",
    },
    {
      title: t("items.item4.title"),
      description: t("items.item4.description"),
      color: "#0087ff",
      image: "/images/benefits/layer4.svg",
    },
  ];

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden bg-white dark:bg-background">
      {/* Dot Pattern Background */}
      <div
        className="absolute inset-0 z-0 opacity-100 dark:opacity-10"
        style={{
          backgroundImage: "radial-gradient(#e2e8f0 2px, transparent 2px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20 sm:mb-28 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-primary dark:text-white tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg text-secondary dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {/* Vertical Stack of Benefits */}
        <div className="flex flex-col gap-24 lg:gap-32">
          {benefits.map((benefit, index) => {
            const isEven = index % 2 === 1;

            return (
              <div
                key={benefit.title}
                className={`flex flex-col ${isEven ? "lg:flex-row-reverse" : "lg:flex-row"
                  } items-center gap-12 lg:gap-24`}
              >
                {/* Illustration Side */}
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end px-8">
                  <Backlight blur={50} className="w-full max-w-[280px]">
                    <div className="relative w-full aspect-[4/3] flex items-center justify-center z-20">
                      <Image
                        src={benefit.image}
                        alt={benefit.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </Backlight>
                </div>

                {/* Text Side */}
                <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
                  <h3
                    className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight"
                    style={{ color: benefit.color }}
                  >
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
