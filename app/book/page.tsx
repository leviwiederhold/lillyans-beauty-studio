import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const supabase = createSupabaseAdminClient();
  const [services, categories] = await Promise.all([
    supabase?.from("services").select("*, service_categories(name)").eq("is_active", true).order("sort_order"),
    supabase?.from("service_categories").select("*").eq("is_active", true).order("sort_order")
  ]);
  return (
    <main className="booking-page">
      <p className="section-label">Book Online</p>
      <h1>Choose Your Service</h1>
      <p>Request an appointment directly with Lillyan&apos;s Beauty Studio. Available times reflect studio hours, blocked-off dates, service duration, and existing appointments.</p>
      <BookingFlow services={services?.data || []} categories={categories?.data || []} />
    </main>
  );
}
