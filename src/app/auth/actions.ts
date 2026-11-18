"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidPhone, PHONE_ERROR } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  error?: string;
  success?: string;
  /** Values to put back in the form after an error */
  fields?: Record<string, string>;
};

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

/** Turns Supabase's technical messages into plain English. */
function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first. Check your inbox for the link we sent.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password")) return message;
  return "Something went wrong. Please try again.";
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password.", fields: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message), fields: { email } };

  // Go back to the page that asked for sign-in (only pages on this site).
  const next = text(formData, "next");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/profile");
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = text(formData, "fullName");
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  const fields = { fullName, email };

  if (fullName.length < 2) return { error: "Please enter your name.", fields };
  if (!email.includes("@")) return { error: "Please enter a valid email.", fields };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters.", fields };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }, // saved to the profile by the sign-up trigger
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: friendly(error.message), fields };

  // If email confirmation is switched off in Supabase, the user is signed in straight away.
  if (data.session) redirect("/profile");

  return {
    success: `Almost done! We sent a confirmation link to ${email}. Open it on this device to finish creating your account.`,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/profile");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = text(formData, "fullName");
  const phone = text(formData, "phone");
  const preferred = text(formData, "preferred");

  if (fullName.length < 2) return { error: "Please enter your name." };
  if (phone && !isValidPhone(phone)) return { error: PHONE_ERROR };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Your session has ended. Please sign in again." };

  const [p, c] = await Promise.all([
    supabase.from("profiles").update({ full_name: fullName }).eq("id", userId),
    supabase
      .from("profile_contacts")
      .update({ phone: phone || null, preferred: preferred || null, updated_at: new Date().toISOString() })
      .eq("user_id", userId),
  ]);
  if (p.error || c.error) return { error: "Couldn't save your changes. Please try again." };

  refresh(); // re-render the page so the new name shows straight away
  return { success: "Saved." };
}
