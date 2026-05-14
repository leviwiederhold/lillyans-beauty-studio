"use client";

import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_BROWSER_ENV_ERROR = "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel or .env.local, then redeploy.";

export function getSupabaseBrowserEnvError() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return SUPABASE_BROWSER_ENV_ERROR;
  return null;
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(SUPABASE_BROWSER_ENV_ERROR);
  }

  return createBrowserClient(url, anonKey);
}
