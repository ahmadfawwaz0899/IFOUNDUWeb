"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { categories, type CategoryId } from "@/lib/categories";
import { PHOTO_BUCKET } from "@/lib/items";
import { ITEMS_TAG } from "@/lib/items-server";
import { createClient } from "@/lib/supabase/server";

export type ReportState = { error?: string };

const CATEGORY_IDS = new Set<string>(categories.map((c) => c.id));

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createFoundItem(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Your session has ended. Please sign in again." };

  const title = text(formData, "title");
  const category = text(formData, "category");
  const description = text(formData, "description");
  const locationName = text(formData, "location");
  const happenedAt = text(formData, "happenedAt");
  const photoPath = text(formData, "photoPath");
  const isSensitive = formData.get("isSensitive") === "on";
  const questions = formData
    .getAll("question")
    .map((q) => String(q).trim())
    .filter(Boolean);

  // Remove the uploaded photo if we refuse the report, so no orphan files pile up.
  const fail = async (error: string): Promise<ReportState> => {
    if (photoPath.startsWith(`${userId}/`)) {
      await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
    }
    return { error };
  };

  if (!photoPath.startsWith(`${userId}/`)) return fail("Please add a photo of the item.");
  if (title.length < 2 || title.length > 120)
    return fail("Give the item a short name (2–120 characters).");
  if (!CATEGORY_IDS.has(category)) return fail("Please choose a category.");
  if (description.length > 1000) return fail("Description is too long (max 1000 characters).");
  if (locationName.length < 2) return fail("Tell us where you found it.");

  const when = new Date(happenedAt);
  if (Number.isNaN(when.getTime())) return fail("Please enter when you found it.");
  if (when.getTime() > Date.now() + 5 * 60 * 1000) return fail("The date can't be in the future.");

  if (questions.length < 1) return fail("Add at least one question only the owner could answer.");
  if (questions.length > 3) return fail("Use at most 3 questions.");
  if (questions.some((q) => q.length < 3 || q.length > 300))
    return fail("Each question should be 3–300 characters.");

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      reporter_id: userId,
      status: "found",
      category: category as CategoryId,
      title,
      description: description || null,
      location_name: locationName,
      happened_at: when.toISOString(),
      photo_path: photoPath,
      is_sensitive: isSensitive,
    })
    .select("id")
    .single();
  if (error || !item) return fail("Couldn't save the report. Please try again.");

  const { error: qError } = await supabase
    .from("verification_questions")
    .insert(questions.map((question, position) => ({ item_id: item.id, question, position })));
  if (qError) {
    await supabase.from("items").delete().eq("id", item.id);
    return fail("Couldn't save your questions. Please try again.");
  }

  updateTag(ITEMS_TAG); // show the new item on Home straight away
  redirect(`/items/${item.id}?new=1`);
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("photo_path")
    .eq("id", itemId)
    .maybeSingle();

  // Row Level Security only lets the person who reported it delete it,
  // so for anyone else this deletes nothing.
  const { data: deleted } = await supabase.from("items").delete().eq("id", itemId).select("id");
  if (deleted?.length && item?.photo_path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([item.photo_path]);
  }

  updateTag(ITEMS_TAG);
  redirect("/profile");
}
