import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
export const metadata:Metadata={metadataBase:new URL("https://editorial.theredditrepreneur.com"),title:"The Redditrepreneur Newsroom",description:"The private editorial operating system for The Redditrepreneur.",icons:{icon:"/favicon.svg"},openGraph:{title:"The Redditrepreneur Newsroom",description:"Community Intelligence, in command.",images:["/og.png"]},twitter:{card:"summary_large_image",title:"The Redditrepreneur Newsroom",description:"Community Intelligence, in command.",images:["/og.png"]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
