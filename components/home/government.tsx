import Image from "next/image";
import { useT } from "@/hooks/use-t";
import { Backlight } from "../ui/backlight";

export function GovernmentEntities() {
  const t = useT("landing.government");

  return (
    <section className="py-20 sm:py-24 bg-white dark:bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#6db0e2] dark:bg-[#112240] dark:border dark:border-slate-800 rounded-xl overflow-hidden">
          {/* Background Dot Pattern (Top Left) */}
          <div
            className="absolute top-0 left-0 w-[400px] h-[400px] opacity-25 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#0A3366 2px, transparent 2px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col p-8 sm:p-14 lg:p-20 gap-8 lg:gap-12">
            {/* Top Content (Main Text) */}
            <div className="w-full">
              <h2 className="text-[2rem] sm:text-[2.5rem] lg:text-[3rem] font-black leading-snug tracking-tight">
                <span className="text-white dark:text-blue-50">
                  {t("title")}
                </span>{" "}
                <span className="text-[#0A3366] dark:text-blue-300">
                  {t("subtitle")}
                </span>
              </h2>
            </div>

            {/* Bottom Content (Description + Image) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left Content (Description + Button) */}
              <div className="flex-1 w-full">
                <p
                  className="text-primary dark:text-blue-100/90 font-medium text-[15px] sm:text-base mb-10 text-justify w-full"
                  style={{ lineHeight: "2.0rem" }}
                >
                  {t("description")}
                </p>

                <div className="mt-6 w-full">
                  {/* Contact Alert */}
                  <div className="flex items-start sm:items-center gap-3 text-primary dark:text-blue-100 bg-white/30 dark:bg-slate-900/50 px-5 py-4 rounded-lg border border-white dark:border-slate-700 w-full sm:w-fit max-w-full backdrop-blur-sm">
                    <svg
                      aria-hidden="true"
                      className="flex-shrink-0 mt-0.5 sm:mt-0"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span className="text-[14px] sm:text-[15px] font-medium leading-relaxed">
                      {t("contact_msg")}{" "}
                      <a
                        href="mailto:digital@ogtic.gob.do"
                        className="font-bold underline hover:text-primary/80 dark:hover:text-blue-300 whitespace-nowrap"
                      >
                        digital@ogtic.gob.do
                      </a>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Content - SVG Cityscape Illustration */}
              <div className="flex-1 flex justify-center lg:justify-end w-full items-center">
                <Backlight blur={50} className="w-[70%] lg:max-w-[400px]">
                  <Image
                    src="/images/city.svg"
                    alt="Ilustración de Entidad Gubernamental"
                    width={400}
                    height={400}
                    className="w-full h-auto relative z-20"
                  />
                </Backlight>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
