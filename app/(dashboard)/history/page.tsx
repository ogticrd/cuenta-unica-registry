"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DeviceItem } from "@/components/dashboard/device-item";
import { PortalItem } from "@/components/dashboard/portal-item";
import { SecuritySection } from "@/components/dashboard/security-section";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useLocale, useT } from "@/hooks/use-t";
import { useAuth } from "@/lib/auth-context";
import {
  type OrySession,
  sessionService,
} from "@/lib/services/ory/session.service";
import { formatSessionDate } from "@/lib/utils/date";
import { formatUserAgent } from "@/lib/utils/device";

type DeviceStatus = {
  text: string;
  variant: "current" | "active";
};

type DeviceRow = {
  id: string;
  device: string;
  ipAddress: string;
  location: string;
  lastAccess: string;
  lastAccessRaw?: string;
  expirationDate: string;
  expirationDateRaw?: string;
  isCurrentSession: boolean;
  status: DeviceStatus;
  rawDeviceName?: string;
  coordinates?: { lat: number; lng: number };
};

export default function HistoryPage() {
  const { session, refreshSession } = useAuth();
  const t = useT("history");
  const locale = useLocale();
  const dateLocale = locale === "es" ? "es-DO" : "en-US";

  const [unlinkDeviceModal, setUnlinkDeviceModal] = useState<{
    isOpen: boolean;
    deviceName: string;
    deviceId: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    deviceName: "",
    deviceId: null,
    isLoading: false,
  });

  const [unlinkPortalModal, setUnlinkPortalModal] = useState<{
    isOpen: boolean;
    portalName: string;
    portalId: number | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    portalName: "",
    portalId: null,
    isLoading: false,
  });

  const allSessions: OrySession[] = session
    ? [
      session,
      ...(Array.isArray(session.other_sessions)
        ? session.other_sessions
        : []),
    ]
    : [];

  const devices: DeviceRow[] = allSessions.map((currentSession, index) => {
    const device = currentSession.devices?.[0];
    const isCurrentSession = index === 0;

    return {
      id: currentSession.id || `fallback-${index}`,
      device: formatUserAgent(device?.user_agent, t("device_unknown"), {
        unknownBrowser: t("browser_unknown"),
        unknownOS: t("os_unknown"),
        connector: t("device_connector"),
        detailSeparator: t("device_detail_separator"),
        deviceComputer: t("device_computer"),
        deviceAndroid: t("device_android"),
        deviceIPhone: t("device_iphone"),
        deviceTablet: t("device_tablet"),
        deviceMobile: t("device_mobile"),
      }),
      ipAddress: device?.ip_address || t("ip_unknown"),
      location: device?.location || t("location_unknown"),
      lastAccess: formatSessionDate(
        currentSession.authenticated_at,
        t("recent"),
        dateLocale
      ),
      lastAccessRaw: currentSession.authenticated_at,
      expirationDate: formatSessionDate(
        currentSession.expires_at,
        t("indefinite"),
        dateLocale
      ),
      expirationDateRaw: currentSession.expires_at,
      isCurrentSession,
      status: isCurrentSession
        ? { text: t("session_active"), variant: "current" }
        : { text: t("active"), variant: "active" },
      rawDeviceName: (device as any)?.rawDeviceName || device?.user_agent || undefined,
      coordinates: (device as any)?.coordinates || (device?.ip_address && device.ip_address !== t("ip_unknown")
        ? (index === 0
            ? { lat: 18.4861, lng: -69.9312 }
            : { lat: 19.4517, lng: -70.69703 })
        : undefined),
    };
  });

  const portalLastAccess = new Date("2023-01-04T13:30:00").toLocaleString(
    dateLocale,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );

  const portals = [
    {
      id: 1,
      name: "ONAPI",
      lastAccess: portalLastAccess,
    },
    {
      id: 2,
      name: t("portals.single_investment_window"),
      lastAccess: portalLastAccess,
    },
    {
      id: 3,
      name: t("portals.scholarship_portal"),
      lastAccess: portalLastAccess,
    },
    {
      id: 4,
      name: t("portals.public_health_ministry"),
      lastAccess: portalLastAccess,
    },
    {
      id: 5,
      name: t("portals.state_reform_council"),
      lastAccess: portalLastAccess,
    },
  ];

  const handleOpenUnlinkDeviceModal = (
    deviceId: string,
    deviceName: string,
  ) => {
    setUnlinkDeviceModal({
      isOpen: true,
      deviceName,
      deviceId,
      isLoading: false,
    });
  };

  const handleCloseUnlinkDeviceModal = () => {
    setUnlinkDeviceModal({
      isOpen: false,
      deviceName: "",
      deviceId: null,
      isLoading: false,
    });
  };

  const handleConfirmUnlinkDevice = () => {
    if (!unlinkDeviceModal.deviceId) return;

    setUnlinkDeviceModal((prev) => ({ ...prev, isLoading: true }));
    const toastId = toast.loading(t("unlinking_device"));

    sessionService
      .revokeSession(unlinkDeviceModal.deviceId)
      .then(() => {
        toast.success(t("device_unlinked_success"), { id: toastId });
        refreshSession();
        handleCloseUnlinkDeviceModal();
      })
      .catch(() => {
        toast.error(t("device_unlink_error"), { id: toastId });
      })
      .finally(() => {
        setUnlinkDeviceModal((prev) => ({ ...prev, isLoading: false }));
      });
  };

  const handleOpenUnlinkPortalModal = (
    portalId: number,
    portalName: string,
  ) => {
    setUnlinkPortalModal({
      isOpen: true,
      portalName,
      portalId,
      isLoading: false,
    });
  };

  const handleCloseUnlinkPortalModal = () => {
    setUnlinkPortalModal({
      isOpen: false,
      portalName: "",
      portalId: null,
      isLoading: false,
    });
  };

  const handleConfirmUnlinkPortal = () => {
    setUnlinkPortalModal((prev) => ({ ...prev, isLoading: true }));

    // TODO: replace with portalService.revokePortal() once the endpoint exists
    new Promise((resolve) => setTimeout(resolve, 2000))
      .then(() => handleCloseUnlinkPortalModal())
      .finally(() =>
        setUnlinkPortalModal((prev) => ({ ...prev, isLoading: false })),
      );
  };

  return (
    <div className="space-y-12 pb-12">
      <div className="space-y-4 pb-8 border-b dark:border-border">
        <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-12">
        <SecuritySection title={t("linked_devices")}>
          <div className="space-y-4">
            {devices.length > 0 ? (
              devices.map((device) => (
                <DeviceItem
                  key={device.id}
                  device={device.device}
                  ipAddress={device.ipAddress}
                  location={device.location}
                  lastAccess={device.lastAccess}
                  lastAccessRaw={device.lastAccessRaw}
                  expirationDate={device.expirationDate}
                  expirationDateRaw={device.expirationDateRaw}
                  status={device.status}
                  rawDeviceName={device.rawDeviceName}
                  coordinates={device.coordinates}
                  onUnlink={
                    device.isCurrentSession
                      ? undefined
                      : () =>
                        handleOpenUnlinkDeviceModal(device.id, device.device)
                  }
                />
              ))
            ) : (
              <div className="py-8 text-muted-foreground text-center border dark:border-border rounded-lg bg-card">
                {t("no_devices")}
              </div>
            )}
          </div>
        </SecuritySection>

        <SecuritySection title={t("institutional_portals")}>
          <div className="space-y-4">
            {portals.map((portal) => (
              <PortalItem
                key={portal.id}
                name={portal.name}
                lastAccess={portal.lastAccess}
                onUnlink={() =>
                  handleOpenUnlinkPortalModal(portal.id, portal.name)
                }
              />
            ))}
          </div>
        </SecuritySection>
      </div>

      <ConfirmationModal
        isOpen={unlinkDeviceModal.isOpen}
        onClose={handleCloseUnlinkDeviceModal}
        onConfirm={handleConfirmUnlinkDevice}
        title={t("unlink_device_title", {
          deviceName: unlinkDeviceModal.deviceName,
        })}
        description={t("unlink_device_description")}
        confirmText={t("unlink")}
        cancelText={t("cancel")}
        confirmVariant="destructive"
        isLoading={unlinkDeviceModal.isLoading}
      />

      <ConfirmationModal
        isOpen={unlinkPortalModal.isOpen}
        onClose={handleCloseUnlinkPortalModal}
        onConfirm={handleConfirmUnlinkPortal}
        title={t("unlink_portal_title", {
          portalName: unlinkPortalModal.portalName,
        })}
        description={t("unlink_portal_description")}
        confirmText={t("unlink")}
        cancelText={t("cancel")}
        confirmVariant="destructive"
        isLoading={unlinkPortalModal.isLoading}
      >
        <ul className="space-y-2 text-sm text-muted-foreground mt-4 mb-2 pl-4 border-l-2 border-primary/20 dark:border-primary/25 dark:text-white">
          <li>{t("unlink_portal_consequence_1")}</li>
          <li>{t("unlink_portal_consequence_2")}</li>
          <li>{t("unlink_portal_consequence_3")}</li>
        </ul>
      </ConfirmationModal>
    </div>
  );
}
