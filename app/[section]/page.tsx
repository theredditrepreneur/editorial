import { notFound } from "next/navigation";
import Newsroom from "../newsroom";

const sections = { articles:"Articles", distribution:"Distribution", "editorial-calendar":"Editorial Calendar", industries:"Industries", frameworks:"Frameworks", performance:"Performance", repurpose:"Repurpose", settings:"Settings" } as const;
export default async function SectionPage({params}:{params:Promise<{section:string}>}){const {section}=await params;const page=sections[section as keyof typeof sections];if(!page)notFound();return <Newsroom initialPage={page}/>}
