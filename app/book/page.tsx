import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { redirect } from "next/navigation";
import { squareConfigured } from "@/lib/square";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const auth = await createSupabaseServerClient();
  if (!auth) redirect("/login?next=/book");
  const { data: userData } = await auth.auth.getUser();
  if (!userData.user) redirect("/login?next=/book");
  const supabase = createSupabaseAdminClient();
  const [services, categories, client] = await Promise.all([
    supabase?.from("services").select("*, service_categories(name)").eq("is_active", true).order("sort_order"),
    supabase?.from("service_categories").select("*").eq("is_active", true).order("sort_order"),
    supabase?.from("clients").select("first_name,last_name,email,phone").or(`profile_id.eq.${userData.user.id},email.ilike.${userData.user.email}`).limit(1).maybeSingle()
  ]);
  return (
    <main className="booking-page">
      <div className="booking-hero">
        <p className="section-label">Book Online</p>
        <h1>Reserve Your Appointment</h1>
        <p>Choose a service, select a real open time, complete any required intake, and pay the 20% Square deposit unless a valid gift card/no-deposit code waives it.</p>
      </div>
      <BookingFlow services={services?.data || []} categories={categories?.data || []} client={client?.data || { email: userData.user.email }} squareEnabled={squareConfigured()} />
    </main>
  );
}
