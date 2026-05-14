import { NextResponse } from "next/server";
import { upsertClientForUser } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function upsertClient(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!data.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const result = await upsertClientForUser(data.user, body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  return upsertClient(request);
}

export async function PATCH(request: Request) {
  return upsertClient(request);
}
