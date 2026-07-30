import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <span>THE REDDITREPRENEUR</span>
      <h1>Terms of service</h1>
      <p>
        The Redditrepreneur Newsroom is an internal publication operating
        system. Access is restricted to authorised users. Users remain
        responsible for reviewing editorial copy and confirming that every
        publication or social action complies with the relevant platform’s
        terms.
      </p>
      <p>
        Connected-platform access can be revoked at any time from the provider
        or by requesting deletion.
      </p>
      <Link href="/sign-in">Return to the Newsroom</Link>
    </main>
  );
}
