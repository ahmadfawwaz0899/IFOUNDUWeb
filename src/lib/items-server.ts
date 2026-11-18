import { cacheLife, cacheTag } from "next/cache";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { ITEM_COLUMNS, type Item } from "@/lib/items";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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

/** One item plus its verification questions, and whether the viewer reported it. */
export async function getItemWithQuestions(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = await createClient();
  const [{ data: item }, { data: questions }, { data: auth }] = await Promise.all([
    supabase.from("items").select(ITEM_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("verification_questions")
      .select("id, question")
      .eq("item_id", id)
      .order("position"),
    supabase.auth.getClaims(),
  ]);
  if (!item) return null;

  return {
    item: item as Item,
    questions: (questions ?? []) as { id: string; question: string }[],
    isMine: auth?.claims?.sub === (item as Item).reporter_id,
    isSignedIn: Boolean(auth?.claims?.sub),
  };
}
