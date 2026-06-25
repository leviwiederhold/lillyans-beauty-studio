"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";

// Topbar with search + Quick Add. Quick Add opens a working "Add Client" modal
// wired to the existing /api/admin/clients endpoint, plus shortcuts to other
// admin create flows.
export function AdminTopbar({ title }: { title: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | "menu" | "client">(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/admin/clients?q=${encodeURIComponent(q)}` : "/admin/clients");
  }

  async function addClient(fd: FormData) {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setSaving(false);
    if (res.ok) { setModal(null); router.refresh(); }
    else { const b = await res.json().catch(() => ({})); setMsg(b.error || "Could not add client."); }
  }

  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <form className="tb-search" onSubmit={submitSearch}>
          <i className="ti ti-search" />
          <input placeholder="Search clients, bookings…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <button className="tb-add" onClick={() => setModal("menu")}><i className="ti ti-plus" />Quick Add</button>
      </div>

      {modal === "menu" && (
        <Modal title={<>Quick <em>Add</em></>} onClose={() => setModal(null)}>
          <div className="qa-grid">
            <button className="qa-btn" onClick={() => { setModal(null); router.push("/admin/bookings"); }}><i className="ti ti-calendar-plus" />Add booking</button>
            <button className="qa-btn" onClick={() => { setMsg(""); setModal("client"); }}><i className="ti ti-user-plus" />Add client</button>
            <button className="qa-btn" onClick={() => { setModal(null); router.push("/admin/blocked-times"); }}><i className="ti ti-ban" />Block time</button>
            <button className="qa-btn" onClick={() => { setModal(null); router.push("/admin/services"); }}><i className="ti ti-plus" />Add service</button>
            <button className="qa-btn" onClick={() => { setModal(null); router.push("/admin/gift-cards"); }}><i className="ti ti-gift" />Gift cards</button>
            <button className="qa-btn" onClick={() => { setModal(null); router.push("/admin/business-hours"); }}><i className="ti ti-clock" />Edit hours</button>
          </div>
        </Modal>
      )}

      {modal === "client" && (
        <Modal
          title={<>Add <em>Client</em></>}
          onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="qa-add-client" disabled={saving}>{saving ? "Adding…" : "Add client"}</button>
          </>}
        >
          <form id="qa-add-client" action={addClient}>
            <div className="f-grid2">
              <div className="f-row"><label className="f-label">First name</label><input className="f-input" name="first_name" placeholder="Jane" required /></div>
              <div className="f-row"><label className="f-label">Last name</label><input className="f-input" name="last_name" placeholder="Smith" /></div>
            </div>
            <div className="f-row"><label className="f-label">Email</label><input className="f-input" name="email" type="email" placeholder="jane@email.com" /></div>
            <div className="f-row"><label className="f-label">Phone</label><input className="f-input" name="phone" type="tel" placeholder="(555) 000-0000" /></div>
            <div className="f-row" style={{ marginBottom: 0 }}><label className="f-label">Address</label><input className="f-input" name="address" placeholder="Street, City, State" /></div>
            {msg && <p style={{ color: "#c0392b", fontSize: 12, marginTop: 10 }}>{msg}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
