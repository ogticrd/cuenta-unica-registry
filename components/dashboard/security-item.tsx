import type { ReactNode } from "react";

interface SecurityItemProps {
  label: string;
  value: string;
  date?: string;
  provider?: string;
  badge?: {
    text: string;
    variant: "success" | "info";
  };
  actions?: ReactNode;
  className?: string;
}

export function SecurityItem({
  label,
  value,
  date,
  provider,
  badge,
  actions,
  className = "",
}: SecurityItemProps) {
  const badgeClasses = {
    success: "bg-green-100 text-green-800 border border-green-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200",
  };

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between py-4 space-y-3 md:space-y-0 ${className}`}
    >
      <div className="flex-1 space-y-3 md:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
          <span className="font-medium text-gray-700">{label}</span>
          {badge && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${badgeClasses[badge.variant]}`}
            >
              {badge.text}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="break-words">{value}</div>
          {date && <div className="text-xs">Fecha Enlace: {date}</div>}
          {provider && <div className="text-xs">Proveedor: {provider}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 md:gap-4 pt-2 md:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
