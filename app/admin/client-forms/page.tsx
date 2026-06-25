import { redirect } from "next/navigation";

// Canonical route is /admin/intake-forms (matches the admin UI spec).
export default function ClientFormsRedirect() {
  redirect("/admin/intake-forms");
}
