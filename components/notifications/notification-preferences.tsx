"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          {TOPICS.map((topic) => (
            <div key={topic} className="rounded-lg border p-4">
              <div className="mb-4">
                <h3 className="font-semibold">{t(`topics.${topic}.title`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`topics.${topic}.desc`)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                      className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm"
                    >
                      <span>
                        <span className="font-medium">
                          {t(`channels.${channel}`)}
                        </span>
                        {preference?.required ? (
                          <span className="block text-xs text-muted-foreground">
                            {t("required")}
                          </span>
                        ) : null}
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
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button disabled={isLoading || isSaving} onClick={savePreferences}>
              <Save data-icon="inline-start" />
              {isSaving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
