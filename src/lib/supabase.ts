import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigured = Boolean(url && key);

let browserClient: SupabaseClient | null = null;

/** Browser client with a persisted auth session (login + dashboard). */
export function getBrowserSupabase(): SupabaseClient {
  if (!supabaseConfigured) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set");
  }
  browserClient ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return browserClient;
}

/** Stateless client used during `next build` (reads only published rows via RLS). */
export function getBuildSupabase(): SupabaseClient {
  if (!supabaseConfigured) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
