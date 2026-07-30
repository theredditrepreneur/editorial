import { notFound } from "next/navigation";
import Newsroom from "../newsroom";
import { getPublishedArticles } from "../../lib/ghost";
import { authConfigured } from "../../lib/auth-config";

const sections = { articles:"Articles", distribution:"Distribution", "editorial-calendar":"Editorial Calendar", industries:"Industries", frameworks:"Frameworks", performance:"Performance", repurpose:"Repurpose", settings:"Settings" } as const;
export const dynamic="force-dynamic";
export default async function SectionPage({params}:{params:Promise<{section:string}>}){const {section}=await params;const page=sections[section as keyof typeof sections];if(!page)notFound();const articles=await getPublishedArticles();return <Newsroom initialPage={page} sourceArticles={articles} authConfigured={authConfigured}/>}
