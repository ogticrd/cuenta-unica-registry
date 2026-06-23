import Image from "next/image";
import { CardIcon } from "@/components/ui/card-icon";
import { useT } from "@/hooks/use-t";
import { Backlight } from "../ui/backlight";

const COLORS = {
  primary: "#003876",
  red: "#EE2A24",
  lightBlue: "#6db0e2",
  white: "white",
};

type GridCell =
  | {
      id: string;
      type: "empty";
      bgTransparent?: boolean;
    }
  | {
      id: string;
      type: "card";
      color: string;
      dotColor: string;
      delay: number;
      duration: number;
      bgTransparent?: boolean;
    };

const gridCells: GridCell[] = [
  // ROW 1
  { id: "row-1-empty", type: "empty" },
  {
    id: "row-1-primary-red",
    type: "card",
    color: COLORS.primary,
    dotColor: COLORS.red,
    delay: 5,
    duration: 20,
  },
  {
    id: "row-1-red-primary",
    type: "card",
    color: COLORS.red,
    dotColor: COLORS.primary,
    delay: 12,
    duration: 20,
  },
  // ROW 2
  { id: "row-2-empty", type: "empty" },
  {
    id: "row-2-light-blue-white",
    type: "card",
    color: COLORS.lightBlue,
    dotColor: COLORS.white,
    delay: 27,
    duration: 20,
  },
  {
    id: "row-2-primary-light-blue",
    type: "card",
    color: COLORS.primary,
    dotColor: COLORS.lightBlue,
    delay: 8,
    duration: 20,
  },
  // ROW 3
  {
    id: "row-3-primary-light-blue",
    type: "card",
    color: COLORS.primary,
    dotColor: COLORS.lightBlue,
    delay: 19,
    duration: 20,
  },
  {
    id: "row-3-red-white",
    type: "card",
    color: COLORS.red,
    dotColor: COLORS.white,
    delay: 4,
    duration: 20,
  },
  { id: "row-3-empty", type: "empty", bgTransparent: true },
  // ROW 4
  {
    id: "row-4-primary-white",
    type: "card",
    color: COLORS.primary,
    dotColor: COLORS.white,
    delay: 30,
    duration: 20,
  },
  {
    id: "row-4-red-primary",
    type: "card",
    color: COLORS.red,
    dotColor: COLORS.primary,
    delay: 15,
    duration: 20,
  },
  {
    id: "row-4-light-blue-primary",
    type: "card",
    color: COLORS.lightBlue,
    dotColor: COLORS.primary,
    delay: 22,
    duration: 20,
  },
];

export function WhatIsCuc() {
  const t = useT("landing.what_is_cuc");

  return (
    <section className="relative w-full overflow-hidden bg-[#eff7ff] dark:bg-card py-16 lg:py-24">
      {/* Background Dots Pattern */}
      <div className="absolute left-0 top-0 bottom-0 h-full opacity-[0.30] dark:opacity-20 pointer-events-none">
        <Image
          src="/images/points.svg"
          alt=""
          width={263}
          height={687}
          className="h-full w-auto object-cover"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        {/* Text Content */}
        <div className="flex-1 max-w-2xl">
          <h2 className="text-primary text-[2rem] sm:text-[2.5rem] lg:text-[3rem] font-black leading-snug tracking-tight dark:text-white">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="text-[#6db0e2]">{chunks}</span>
              ),
            })}
          </h2>
          <div className="text-base md:text-lg text-primary dark:text-gray-300 font-medium">
            <p className="leading-[2.2]">{t("body")}</p>
          </div>
        </div>

        {/* Right Side Cards Grid */}
        <div className="flex-shrink-0 relative sm:block">
          <Backlight blur={75} className="w-full h-full">
            <div className="grid grid-cols-3 relative z-20">
              {gridCells.map((cell) => (
                <div
                  key={cell.id}
                  className={`w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 ${cell.bgTransparent ? "bg-transparent" : ""}`}
                >
                  {cell.type === "card" && (
                    <CardIcon
                      color={cell.color}
                      dotColor={cell.dotColor}
                      delay={cell.delay}
                      duration={cell.duration}
                    />
                  )}
                </div>
              ))}
            </div>
          </Backlight>
        </div>
      </div>
    </section>
  );
}
