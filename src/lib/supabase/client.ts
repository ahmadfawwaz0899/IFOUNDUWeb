import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./env";

/** Supabase for code that runs in the browser ("use client" components). */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
