import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const formSchema = z.object({
  userId:          z.string().uuid(),
  bookingId:       z.string().uuid().nullable().optional(),
  formType:        z.union([z.literal("pmu_intake"), z.literal("informed_consent"), z.literal("liability_waiver"), z.literal("confidential_intake")]),
  serviceCategory: z.string().optional(),
  serviceName:     z.string().optional(),
  submittedAt:     z.string().optional(),
  fields:          z.record(z.string(), z.unknown()).optional(),
  signature:       z.string().nullable().optional(),
  signature2:      z.string().nullable().optional(),
});

// Flatten zod field errors into a single readable sentence.
function readableValidation(err: z.ZodError) {
  const fieldErrors = err.flatten().fieldErrors as Record<string, string[] | undefined>;
  const parts = Object.entries(fieldErrors)
    .map(([field, msgs]) => `${field}: ${(msgs ?? []).join(", ")}`)
    .filter(Boolean);
  return parts.length ? parts.join("; ") : "Invalid form submission.";
}

// Postgres "undefined column" (42703) or PostgREST schema-cache miss (PGRST204)
// — i.e. the linkage migration hasn't been applied to this database yet.
function isUndefinedColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("column") && (m.includes("does not exist") || m.includes("schema cache"));
}

/**
 * Best-effort resolution of the caller's client row, creating it if missing.
 * Never throws — returns null on any failure so a missing client row can't
 * block saving the form (user_id is the canonical link).
 */
async function resolveClientId(db: SupabaseClient, userId: string, email: string | undefined): Promise<string | null> {
  try {
    const existing = await db
      .from("clients")
      .select("id")
      .or(email ? `profile_id.eq.${userId},email.ilike.${email}` : `profile_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();
    if (existing.data?.id) return existing.data.id as string;

    const inserted = await db
      .from("clients")
      .insert({ profile_id: userId, email: email ? email.toLowerCase() : null })
      .select("id")
      .single();
    if (inserted.error) {
      console.error("[api/forms] client upsert failed:", inserted.error);
      return null;
    }
    return inserted.data?.id ?? null;
  } catch (e) {
    console.error("[api/forms] client resolution threw:", e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // ── Auth: must be signed in ──────────────────────────────────────────────
    const auth = await createSupabaseServerClient();
    const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: "Please sign in to submit your intake form." }, { status: 401 });
    }

    // ── Body + validation ────────────────────────────────────────────────────
    const body = await request.json().catch(() => null);
    if (body == null) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const parsed = formSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: readableValidation(parsed.error) }, { status: 400 });
    }
    if (parsed.data.userId !== user.id) {
      return NextResponse.json({ error: "Session does not match the submitted form." }, { status: 403 });
    }

    // ── DB client: prefer service role; fall back to the authenticated session
    //    client (RLS policy clients_insert_own_forms permits self-inserts), so a
    //    missing service-role key can't take the whole flow down. ──────────────
    const db = (createSupabaseAdminClient() ?? auth) as SupabaseClient | null;
    if (!db) {
      console.error("[api/forms] no Supabase client available (missing env).");
      return NextResponse.json({ error: "Service temporarily unavailable. Please try again shortly." }, { status: 503 });
    }

    const clientId = await resolveClientId(db, user.id, user.email);
    const nowIso = new Date().toISOString();

    // Base columns that have always existed on client_forms.
    const base = {
      user_id:          user.id,
      booking_id:       parsed.data.bookingId ?? null,
      form_type:        parsed.data.formType,
      service_category: parsed.data.serviceCategory ?? null,
      service_name:     parsed.data.serviceName ?? null,
      submitted_at:     parsed.data.submittedAt ?? nowIso,
      fields:           parsed.data.fields ?? {},
      signature:        parsed.data.signature ?? null,
      signature2:       parsed.data.signature2 ?? null,
      reviewed:         false,
    };
    // Columns added by 20260518000600_client_forms_linkage.sql. Included when the
    // migration has been applied; if not, we retry without them so the form still
    // saves (self-healing across migration timing).
    const enriched = { ...base, client_id: clientId, status: "completed" };

    let insert = await db.from("client_forms").insert(enriched).select("id").single();
    if (insert.error && isUndefinedColumn(insert.error)) {
      console.warn("[api/forms] linkage columns absent (run migration 20260518000600); saving base payload.");
      insert = await db.from("client_forms").insert(base).select("id").single();
    }

    if (insert.error) {
      // Surface the exact Postgres error in the server logs (Vercel) for diagnosis,
      // but return a safe, readable message to the browser.
      console.error("[api/forms] client_forms insert failed:", {
        code: insert.error.code,
        message: insert.error.message,
        details: insert.error.details,
        hint: insert.error.hint,
        form_type: parsed.data.formType,
        user_id: user.id,
      });
      return NextResponse.json(
        { error: "We couldn't save your form. Please try again, and contact the studio if it keeps happening." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: insert.data.id });
  } catch (e) {
    // Last-resort guard: never let the route throw an unhandled 500.
    console.error("[api/forms] unhandled error:", e);
    return NextResponse.json({ error: "Unexpected error saving your form. Please try again." }, { status: 500 });
  }
}
