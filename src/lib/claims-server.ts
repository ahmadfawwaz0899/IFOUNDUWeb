import { ITEM_COLUMNS, type Item } from "@/lib/items";
import { createClient } from "@/lib/supabase/server";

export type ClaimStatus = "pending" | "approved" | "rejected";

export type Contact = { phone: string | null; email: string | null; preferred: string | null };

export type Question = { id: string; question: string };

/** A claim as the finder sees it on their own item. */
export type IncomingClaim = {
  id: string;
  status: ClaimStatus;
  message: string | null;
  created_at: string;
  claimantName: string;
  answers: Record<string, string>; // question id -> answer
  contact: Contact | null; // only after approval (enforced by the database)
};

/** The viewer's own claim on someone else's item. */
export type MyClaim = {
  id: string;
  status: ClaimStatus;
  created_at: string;
  finderName: string | null;
  finderContact: Contact | null; // only after approval (enforced by the database)
};

type ClaimRow = {
  id: string;
  status: ClaimStatus;
  message: string | null;
  created_at: string;
  claimant_id: string;
  claimant: { full_name: string | null } | null;
  claim_answers: { question_id: string; answer: string }[];
};

async function contactsFor(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, Contact>();
  const supabase = await createClient();
  // Row Level Security returns only people the viewer shares an approved claim with.
  const { data } = await supabase
    .from("profile_contacts")
    .select("user_id, phone, email, preferred")
    .in("user_id", userIds);
  return new Map((data ?? []).map((c) => [c.user_id as string, c as Contact]));
}

/** Everything the item page needs, shaped for whoever is looking at it. */
export async function getItemPageData(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = await createClient();
  const [{ data: item }, { data: questions }, { data: auth }] = await Promise.all([
    supabase.from("items").select(ITEM_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("verification_questions").select("id, question").eq("item_id", id).order("position"),
    supabase.auth.getClaims(),
  ]);
  if (!item) return null;

  const viewerId = auth?.claims?.sub ?? null;
  const it = item as Item;
  const isMine = viewerId === it.reporter_id;

  let incoming: IncomingClaim[] = [];
  let myClaim: MyClaim | null = null;

  if (isMine) {
    const { data } = await supabase
      .from("claims")
      .select(
        "id, status, message, created_at, claimant_id, claimant:profiles!claims_claimant_id_fkey(full_name), claim_answers(question_id, answer)"
      )
      .eq("item_id", id)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as ClaimRow[];
    const contacts = await contactsFor(
      rows.filter((r) => r.status === "approved").map((r) => r.claimant_id)
    );
    incoming = rows.map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      created_at: r.created_at,
      claimantName: r.claimant?.full_name || "IFoundU user",
      answers: Object.fromEntries(r.claim_answers.map((a) => [a.question_id, a.answer])),
      contact: contacts.get(r.claimant_id) ?? null,
    }));
  } else if (viewerId) {
    const { data } = await supabase
      .from("claims")
      .select("id, status, created_at")
      .eq("item_id", id)
      .eq("claimant_id", viewerId)
      .maybeSingle();
    if (data) {
      const approved = data.status === "approved";
      const [{ data: finder }, contacts] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", it.reporter_id).maybeSingle(),
        approved ? contactsFor([it.reporter_id]) : Promise.resolve(new Map<string, Contact>()),
      ]);
      myClaim = {
        id: data.id,
        status: data.status as ClaimStatus,
        created_at: data.created_at,
        finderName: finder?.full_name ?? null,
        finderContact: contacts.get(it.reporter_id) ?? null,
      };
    }
  }

  return {
    item: it,
    questions: (questions ?? []) as Question[],
    viewerId,
    isMine,
    incoming,
    myClaim,
  };
}

type ListClaimRow = {
  id: string;
  status: ClaimStatus;
  created_at: string;
  item: Pick<Item, "id" | "title" | "photo_path" | "category" | "is_sensitive" | "is_resolved" | "reporter_id">;
  claimant: { full_name: string | null } | null;
};

const LIST_SELECT =
  "id, status, created_at, item:items!inner(id, title, photo_path, category, is_sensitive, is_resolved, reporter_id), claimant:profiles!claims_claimant_id_fkey(full_name)";

/** Claims other people made on my items, and claims I made on theirs. */
export async function getMyClaimLists(userId: string) {
  const supabase = await createClient();
  const [incoming, outgoing] = await Promise.all([
    supabase
      .from("claims")
      .select(LIST_SELECT)
      .eq("item.reporter_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("claims")
      .select(LIST_SELECT)
      .eq("claimant_id", userId)
      .order("created_at", { ascending: false }),
  ]);
  return {
    incoming: (incoming.data ?? []) as unknown as ListClaimRow[],
    outgoing: (outgoing.data ?? []) as unknown as ListClaimRow[],
  };
}

/** How many claims on my items are waiting for me to review. */
export async function countPendingIncoming(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("claims")
    .select("id, item:items!inner(reporter_id)", { count: "exact", head: true })
    .eq("item.reporter_id", userId)
    .eq("status", "pending");
  return count ?? 0;
}

/** All items I reported, newest first. */
export async function getMyItems(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Item[];
}
