import { cacheLife, cacheTag } from "next/cache";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { ITEM_COLUMNS, type Item } from "@/lib/items";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/** Tag for every cached list of items. Server actions call updateTag(ITEMS_TAG) after changes. */
export const ITEMS_TAG = "items";

/**
 * Latest found items for the Home page. Public data, so it is cached on the
 * server for a few minutes and refreshed instantly when someone reports an item.
 */
export async function getRecentFoundItems(limit = 6): Promise<Item[]> {
  "use cache";
  cacheTag(ITEMS_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return [];
  // No login cookies here: this list is the same for everyone.
  const supabase = createPublicClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  const { data } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("status", "found")
    .eq("is_resolved", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Item[] | null) ?? [];
}
