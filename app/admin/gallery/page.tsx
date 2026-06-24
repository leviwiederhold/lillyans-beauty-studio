import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/ui/components";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type GalleryItem = { id: string; title: string; category: string; image_url: string; alt_text?: string | null; is_published?: boolean };

export default async function GalleryAdminPage() {
  const { supabase } = await requireAdmin();
  let items: GalleryItem[] = [];
  try {
    const res = await supabase?.from("gallery_items").select("*").order("sort_order").limit(200);
    items = (res?.data as GalleryItem[]) ?? [];
  } catch { items = []; }

  return (
    <AdminShell title="Gallery" eyebrow="Content">
      {items.length === 0 ? (
        <div className="card"><EmptyState icon="ti-photo" title={<>No photos <em>yet</em></>} sub="Gallery images you publish will appear here and on the public site." /></div>
      ) : (
        <div className="gallery-grid">
          {items.map((g) => (
            <div key={g.id} className="gal-card" title={g.title}>
              {g.image_url
                ? // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image_url} alt={g.alt_text || g.title || ""} />
                : <i className="ti ti-photo" />}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
