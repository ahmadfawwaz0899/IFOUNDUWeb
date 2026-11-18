"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { ITEMS_TAG } from "@/lib/items-server";
import { isValidPhone, PHONE_ERROR } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

export type ClaimFormState = {
  error?: string;
  answers?: Record<string, string>;
  message?: string;
  phone?: string;
};

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

/** Owner says "this is mine" and answers the finder's questions. */
export async function submitClaim(
  _prev: ClaimFormState,
  formData: FormData
): Promise<ClaimFormState> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "Your session has ended. Please sign in again." };

  const itemId = String(formData.get("itemId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const { data: questions } = await supabase
    .from("verification_questions")
    .select("id")
    .eq("item_id", itemId);
  const answers: Record<string, string> = {};
  for (const q of questions ?? []) {
    answers[q.id] = String(formData.get(`answer-${q.id}`) ?? "").trim();
  }
  const keep = { answers, message, phone };

  if (!isValidPhone(phone)) return { ...keep, error: PHONE_ERROR };
  if (Object.values(answers).some((a) => a.length === 0))
    return { ...keep, error: "Please answer every question." };
  if (Object.values(answers).some((a) => a.length > 500))
    return { ...keep, error: "Answers can be at most 500 characters." };
  if (message.length > 500) return { ...keep, error: "Message can be at most 500 characters." };

  const { data: item } = await supabase
    .from("items")
    .select("reporter_id, is_resolved, status")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { ...keep, error: "This item no longer exists." };
  if (item.reporter_id === userId) return { ...keep, error: "You can't claim your own report." };
  if (item.is_resolved) return { ...keep, error: "This item has already been returned." };

  // Save the phone to the profile (private: only shared after the finder approves).
  await supabase
    .from("profile_contacts")
    .update({ phone, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  const { data: claim, error } = await supabase
    .from("claims")
    .insert({ item_id: itemId, claimant_id: userId, message: message || null })
    .select("id")
    .single();
  if (error || !claim) {
    return {
      ...keep,
      error:
        error?.code === "23505"
          ? "You've already claimed this item."
          : "Couldn't send your claim. Please try again.",
    };
  }

  const rows = Object.entries(answers).map(([question_id, answer]) => ({
    claim_id: claim.id,
    question_id,
    answer,
  }));
  if (rows.length > 0) {
    const { error: aError } = await supabase.from("claim_answers").insert(rows);
    if (aError) {
      await supabase.from("claims").delete().eq("id", claim.id);
      return { ...keep, error: "Couldn't save your answers. Please try again." };
    }
  }

  redirect(`/items/${itemId}?claimed=1`);
}

/** Finder approves or rejects a pending claim on their item. */
export async function decideClaim(claimId: string, decision: "approved" | "rejected") {
  const { supabase, userId } = await currentUserId();
  if (!userId) return;
  // Row Level Security only lets the item's finder change its claims.
  await supabase
    .from("claims")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("id", claimId)
    .eq("status", "pending");
  refresh();
}

/** Owner takes back a claim that hasn't been decided yet. */
export async function withdrawClaim(claimId: string) {
  const { supabase, userId } = await currentUserId();
  if (!userId) return;
  await supabase.from("claims").delete().eq("id", claimId).eq("claimant_id", userId).eq("status", "pending");
  refresh();
}

/** Finder confirms the item is back with its owner. */
export async function markReturned(itemId: string) {
  const { supabase, userId } = await currentUserId();
  if (!userId) return;

  const { data: updated } = await supabase
    .from("items")
    .update({ is_resolved: true })
    .eq("id", itemId)
    .eq("reporter_id", userId)
    .select("id");
  if (!updated?.length) return;

  // Anyone else still waiting is told no.
  await supabase
    .from("claims")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("item_id", itemId)
    .eq("status", "pending");

  updateTag(ITEMS_TAG); // take it off the Home page
  refresh();
}
