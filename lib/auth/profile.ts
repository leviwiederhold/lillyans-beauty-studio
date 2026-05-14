import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function upsertClientForUser(user: User, details: Record<string, unknown> = {}) {
  if (!user.email) return { error: "User email is missing." };

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const firstName = typeof details.first_name === "string" ? details.first_name : null;
  const lastName = typeof details.last_name === "string" ? details.last_name : null;
  const email = user.email.toLowerCase();
  const now = new Date().toISOString();

  const profilePayload = {
    id: user.id,
    email,
    full_name: [firstName, lastName].filter(Boolean).join(" ") || null,
    updated_at: now
  };

  const existingProfile = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  const profileResult = existingProfile.data
    ? await supabase.from("profiles").update(profilePayload).eq("id", user.id)
    : await supabase.from("profiles").insert({ ...profilePayload, role: "client", is_admin: false });
  if (profileResult.error) return { error: profileResult.error.message };

  const clientPayload = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: typeof details.phone === "string" ? details.phone : null,
    address: typeof details.address === "string" ? details.address : null,
    medications: typeof details.medications === "string" ? details.medications : null,
    allergies: typeof details.allergies === "string" ? details.allergies : null,
    skin_conditions: typeof details.skin_conditions === "string" ? details.skin_conditions : null,
    profile_id: user.id,
    updated_at: now
  };

  const existingClient = await supabase.from("clients").select("id").or(`profile_id.eq.${user.id},email.ilike.${email}`).limit(1).maybeSingle();
  const clientResult = existingClient.data
    ? await supabase.from("clients").update(clientPayload).eq("id", existingClient.data.id)
    : await supabase.from("clients").insert(clientPayload);
  if (clientResult.error) return { error: clientResult.error.message };

  return { ok: true };
}
