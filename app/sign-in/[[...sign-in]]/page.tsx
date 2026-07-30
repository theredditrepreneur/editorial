import { SignIn } from "@clerk/nextjs";

export default function SignInPage(){return <main className="sign-in-page"><div className="sign-in-brand"><div className="brand-mark">R</div><div><strong>THE REDDITREPRENEUR</strong><span>NEWSROOM</span></div></div><SignIn routing="path" path="/sign-in"/></main>}
