"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Active/inactive toggle for a service. Persists via /api/admin/services and
// refreshes so client booking availability reflects the change.
export function ServiceToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (saving) return;
    const next = !on;
    setOn(next); setSaving(true);
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: next }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
    else setOn(!next); // revert on failure
  }

  return <button type="button" className={`toggle${on ? " on" : ""}`} onClick={toggle} aria-label={on ? "Active" : "Hidden"} title={on ? "Active — click to hide" : "Hidden — click to activate"} />;
}
