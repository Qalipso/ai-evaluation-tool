import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key.
// MVP has no end-user auth (see roadmap.md), so all DB access is trusted
// server code. NEVER import this from a client component.

export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, serviceKey };
}

export function hasSupabase(): boolean {
  const { url, serviceKey } = getSupabaseEnv();
  return Boolean(url && serviceKey);
}

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). " +
        "Guard callers with hasSupabase().",
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
