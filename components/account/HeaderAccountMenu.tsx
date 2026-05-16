"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MenuState = {
  signedIn: boolean;
  isAdmin: boolean;
};

export function HeaderAccountMenu() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<MenuState>({ signedIn: false, isAdmin: false });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setState({ signedIn: false, isAdmin: false });
      const profile = await supabase.from("profiles").select("role,is_admin").eq("id", data.user.id).maybeSingle();
      setState({ signedIn: true, isAdmin: profile.data?.role === "admin" || profile.data?.is_admin === true });
    });

    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <div className="account-menu" ref={ref}>
      <button className="account-menu-button" type="button" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.25" /><path d="M5.8 19.2c1.1-3.2 3.2-4.8 6.2-4.8s5.1 1.6 6.2 4.8" /></svg>
      </button>
      {open && (
        <div className="account-menu-panel">
          {!state.signedIn && (
            <>
              <a href="/login">Sign In</a>
              <a href="/signup">Create Account</a>
            </>
          )}
          {state.signedIn && !state.isAdmin && (
            <>
              <a href="/account">My Account</a>
              <a href="/account#bookings">My Bookings</a>
              <a href="/account#medical-forms">Medical Forms</a>
              <a href="/account#membership">Membership</a>
              <button type="button" onClick={signOut}>Sign Out</button>
            </>
          )}
          {state.signedIn && state.isAdmin && (
            <>
              <a href="/admin">Admin Dashboard</a>
              <a href="/account">My Account</a>
              <button type="button" onClick={signOut}>Sign Out</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
