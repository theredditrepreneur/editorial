import Image from "next/image";

export default function ConfigurationRequired() {
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
      <section className="configuration-card">
        <span>DEPLOYMENT CONFIGURATION</span>
        <h1>Supabase needs connecting.</h1>
        <p>
          Add the main Redditrepreneur Supabase project values to this Vercel
          project, then redeploy. The newsroom remains closed until
          authentication is configured.
        </p>
        <code>NEXT_PUBLIC_SUPABASE_URL</code>
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
      </section>
    </main>
  );
}
