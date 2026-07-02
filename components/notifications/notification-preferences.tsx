"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/hooks/use-t";
import type {
  NotificationChannel,
  NotificationPreference,
  NotificationTopic,
} from "@/lib/notifications/types";
import { CUENTA_UNICA_NOTIFICATION_TOPICS } from "@/lib/notifications/types";
import { notificationService } from "@/lib/services/notifications/notification.service";

const TOPICS: readonly NotificationTopic[] = CUENTA_UNICA_NOTIFICATION_TOPICS;

const CHANNELS: NotificationChannel[] = ["portal", "email", "sms", "whatsapp"];

function getPreferenceKey(
  topic: NotificationTopic,
  channel: NotificationChannel,
) {
  return `${topic}:${channel}`;
}

export function NotificationPreferences() {
  const t = useT("notification_preferences");
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const preferenceMap = useMemo(
    () =>
      new Map(
        preferences.map((preference) => [
          getPreferenceKey(preference.topic, preference.channel),
          preference,
        ]),
      ),
    [preferences],
  );

  useEffect(() => {
    notificationService
      .getPreferences()
      .then((result) => setPreferences(result.preferences))
      .catch(() => toast.error(t("load_error")))
      .finally(() => setIsLoading(false));
  }, [t]);

  function updatePreference(
    topic: NotificationTopic,
    channel: NotificationChannel,
    enabled: boolean,
  ) {
    setPreferences((current) =>
      current.map((preference) =>
        preference.topic === topic && preference.channel === channel
          ? { ...preference, enabled }
          : preference,
      ),
    );
  }

  async function savePreferences() {
    setIsSaving(true);
    try {
      const result = await notificationService.updatePreferences(preferences);
      setPreferences(result.preferences);
      toast.success(t("save_success"));
    } catch {
      toast.error(t("save_error"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-primary dark:text-blue-400">
          {t("title")}
        </h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex flex-col gap-6">
        {TOPICS.map((topic) => (
          <div
            key={topic}
            className="pb-6 border-b dark:border-border last:border-0 last:pb-0"
          >
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-primary dark:text-blue-400">
                {t(`topics.${topic}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t(`topics.${topic}.desc`)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHANNELS.map((channel) => {
                const preference = preferenceMap.get(
                  getPreferenceKey(topic, channel),
                );
                const checked = preference?.enabled === true;
                const disabled =
                  isLoading || isSaving || preference?.required === true;

                return (
                  <div
                    key={channel}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">
                        {t(`channels.${channel}`)}
                        {preference?.required && (
                          <span
                            className="text-destructive ml-1"
                            title={t("required")}
                          >
                            *
                          </span>
                        )}
                      </span>
                      <Switch
                        aria-label={`${t(`topics.${topic}.title`)} - ${t(`channels.${channel}`)}`}
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={(nextValue) =>
                          updatePreference(topic, channel, nextValue)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <Button disabled={isLoading || isSaving} onClick={savePreferences}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
