import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <span>THE REDDITREPRENEUR</span>
      <h1>Privacy policy</h1>
      <p>
        The Redditrepreneur Newsroom is a private editorial application operated
        by The Redditrepreneur. It uses account information only to authenticate
        authorised newsroom users and to connect social accounts that a user
        explicitly approves.
      </p>
      <h2>Connected platforms</h2>
      <p>
        When you approve a social connection, the provider returns an access
        token. Tokens are encrypted, stored in secure HTTP-only storage and used
        only for the editorial actions you request. The Newsroom does not
        receive or store your social-media password.
      </p>
      <h2>Data use</h2>
      <p>
        Account identifiers, publishing permissions, article metadata and
        distribution status may be processed to prepare, schedule and measure
        editorial distribution. Information is not sold.
      </p>
      <h2>Contact</h2>
      <p>Privacy enquiries can be sent to talkingwithtonte@gmail.com.</p>
      <Link href="/sign-in">Return to the Newsroom</Link>
    </main>
  );
}
