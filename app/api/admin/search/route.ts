import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const { supabase } = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  const like = `%${q}%`;
  const [clients, bookings, forms, contacts] = await Promise.all([
    supabase.from("clients").select("id,first_name,last_name,email,phone").or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`).limit(10),
    supabase.from("bookings").select("id,client_name,email,service_type,status").or(`client_name.ilike.${like},email.ilike.${like},service_type.ilike.${like},status.ilike.${like}`).limit(10),
    supabase.from("intake_forms").select("id,type,service_label,signature").or(`type.ilike.${like},service_label.ilike.${like},signature.ilike.${like}`).limit(10),
    supabase.from("contact_inquiries").select("id,name,email,subject").or(`name.ilike.${like},email.ilike.${like},subject.ilike.${like}`).limit(10)
  ]);
  return NextResponse.json({
    results: [
      ...(clients.data || []).map((r) => ({ ...r, result_type: "client" })),
      ...(bookings.data || []).map((r) => ({ ...r, result_type: "booking" })),
      ...(forms.data || []).map((r) => ({ ...r, result_type: "form" })),
      ...(contacts.data || []).map((r) => ({ ...r, result_type: "inquiry" }))
    ]
  });
}
