import { redirect } from "next/navigation";

// Canonical route is /admin/gift-cards (matches the admin UI spec).
export default function GiftCardInquiriesRedirect() {
  redirect("/admin/gift-cards");
}
