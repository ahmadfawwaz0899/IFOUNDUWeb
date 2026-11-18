import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  preferred: string | null;
};

/**
 * Returns the signed-in user, or null for guests.
 * Reads the login cookie, so call it inside a <Suspense> boundary.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims(); // verifies the login token
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", claims.sub).maybeSingle(),
    supabase
      .from("profile_contacts")
      .select("phone, preferred")
      .eq("user_id", claims.sub)
      .maybeSingle(),
  ]);

  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    fullName: profile?.full_name ?? null,
    phone: contact?.phone ?? null,
    preferred: contact?.preferred ?? null,
  };
}

/** How many items this user has reported, by status. */
export async function getMyItemCounts(userId: string) {
  const supabase = await createClient();
  const count = async (filter: "found" | "lost" | "returned") => {
    let q = supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", userId);
    q = filter === "returned" ? q.eq("is_resolved", true) : q.eq("status", filter);
    const { count } = await q;
    return count ?? 0;
  };
  const [found, lost, returned] = await Promise.all([
    count("found"),
    count("lost"),
    count("returned"),
  ]);
  return { found, lost, returned };
}
