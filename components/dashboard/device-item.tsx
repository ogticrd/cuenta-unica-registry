"use client";

import { Monitor, Smartphone, MapPin, Clock, Laptop, ChevronDown, X, Loader2 } from "lucide-react";
import { useLocale, useT } from "@/hooks/use-t";
import { ActionButton } from "./action-button";
import { getRelativeTime } from "@/lib/utils/date";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { locationApiService } from "@/lib/services/location/location-api.service";

const DeviceMap = dynamic(
  () => import("./device-map").then((mod) => mod.DeviceMap),
  {
    ssr: false,
    loading: () => {
      const t = useT("history");
      return (
        <div className="w-full h-[200px] bg-muted/50 animate-pulse rounded-md border border-border/50 flex items-center justify-center text-muted-foreground text-sm">
          {t("loading_map")}
        </div>
      );
    },
  }
);

interface DeviceItemProps {
  device: string;
  ipAddress: string;
  location: string;
  lastAccess: string;
  lastAccessRaw?: string;
  expirationDate: string;
  expirationDateRaw?: string;
  status: {
    text: string;
    variant: "active" | "current";
  };
  onUnlink?: () => void;
  rawDeviceName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function DeviceItem({
  device,
  ipAddress,
  location,
  lastAccess,
  lastAccessRaw,
  expirationDate,
  expirationDateRaw,
  status,
  onUnlink,
  rawDeviceName,
  coordinates,
}: DeviceItemProps) {
  const t = useT("history");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null | undefined>(coordinates);
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [coordsError, setCoordsError] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    if (open && coords === undefined && ipAddress && ipAddress !== t("ip_unknown")) {
      setIsLoadingCoords(true);
      setCoordsError(false);
      try {
        const fetchedCoords = await locationApiService.getCoordinates(ipAddress);
        if (fetchedCoords) {
          setCoords(fetchedCoords);
        } else {
          setCoords(null);
          setCoordsError(true);
        }
      } catch (error) {
        setCoords(null);
        setCoordsError(true);
      } finally {
        setIsLoadingCoords(false);
      }
    }
  };
  const deviceLower = device.toLowerCase();

  const isMobile =
    deviceLower.includes("mobile") ||
    deviceLower.includes("android") ||
    deviceLower.includes("iphone") ||
    deviceLower.includes("ipad");

  const isMac = deviceLower.includes("mac");
  const isWindows = deviceLower.includes("windows");

  // Determine the best icon
  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone size={24} strokeWidth={1.5} />;
    if (isMac || isWindows) return <Laptop size={24} strokeWidth={1.5} />;
    return <Monitor size={24} strokeWidth={1.5} />;
  };

  const isCurrent = status.variant === "current";

  return (
    <div
      className={`group flex flex-col p-6 rounded-md border-2 transition-all duration-300 hover:shadow-md ${isCurrent
        ? " border-green-400 shadow-sm dark:border-green-600"
        : "bg-card border-border hover:border-border/80"
        }`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start gap-5 flex-1 min-w-0">
          <div
            className={`flex-shrink-0 mt-1 p-3.5 rounded-xl flex items-center justify-center transition-colors ${isCurrent
              ? "bg-green-500 text-primary-foreground shadow-sm dark:bg-green-600"
              : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground dark:bg-gray-800"
              }`}
          >
            {getDeviceIcon()}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h3
                className="font-semibold text-lg md:text-xl text-foreground tracking-tight break-words"
                title={device}
              >
                {device}
              </h3>
              {isCurrent && (
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-green-50 text-green-500 border border-green-200 flex items-center gap-1.5 dark:bg-green-900/40 dark:text-green-500 dark:border-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse dark:bg-green-400"></span>
                  {t("session_current_badge")}
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground flex flex-col gap-2 mt-3">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="opacity-70 flex-shrink-0 mt-0.5" />
                <span className="break-words">
                  <span className="font-semibold">{t("location")}: </span>
                  {location}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="opacity-70 flex-shrink-0 mt-0.5" />
                <span className="break-words flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-semibold">{t("last_access_prefix")}: </span>
                  <span>{lastAccess}</span>
                  {lastAccessRaw && (
                    <span className="text-xs opacity-80">
                      ({getRelativeTime(lastAccessRaw, locale)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {onUnlink && (
          <div className="flex-shrink-0 self-start mt-2 md:mt-0">
            <ActionButton
              variant="danger"
              onClick={onUnlink}
              className="w-full md:w-auto font-medium shadow-sm hover:shadow dark:hover:bg-red-900/20 flex items-center justify-center gap-1.5"
            >
              <X size={16} />
              {t("close_session")}
            </ActionButton>
          </div>
        )}
      </div>



      <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="w-full mt-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed border-border/80" />
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative z-10 py-1.5 h-8 text-[11px] font-bold tracking-wider uppercase rounded-full bg-card flex items-center gap-1.5"
            >
              <span>{isOpen ? t("see_less") : t("see_more")}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-300 text-muted-foreground ${isOpen && "transform rotate-180"}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2 space-y-4 pt-4 transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {t("expires_on")}
                </span>
                <span className="text-sm font-medium text-foreground break-all flex flex-wrap items-baseline gap-1.5">
                  <span>{expirationDate}</span>
                  {expirationDateRaw && (
                    <span className="text-muted-foreground font-normal text-xs">
                      ({getRelativeTime(expirationDateRaw, locale)})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {t("ip_address")}
                </span>
                <span className="text-sm font-medium text-foreground break-all">
                  {ipAddress}
                </span>
              </div>

              {rawDeviceName && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    {t("raw_device_name")}
                  </span>
                  <span className="text-sm font-medium text-foreground break-words font-mono text-xs bg-muted/50 p-2.5 rounded-lg border border-border/50">
                    {rawDeviceName}
                  </span>
                </div>
              )}
            </div>

            {(isLoadingCoords || coords || coordsError) && (
              <div className="w-full flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {t("location")}
                </span>
                {isLoadingCoords ? (
                  <div className="w-full h-[200px] bg-muted/50 animate-pulse rounded-md border border-border/50 flex items-center justify-center text-muted-foreground text-sm">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t("loading_map")}
                  </div>
                ) : coordsError ? (
                  <div className="w-full h-[200px] bg-muted/10 rounded-md border border-dashed border-red-500/30 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <MapPin className="h-8 w-8 text-red-400/50" />
                    <span className="text-red-500/80 font-medium">{t("location_unknown")}</span>
                  </div>
                ) : coords ? (
                  <DeviceMap lat={coords.lat} lng={coords.lng} />
                ) : null}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
