import Link from "next/link";
import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  href?: string;
}

export function StatsCard({ title, value, icon, description, href }: StatsCardProps) {
  return (
    <Link href={href || "#"} className="flex flex-col items-center justify-center p-5 bg-gray-50 dark:bg-card/50 rounded-2xl border border-transparent dark:border-border/50 text-center hover:bg-gray-100 dark:hover:bg-card/80 transition-colors h-full w-full">
      <div className="text-secondary mb-3 bg-secondary/5 dark:bg-secondary/20 p-2.5 rounded-full">
        {icon}
      </div>
      <p className="text-3xl font-bold text-primary mb-1 tracking-tight dark:text-white">
        {value}
      </p>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {title}
      </p>

      {description && (
        <p className="text-xs text-muted-foreground/80">{description}</p>
      )}
    </Link>
  )
}
