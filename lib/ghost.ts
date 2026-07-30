import { XMLParser } from "fast-xml-parser";
import type { Article } from "./articles";

const BLOG_URL =
  process.env.PUBLICATION_URL ??
  process.env.GHOST_BLOG_URL ??
  "https://blog.theredditrepreneur.com";
const knownFrameworks = [
  "Community Intelligence Stack",
  "Community Gravity",
  "Customer Insight Triangle",
  "Belief Correction",
  "Narrative Compression",
  "Trust Collapse",
  "Mission Premium",
  "Community Intelligence Scorecard",
];
type GhostPost = {
  title: string;
  url: string;
  published_at: string;
  excerpt?: string;
  tags?: Array<{ name: string }>;
};

function classifyIndustry(text: string) {
  const value = text.toLowerCase();
  if (/game|gaming|gta|xbox|playstation/.test(value)) return "Gaming";
  if (/sport|football|world cup|fifa/.test(value)) return "Sport";
  if (/ai|search|google|meta|technology/.test(value)) return "AI";
  if (/film|music|entertainment|tiktok|creator/.test(value))
    return "Entertainment";
  if (/saas|software|startup/.test(value)) return "SaaS";
  return "Consumer Brands";
}
function toArticle(post: GhostPost): Article {
  const tags = (post.tags ?? []).map((tag) => tag.name);
  const haystack = `${post.title} ${tags.join(" ")}`;
  const framework =
    knownFrameworks.find((item) =>
      haystack.toLowerCase().includes(item.toLowerCase()),
    ) ?? "Community Intelligence";
  return {
    title: post.title,
    industry: classifyIndustry(haystack),
    framework,
    status: "Published",
    distribution: "Awaiting distribution",
    date: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(post.published_at)),
    views: "—",
    lifecycle: 55,
    tags,
    url: post.url,
    summary: post.excerpt,
  };
}
async function fromContentApi(): Promise<Article[]> {
  const key = process.env.GHOST_CONTENT_API_KEY;
  if (!key) return [];
  const response = await fetch(
    `${BLOG_URL}/ghost/api/content/posts/?key=${encodeURIComponent(key)}&limit=all&include=tags&fields=title,url,published_at,excerpt`,
    { next: { revalidate: 300 } },
  );
  if (!response.ok)
    throw new Error(`Ghost Content API returned ${response.status}`);
  const body = (await response.json()) as { posts: GhostPost[] };
  return body.posts.map(toArticle);
}
async function fromRss(): Promise<Article[]> {
  const response = await fetch(`${BLOG_URL}/rss.xml`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Ghost RSS returned ${response.status}`);
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(
    await response.text(),
  ) as {
    rss: {
      channel: {
        item: Record<string, unknown> | Array<Record<string, unknown>>;
      };
    };
  };
  const raw = parsed.rss.channel.item;
  const items = Array.isArray(raw) ? raw : [raw];
  return items.map((item) => {
    const categories = Array.isArray(item.category)
      ? item.category.map(String)
      : item.category
        ? [String(item.category)]
        : [];
    return toArticle({
      title: String(item.title ?? "Untitled"),
      url: String(item.link ?? BLOG_URL),
      published_at: String(item.pubDate ?? new Date().toISOString()),
      excerpt: String(item.description ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 260),
      tags: categories.map((name) => ({ name })),
    });
  });
}
export async function getPublishedArticles(): Promise<Article[]> {
  if (process.env.GHOST_CONTENT_API_KEY) {
    try {
      const apiPosts = await fromContentApi();
      if (apiPosts.length) return apiPosts;
    } catch (error) {
      console.warn("Content API unavailable; using publication RSS", error);
    }
  }
  try {
    return await fromRss();
  } catch (error) {
    console.error("Unable to load publication feed", error);
    return [];
  }
}
