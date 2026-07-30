"use client";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function ProfileMenu({ configured }: { configured: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Tonte Bo Douglas");
  const [role, setRole] = useState("Editor-in-Chief");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!configured) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      setName(
        String(
          data.user.user_metadata.full_name ??
            data.user.user_metadata.name ??
            "Tonte Bo Douglas",
        ),
      );
      setRole(String(data.user.user_metadata.role ?? "Editor-in-Chief"));
    });
  }, [configured]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    await supabase.auth.updateUser({ data: { full_name: name, role } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="profile-wrap">
      <button
        className="profile-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="avatar">{initials || "TD"}</span>
        <span>
          <strong>{name}</strong>
          <small>{role}</small>
        </span>
        <i>•••</i>
      </button>
      {open && (
        <form className="profile-popover" onSubmit={save}>
          <span>EDITOR PROFILE</span>
          <label>
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Role
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </label>
          <label>
            Email
            <input value={email} disabled />
          </label>
          <button className="primary" type="submit">
            {saved ? "Profile saved" : "Save profile"}
          </button>
          <Link href="/auth/signout">Sign out</Link>
        </form>
      )}
    </div>
  );
}
