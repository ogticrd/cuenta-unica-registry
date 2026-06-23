"use client";

import {
  Book,
  Calendar,
  Hash,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
} from "lucide-react";

import { PersonalInfoField } from "@/components/dashboard/personal-info-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocale, useT } from "@/hooks/use-t";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_LOCALE } from "@/lib/constants/locales";

export function ProfileInfo() {
  const { user } = useAuth();
  const t = useT("profile");
  const locale = useLocale();
  const dateLocale = locale === DEFAULT_LOCALE ? "es-DO" : "en-US";

  if (!user) {
    return null;
  }

  const displayName =
    user.fullName?.trim() || `${user.name || ""} ${user.lastName || ""}`.trim();

  const normalizeValue = (value?: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : t("not_registered");
  };

  const formatGender = (gender?: string) => {
    const normalized = gender?.trim().toLowerCase();
    if (!normalized) return t("not_registered");

    if (["m", "male", "masculino", "hombre"].includes(normalized)) {
      return t("gender_male");
    }

    if (["f", "female", "femenino", "mujer"].includes(normalized)) {
      return t("gender_female");
    }

    if (
      ["other", "otro", "no_binario", "non_binary", "non-binary"].includes(
        normalized,
      )
    ) {
      return t("gender_other");
    }

    return gender || t("not_registered");
  };

  const formatBirthDate = (birthDate?: string) => {
    const normalized = birthDate?.trim();
    if (!normalized) return t("not_registered");

    const parsedDate = new Date(normalized);
    if (Number.isNaN(parsedDate.getTime())) return normalized;

    return parsedDate.toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b dark:border-border">
        <div className="relative">
          <Avatar className="w-24 h-24 text-4xl border border-border shadow-sm ring-4 ring-primary/10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-3xl">
              {displayName?.trim()?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="text-center md:text-left flex-1 pt-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {displayName}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-3 mt-3 text-muted-foreground">
            <span className="text-lg">
              {t("id_number")}: {normalizeValue(user.cedula)}
            </span>
            <span className="hidden md:inline text-border">•</span>
            <div className="flex items-center justify-center text-sm font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10 px-3 py-1 rounded-full w-max mx-auto md:mx-0 border border-green-200 dark:border-green-500/20">
              <Shield className="w-4 h-4 mr-1.5" />
              {t("identity_verified")}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-5 text-foreground flex items-center gap-2.5">
            <span className="inline-block w-1 h-5 rounded-full bg-primary"></span>
            {t("personal_information")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PersonalInfoField
              label={t("first_name")}
              value={normalizeValue(user.name)}
              icon={<User className="w-4 h-4 text-muted-foreground/70" />}
            />
            <PersonalInfoField
              label={t("last_name")}
              value={normalizeValue(user.lastName)}
              icon={<User className="w-4 h-4 text-muted-foreground/70" />}
            />
            <PersonalInfoField
              label={t("identity_card")}
              value={normalizeValue(user.cedula)}
              icon={<Hash className="w-4 h-4 text-muted-foreground/70" />}
            />
            <PersonalInfoField
              label={t("passport")}
              value={normalizeValue(user.passport)}
              icon={<Book className="w-4 h-4 text-muted-foreground/70" />}
            />
            <PersonalInfoField
              label={t("sex")}
              value={formatGender(user.gender)}
              icon={<Users className="w-4 h-4 text-muted-foreground/70" />}
            />
            <PersonalInfoField
              label={t("birth_date")}
              value={formatBirthDate(user.birthDate)}
              icon={<Calendar className="w-4 h-4 text-muted-foreground/70" />}
            />
            <PersonalInfoField
              label={t("nationality")}
              value={normalizeValue(user.nationality)}
              icon={<MapPin className="w-4 h-4 text-muted-foreground/70" />}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-5 text-foreground flex items-center gap-2.5">
            <span className="inline-block w-1 h-5 rounded-full bg-primary"></span>
            {t("contact_information")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PersonalInfoField
              label={t("email")}
              value={normalizeValue(user.email)}
              icon={<Mail className="w-4 h-4 text-muted-foreground/70" />}
              verified={true}
            />
            <PersonalInfoField
              label={t("phone")}
              value={normalizeValue(user.phone)}
              icon={<Phone className="w-4 h-4 text-muted-foreground/70" />}
            />
          </div>
        </div>
      </div>

      <div className="pt-8 border-t dark:border-border text-center mt-12">
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("official_records_note")}
        </p>
      </div>
    </div>
  );
}
