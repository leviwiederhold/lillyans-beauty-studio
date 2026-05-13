"use client";

import { useState } from "react";

export function ClientProfileForm({ client }: { client: Record<string, any> }) {
  const [message, setMessage] = useState("");
  async function submit(fd: FormData) {
    setMessage("Saving...");
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries()))
    });
    setMessage(res.ok ? "Profile updated." : "Could not update profile.");
  }

  return (
    <section className="admin-card">
      <h2>Profile</h2>
      <form action={submit}>
        <div className="form-row"><label>First name<input name="first_name" defaultValue={client.first_name || ""} /></label><label>Last name<input name="last_name" defaultValue={client.last_name || ""} /></label></div>
        <div className="form-row"><label>Email<input name="email" type="email" defaultValue={client.email || ""} /></label><label>Phone<input name="phone" defaultValue={client.phone || ""} /></label></div>
        <label>Address<input name="address" defaultValue={client.address || ""} /></label>
        <label>Current medications<textarea name="medications" defaultValue={client.medications || ""}></textarea></label>
        <label>Known allergies<textarea name="allergies" defaultValue={client.allergies || ""}></textarea></label>
        <label>Skin conditions / sensitivities<textarea name="skin_conditions" defaultValue={client.skin_conditions || ""}></textarea></label>
        {message && <p className="admin-message">{message}</p>}
        <button className="btn-primary">Update Profile & Intake Info</button>
      </form>
    </section>
  );
}
