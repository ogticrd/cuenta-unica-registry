import { formatDistanceToNowStrict } from "date-fns";
import { enUS, es } from "date-fns/locale";

export function getRelativeTime(
  date: Date | string | number | undefined | null,
  localeStr: string = "es"
): string {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const dateLocale = localeStr === "es" ? es : enUS;

  return formatDistanceToNowStrict(parsedDate, {
    addSuffix: true,
    locale: dateLocale,
  });
}

export const formatSessionDate = (value: string | undefined, fallback: string, dateLocale: string = "es") => {
  if (!value) return fallback;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return fallback;

  return parsedDate.toLocaleString(dateLocale);
};