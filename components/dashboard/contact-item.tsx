import type { ReactNode } from "react";

interface ContactItemProps {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ContactItem({
  icon,
  children,
  className = "",
}: ContactItemProps) {
  return (
    <div className={`flex items-start space-x-4 ${className}`}>
      <div className="flex-shrink-0 text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
