"use client";

import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setMessage("Sending secure link…");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    setMessage(
      error ? error.message : "Check your email for the secure newsroom link.",
    );
    setSending(false);
  };

  return (
    <main className="sign-in-page">
      <div className="sign-in-brand">
        <Image
          src="/redditpreneur-logo.png"
          alt="The Redditrepreneur"
          width={250}
          height={108}
          priority
        />
        <span>PRIVATE NEWSROOM</span>
      </div>
      <form className="configuration-card" onSubmit={submit}>
        <span>EDITORIAL ACCESS</span>
        <h1>Enter the Newsroom.</h1>
        <p>
          Sign in securely to run The Redditrepreneur’s Community Intelligence
          publication.
        </p>
        <label>
          Email address
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="editor@theredditrepreneur.com"
          />
        </label>
        <button className="primary" type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send secure sign-in link"}
        </button>
        {message && <small role="status">{message}</small>}
      </form>
    </main>
  );
}
