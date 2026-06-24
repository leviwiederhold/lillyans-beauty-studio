import type { User } from "@supabase/supabase-js";

export const ADMIN_EMAILS = ["lillyansbeautystudio@gmail.com"];

type SupabaseAdmin = {
  from: (table: string) => any;
};

export function getSafeNextPath(nextParam: string | null | undefined, fallback = "/account") {
  if (!nextParam) return fallback;
  try {
    const decoded = decodeURIComponent(nextParam);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
    if (decoded.includes("\\") || decoded.includes("\n") || decoded.includes("\r")) return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}

export function isAdminEmail(email: string | null | undefined) {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}

export async function ensureProfileForUser(supabase: SupabaseAdmin, user: Pick<User, "id" | "email">) {
  const email = String(user.email || "").trim().toLowerCase();
  const admin = isAdminEmail(email);
  const profilePayload = {
    id: user.id,
    email,
    role: admin ? "admin" : "client",
    is_admin: admin,
    updated_at: new Date().toISOString()
  };

  const existing = await supabase.from("profiles").select("id,role,is_admin,full_name,email").eq("id", user.id).maybeSingle();
  if (existing.data) {
    const updatePayload = admin
      ? { email, role: "admin", is_admin: true, updated_at: profilePayload.updated_at }
      : { email, updated_at: profilePayload.updated_at };
    const updated = await supabase.from("profiles").update(updatePayload).eq("id", user.id).select("id,role,is_admin,full_name,email").single();
    return updated.data || { ...existing.data, ...updatePayload };
  }

  const inserted = await supabase
    .from("profiles")
    .insert({ ...profilePayload, full_name: null })
    .select("id,role,is_admin,full_name,email")
    .single();
  return inserted.data || profilePayload;
}

export function isAdminProfile(profile: { role?: string | null; is_admin?: boolean | null } | null | undefined) {
  return !!(profile?.is_admin || profile?.role === "admin");
}

export function isAccountPath(path: string) {
  return path === "/account" || path.startsWith("/account/");
}
