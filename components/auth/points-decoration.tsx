"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export function PointsDecoration() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 opacity-70 dark:opacity-20 z-0 hidden md:block">
      <Image
        src="/images/points.svg"
        alt=""
        width={263}
        height={687}
        className="w-48 h-auto md:w-72 lg:w-[250px]"
        priority
        aria-hidden="true"
      />
    </div>
  );
}
