// Loads the admin design system once for every /admin route. The stylesheet is
// fully scoped under .lbs-admin, so importing it here never affects the public site.
import "./admin-ui.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
