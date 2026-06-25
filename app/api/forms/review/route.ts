import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

// Client confirms their existing intake/health info is still accurate ("Nothing
// has changed"). Stamps last_reviewed_at = now on their forms so the booking
// intake-currency gate treats them as current.
export async function POST() {
  try {
    const auth = await createSupabaseServerClient();
    const { data: userData } = auth ? await auth.auth.getUser() : { data: { user: null } };
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

    // Prefer service role; fall back to the session client (RLS allows a user to
    // update their own forms).
    const db = createSupabaseAdminClient() ?? auth;
    if (!db) return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });

    const nowIso = new Date().toISOString();
    const { error } = await db
      .from("client_forms")
      .update({ last_reviewed_at: nowIso })
      .eq("user_id", user.id);

    if (error) {
      console.error("[api/forms/review] update failed:", error);
      return NextResponse.json({ error: "Could not update your review. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, reviewed_at: nowIso });
  } catch (e) {
    console.error("[api/forms/review] unhandled error:", e);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
