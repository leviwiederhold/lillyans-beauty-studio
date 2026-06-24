import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/AdminDataViews";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function GalleryAdminPage() {
  const { supabase } = await requireAdmin();
  const gallery = await supabase?.from("gallery_items").select("*").order("sort_order").limit(100);
  const rows = gallery?.data || [];

  return (
    <AdminShell title="Gallery" eyebrow="Content">
      <div className="filter-row">
        <div className="filter-pill active">All</div>
        {GALLERY_CATEGORIES.map((category) => <div className="filter-pill" key={category}>{category}</div>)}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" disabled><i className="ti ti-upload" style={{ fontSize: 13, marginRight: 5 }} />Upload photos</button>
      </div>
      {rows.length === 0 ? (
        <div className="card"><EmptyState title="No gallery photos yet" subtitle="Uploaded gallery images will appear here by category." icon="photo" /></div>
      ) : (
        <div className="gallery-grid">
          {rows.map((item) => (
            <div className="gal-card" key={item.id}>
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.alt_text || item.title || "Gallery image"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : <i className="ti ti-photo" />}
              <div className="gal-overlay">
                <button title="Edit" aria-label="Edit image"><i className="ti ti-edit" /></button>
                <button title="Delete" aria-label="Delete image"><i className="ti ti-trash" /></button>
              </div>
            </div>
          ))}
          <div className="gal-card" style={{ background: "var(--admin-bg)", border: "1.5px dashed var(--admin-border2)", cursor: "pointer" }}><i className="ti ti-plus" style={{ color: "var(--ink3)" }} /></div>
        </div>
      )}
    </AdminShell>
  );
}
