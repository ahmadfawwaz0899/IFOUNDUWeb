import type { CategoryId } from "@/lib/categories";
import { supabaseUrl } from "@/lib/supabase/env";

/** One row of the `items` table, as the app uses it. */
export type Item = {
  id: string;
  reporter_id: string;
  status: "found" | "lost";
  category: CategoryId;
  title: string;
  description: string | null;
  location_name: string;
  happened_at: string;
  photo_path: string | null;
  is_sensitive: boolean;
  is_resolved: boolean;
  created_at: string;
};

/** Columns to select (never the big AI embedding column). */
export const ITEM_COLUMNS =
  "id, reporter_id, status, category, title, description, location_name, happened_at, photo_path, is_sensitive, is_resolved, created_at";

export const PHOTO_BUCKET = "item-photos";

export function photoUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

/** "5 minutes ago", "yesterday", "3 days ago"… */
export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/** Dates are shown in Malaysian time, even when the server runs elsewhere. */
export const APP_TIME_ZONE = "Asia/Kuala_Lumpur";

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
