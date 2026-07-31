import Newsroom from "./newsroom";
import { getPublishedArticles } from "../lib/ghost";
import { authConfigured } from "../lib/auth-config";

export const dynamic = "force-dynamic";
export default async function Home() {
  const articles = await getPublishedArticles();
  return (
    <Newsroom
      initialPage="Articles"
      sourceArticles={articles}
      authConfigured={authConfigured}
    />
  );
}
