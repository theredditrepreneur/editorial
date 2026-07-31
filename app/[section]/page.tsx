import { notFound, redirect } from "next/navigation";
import Newsroom from "../newsroom";
import { getPublishedArticles } from "../../lib/ghost";
import { authConfigured } from "../../lib/auth-config";

const sections = {
  articles: "Articles",
  distribution: "Distribution",
  settings: "Settings",
} as const;
const removedSections = new Set([
  "industries",
  "frameworks",
  "performance",
  "repurpose",
  "editorial-calendar",
]);
export const dynamic = "force-dynamic";
export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (removedSections.has(section)) redirect("/");
  const page = sections[section as keyof typeof sections];
  if (!page) notFound();
  const articles = await getPublishedArticles();
  return (
    <Newsroom
      initialPage={page}
      sourceArticles={articles}
      authConfigured={authConfigured}
    />
  );
}
