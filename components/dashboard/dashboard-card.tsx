import type { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function DashboardCard({
  title,
  children,
  className = "",
  action,
}: DashboardCardProps) {
  return (
    <div
      className={`p-6 bg-transparent dark:bg-card/30 rounded-2xl border-t sm:border border-border dark:border-border/50 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground tracking-tight">
          {title}
        </h3>
        {action && <div className="hidden sm:block">{action}</div>}
      </div>
      {children}
    </div>
  );
}
