"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ProfileMenu from "./profile-menu";
import type { Article } from "../lib/articles";

type Page =
  "Dashboard" | "Articles" | "Distribution" | "Editorial Calendar" | "Settings";

const nav: { name: Page; icon: string }[] = [
  { name: "Dashboard", icon: "⌂" },
  { name: "Articles", icon: "▤" },
  { name: "Distribution", icon: "↗" },
  { name: "Editorial Calendar", icon: "□" },
  { name: "Settings", icon: "⚙" },
];
const fallbackArticles: Article[] = [
  {
    title: "Publication feed temporarily unavailable",
    industry: "Community Intelligence",
    framework: "Community Intelligence Stack",
    status: "Published",
    distribution: "Not started",
    date: "30 Jul 2026",
    views: "—",
    lifecycle: 0,
    tags: [],
    summary:
      "The newsroom could not reach the publication feed. Refresh to try again.",
  },
];
const industries = [
  { name: "Gaming", count: 18, color: "#f26a2e" },
  { name: "AI", count: 14, color: "#4361a6" },
  { name: "Sport", count: 11, color: "#0c7767" },
  { name: "Consumer Brands", count: 9, color: "#b34d6f" },
  { name: "Entertainment", count: 8, color: "#7c58a5" },
  { name: "SaaS", count: 7, color: "#b78520" },
];
const paths: Record<Page, string> = {
  Dashboard: "/",
  Articles: "/articles",
  Distribution: "/distribution",
  "Editorial Calendar": "/editorial-calendar",
  Settings: "/settings",
};
export default function Newsroom({
  initialPage = "Dashboard",
  sourceArticles = [],
  authConfigured = true,
}: {
  initialPage?: Page;
  sourceArticles?: Article[];
  authConfigured?: boolean;
}) {
  const articles = sourceArticles.length ? sourceArticles : fallbackArticles;
  const [page, setPage] = useState<Page>(initialPage);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(articles[0]);
  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setPage("Distribution");
    setMobile(false);
    const key = article.url
      ? encodeURIComponent(article.url)
      : encodeURIComponent(article.title);
    window.history.pushState({}, "", `${paths.Distribution}?article=${key}`);
  };
  const go = (p: Page) => {
    setPage(p);
    setMobile(false);
    window.history.pushState({}, "", paths[p]);
  };
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "article",
    );
    if (requested) {
      const match = articles.find(
        (article) => article.url === requested || article.title === requested,
      );
      if (match) queueMicrotask(() => setSelectedArticle(match));
    }
    const onPop = () => {
      const found = (Object.entries(paths).find(
        ([, v]) => v === window.location.pathname,
      )?.[0] || "Dashboard") as Page;
      setPage(found);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [articles]);
  return (
    <div className="app-shell">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <Image
            src="/redditpreneur-logo.png"
            alt="The Redditrepreneur"
            width={210}
            height={92}
            priority
          />
          <span>NEWSROOM</span>
        </div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.name}
              className={page === n.name ? "active" : ""}
              onClick={() => go(n.name)}
            >
              <i>{n.icon}</i>
              {n.name}
            </button>
          ))}
        </nav>
        <div className="desk-status">
          <span className="live-dot" />
          NEWSROOM LIVE<strong>Thursday, 30 July</strong>
        </div>
        <ProfileMenu configured={authConfigured} />
      </aside>
      {mobile && (
        <button
          className="scrim"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <main>
        <header>
          <button className="menu" onClick={() => setMobile(true)}>
            ☰
          </button>
          <div className="breadcrumbs">
            <span>Newsroom</span>
            <b>/</b>
            {page}
          </div>
          <div className="header-actions">
            <button className="search" onClick={() => go("Articles")}>
              ⌕ <span>Search newsroom</span>
              <kbd>⌘ K</kbd>
            </button>
            <button className="notify">●</button>
            <button
              className="primary"
              onClick={() => window.location.reload()}
            >
              ↻ Sync publication
            </button>
          </div>
        </header>
        <section className="content">
          {page === "Dashboard" && (
            <Dashboard go={go} articles={articles} open={openArticle} />
          )}{" "}
          {page === "Articles" && (
            <Articles
              articles={articles}
              query={query}
              setQuery={setQuery}
              open={openArticle}
            />
          )}{" "}
          {page === "Distribution" && (
            <Distribution
              key={selectedArticle.url || selectedArticle.title}
              article={selectedArticle}
            />
          )}{" "}
          {page === "Editorial Calendar" && <Calendar articles={articles} />}{" "}
          {page === "Settings" && <Settings />}
        </section>
      </main>
    </div>
  );
}

function Title({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      {eyebrow && <span>{eyebrow}</span>}
      <div>
        <div>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
function Dashboard({
  go,
  articles,
  open,
}: {
  go: (p: Page) => void;
  articles: Article[];
  open: (article: Article) => void;
}) {
  const latest = articles[0];
  const coverage = industries.map((desk) => ({
    ...desk,
    count: articles.filter((article) => article.industry === desk.name).length,
  }));
  return (
    <>
      <Title
        eyebrow="EDITORIAL COMMAND CENTRE"
        title="Good morning, Editor."
        sub={`${articles.length} live intelligence reports are available in the newsroom.`}
        action={
          <button className="secondary" onClick={() => go("Articles")}>
            Open intelligence library →
          </button>
        }
      />
      <div className="brief">
        <div>
          <span className="pulse" />
          <b>TODAY’S PUBLICATION SUMMARY</b>
        </div>
        <strong>
          {articles.length} published reports · Publication feed synchronised
        </strong>
        <p>
          {latest.title} is the latest report and is ready for distribution.
        </p>
      </div>
      <div className="stats">
        {[
          [
            "Published reports",
            String(articles.length),
            "Live publication archive",
          ],
          ["Drafts", "0", "No draft source connected"],
          [
            "Distribution tracker",
            String(articles.length),
            "Check each report",
          ],
          ["Scheduled", "0", "No schedules yet"],
          ["Latest publication", latest.date, latest.industry],
          ["Website views", "—", "Analytics not connected"],
        ].map((s, i) => (
          <div className="stat" key={s[0]}>
            <span>{s[0]}</span>
            <strong>{s[1]}</strong>
            <small className={i === 2 ? "warn" : ""}>{s[2]}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="panel latest">
          <div className="panel-head">
            <div>
              <h2>Latest articles</h2>
              <p>Live from blog.theredditrepreneur.com</p>
            </div>
            <button onClick={() => go("Articles")}>View all →</button>
          </div>
          <ArticleTable articles={articles} compact open={open} />
        </div>
        <div className="panel coverage">
          <div className="panel-head">
            <div>
              <h2>Industry coverage</h2>
              <p>Articles published this quarter</p>
            </div>
          </div>
          {coverage.map((x) => (
            <div className="coverage-row" key={x.name}>
              <span className="dot" style={{ background: x.color }} />
              <b>{x.name}</b>
              <div>
                <i
                  style={{
                    width: `${Math.min(100, x.count * 8)}%`,
                    background: x.color,
                  }}
                />
              </div>
              <strong>{x.count}</strong>
            </div>
          ))}
          <footer>
            <b>{articles.length}</b>
            <span>Total intelligence reports</span>
          </footer>
        </div>
      </div>
      <Workflow />
    </>
  );
}
function Workflow() {
  const steps = [
    "Published",
    "Create in Buffer",
    "Post",
    "Tick off",
    "Complete",
  ];
  return (
    <div className="panel workflow">
      <div className="panel-head">
        <div>
          <h2>The publication workflow</h2>
          <p>From live article to completed social distribution</p>
        </div>
        <span>EDITORIAL OPERATING SYSTEM</span>
      </div>
      <div className="workflow-steps">
        {steps.map((x, i) => (
          <div key={x} className={i === 1 ? "current" : ""}>
            <i>{i + 1}</i>
            <b>{x}</b>
            {i < steps.length - 1 && <em>→</em>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleTable({
  articles,
  compact = false,
  open,
}: {
  articles: Article[];
  compact?: boolean;
  open: (a: Article) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Headline</th>
            <th>Industry</th>
            <th>Status</th>
            <th>Distribution</th>
            <th>{compact ? "Published" : "Date"}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {articles.slice(0, compact ? 4 : 9).map((a) => (
            <tr key={a.title}>
              <td>
                <strong>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer">
                      {a.title}
                    </a>
                  ) : (
                    a.title
                  )}
                </strong>
                <small>{a.framework}</small>
              </td>
              <td>
                <span className="industry">{a.industry}</span>
              </td>
              <td>
                <span className={`status ${a.status.toLowerCase()}`}>
                  ● {a.status}
                </span>
              </td>
              <td>
                <DistributionStatus article={a} />
              </td>
              <td>{a.date}</td>
              <td>
                <button className="row-action" onClick={() => open(a)}>
                  {a.status === "Published" ? "Open distribution" : "Open"} →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DistributionStatus({ article }: { article: Article }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(
          `newsroom-distribution:${article.url || article.title}`,
        );
        const saved = raw
          ? (JSON.parse(raw) as { completed?: Record<string, boolean> })
          : null;
        setCount(Object.values(saved?.completed || {}).filter(Boolean).length);
      } catch {
        setCount(0);
      }
    });
  }, [article.title, article.url]);
  if (count === null) return <span className="muted">Loading…</span>;
  return (
    <span className={count ? "progress" : "muted"}>
      {count === 8
        ? "Complete"
        : count
          ? `${count} of 8 posted`
          : "Not started"}
    </span>
  );
}
function Articles({
  articles,
  query,
  setQuery,
  open,
}: {
  articles: Article[];
  query: string;
  setQuery: (v: string) => void;
  open: (a: Article) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("All");
  const filtered = useMemo(
    () =>
      articles.filter(
        (a) =>
          (statusFilter === "All" || a.status === statusFilter) &&
          Object.values(a)
            .flat()
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [articles, query, statusFilter],
  );
  return (
    <>
      <Title
        eyebrow="INTELLIGENCE LIBRARY"
        title="Articles"
        sub="Manage every report from first signal through archive."
        action={
          <button className="primary" onClick={() => window.location.reload()}>
            ↻ Sync publication
          </button>
        }
      />
      <div className="tabs">
        <button
          className={statusFilter === "All" ? "active" : ""}
          onClick={() => setStatusFilter("All")}
        >
          All <b>{articles.length}</b>
        </button>
        {["Idea", "Research", "Draft", "Ready", "Published", "Archived"].map(
          (x) => (
            <button
              className={statusFilter === x ? "active" : ""}
              onClick={() => setStatusFilter(x)}
              key={x}
            >
              {x}{" "}
              <b>{articles.filter((article) => article.status === x).length}</b>
            </button>
          ),
        )}
      </div>
      <div className="toolbar">
        <label>
          ⌕
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headline, framework or tag…"
          />
        </label>
        <span>{filtered.length} articles</span>
      </div>
      <div className="panel">
        <ArticleTable articles={filtered} open={open} />
      </div>
    </>
  );
}

function Distribution({ article }: { article: Article }) {
  const trackingChannels = [
    "LinkedIn Personal",
    "LinkedIn Company",
    "Facebook",
    "Instagram",
    "X",
    "Threads",
    "Bluesky",
    "Newsletter",
  ];
  const storageKey = `newsroom-distribution:${article.url || article.title}`;
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            completed?: Record<string, boolean>;
            updatedAt?: string;
          };
          setCompleted(parsed.completed || {});
          setUpdatedAt(parsed.updatedAt || null);
        } else {
          setCompleted({});
          setUpdatedAt(null);
        }
      } catch {
        setCompleted({});
      }
      setReady(true);
    });
  }, [storageKey]);

  const toggleChannel = (channel: string) => {
    const next = { ...completed, [channel]: !completed[channel] };
    const savedAt = new Date().toISOString();
    setCompleted(next);
    setUpdatedAt(savedAt);
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ completed: next, updatedAt: savedAt }),
    );
  };
  const completedCount = trackingChannels.filter(
    (channel) => completed[channel],
  ).length;
  const progress = Math.round((completedCount / trackingChannels.length) * 100);

  return (
    <>
      <Title
        eyebrow="DISTRIBUTION TRACKER"
        title={article.title}
        sub={`${article.industry} · Published ${article.date}`}
        action={
          <div className="tracker-actions">
            {article.url && (
              <a
                className="button secondary"
                href={article.url}
                target="_blank"
                rel="noreferrer"
              >
                View article ↗
              </a>
            )}
            <a
              className="button primary"
              href="https://publish.buffer.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open Buffer ↗
            </a>
          </div>
        }
      />
      <div className="distribution-head tracker-head">
        <div className="hero-preview">
          <div className="halo">{article.title}</div>
          <small>THE REDDITREPRENEUR</small>
        </div>
        <div>
          <span className="status published">● Live on publication</span>
          <h3>Distribution progress</h3>
          <div className="big-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <p>
            <b>
              {completedCount} of {trackingChannels.length} complete
            </b>{" "}
            · {progress}% distributed
          </p>
        </div>
        <div className="lifecycle">
          <span>Last checklist update</span>
          <b>
            {updatedAt
              ? new Date(updatedAt).toLocaleDateString("en-GB")
              : "Not started"}
          </b>
          <p>Post through Buffer, then tick off each destination here.</p>
        </div>
      </div>
      <div className="panel distribution-tracker">
        <div className="tracker-intro">
          <div>
            <span className="overline">MANUAL DISTRIBUTION CHECKLIST</span>
            <h2>Where has this article been posted?</h2>
            <p>
              Tick a platform only after its post is live. Every article keeps
              its own checklist.
            </p>
          </div>
          {completedCount === trackingChannels.length && (
            <strong className="tracker-complete">
              ✓ Distribution complete
            </strong>
          )}
        </div>
        <div className="tracker-grid">
          {trackingChannels.map((channel) => (
            <label
              className={
                completed[channel] ? "tracker-item complete" : "tracker-item"
              }
              key={channel}
            >
              <input
                type="checkbox"
                checked={Boolean(completed[channel])}
                disabled={!ready}
                onChange={() => toggleChannel(channel)}
              />
              <span className="tracker-check">
                {completed[channel] ? "✓" : ""}
              </span>
              <span>
                <b>{channel}</b>
                <small>
                  {completed[channel]
                    ? "Posted and checked off"
                    : "Awaiting distribution"}
                </small>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="tracker-note">
        <b>Buffer is now your publishing system.</b>
        <span>
          The Newsroom only tracks coverage and never connects to or publishes
          on social accounts.
        </span>
      </div>
    </>
  );
}

/* Legacy direct-publishing interface removed in favour of Buffer tracking.
function LegacyDistribution({ article }: { article: Article }) {
  const [texts, setTexts] = useState(() => buildDistributionCopy(article));
  const [tab, setTab] = useState(channels[0]);
  const [notice, setNotice] = useState("");
  const [media, setMedia] = useState<
    Array<{ name: string; type: string; preview: string; url?: string }>
  >([]);
  const [publishing, setPublishing] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "LinkedIn Personal": true,
    "LinkedIn Company": true,
    Instagram: true,
    "Facebook Page": true,
    X: true,
  });
  const addMedia = async (files: FileList | null) => {
    if (!files?.length) return;
    const maximum = tab === "X" ? 4 : tab === "Instagram" ? 10 : 10;
    const selected = Array.from(files).slice(0, maximum);
    setNotice(
      `Uploading ${selected.length} media file${selected.length === 1 ? "" : "s"}…`,
    );
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const uploaded = [] as Array<{
      name: string;
      type: string;
      preview: string;
      url?: string;
    }>;
    for (const file of selected) {
      const preview = URL.createObjectURL(file);
      const signResponse = await fetch("/api/media/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) {
        setNotice(signed.error || "Media upload could not start.");
        return;
      }
      const { error } = await supabase.storage
        .from(signed.bucket)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type,
        });
      if (error) {
        setNotice(error.message);
        return;
      }
      uploaded.push({
        name: file.name,
        type: file.type,
        preview,
        url: signed.publicUrl,
      });
    }
    setMedia(uploaded);
    setNotice(
      `${uploaded.length} media file${uploaded.length === 1 ? "" : "s"} ready`,
    );
  };
  const publish = async (platform: string) => {
    try {
      setPublishing(true);
      setNotice(`Publishing to ${platform}…`);
      const response = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform,
          text: texts[platform],
          media: media.map((item) => ({ url: item.url, type: item.type })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotice(
          `Could not publish to ${platform}: ${result.error || "Provider rejected the post."}`,
        );
        return;
      }
      setNotice(
        `${platform} post published successfully${result.url ? ` · ${result.url}` : ""}`,
      );
    } catch (error) {
      setNotice(
        `Could not publish to ${platform}: ${error instanceof Error ? error.message : "Network request failed."}`,
      );
    } finally {
      setPublishing(false);
    }
  };
  const publishSelected = async () => {
    const selected = channels.filter(
      (channel) =>
        enabled[channel] &&
        [
          "X",
          "Facebook Page",
          "Instagram",
          "LinkedIn Personal",
          "LinkedIn Company",
        ].includes(channel),
    );
    if (!selected.length) {
      setNotice("Select X, Facebook Page or Instagram to publish.");
      return;
    }
    setPublishing(true);
    const results: string[] = [];
    for (const platform of selected) {
      try {
        const response = await fetch("/api/social/publish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            platform,
            text: texts[platform],
            media: platform.startsWith("LinkedIn")
              ? []
              : media.map((item) => ({ url: item.url, type: item.type })),
          }),
        });
        const result = await response.json();
        results.push(
          response.ok
            ? `${platform}: published`
            : `${platform}: ${result.error || "failed"}`,
        );
      } catch (error) {
        results.push(
          `${platform}: ${error instanceof Error ? error.message : "network request failed"}`,
        );
      }
    }
    setPublishing(false);
    setNotice(results.join(" · "));
  };
  return (
    <>
      <Title
        eyebrow="DISTRIBUTION DESK"
        title={article.title}
        sub={`${article.industry} Community Intelligence · Published ${article.date}`}
        action={
          article.url ? (
            <a
              className="button secondary"
              href={article.url}
              target="_blank"
              rel="noreferrer"
            >
              ↗ View live article
            </a>
          ) : undefined
        }
      />
      <div className="distribution-head">
        <div className="hero-preview">
          <div className="halo">{article.title}</div>
          <small>THEREDDITREPRENEUR.COM</small>
        </div>
        <div>
          <span className="status published">● Published</span>
          <h3>Distribution progress</h3>
          <div className="big-progress">
            <i style={{ width: "72%" }} />
          </div>
          <p>
            <b>{Object.values(enabled).filter(Boolean).length} channels</b>{" "}
            selected · {notice || "Drafts are ready"}
          </p>
        </div>
        <div className="lifecycle">
          <span>Article lifecycle</span>
          <b>Distribution</b>
          <p>Performance tracking begins when the first post goes live.</p>
        </div>
      </div>
      <div className="distribution-layout">
        <div className="channel-list panel">
          <h3>Social channels</h3>
          {channels.map((c) => (
            <button
              className={tab === c ? "selected" : ""}
              onClick={() => setTab(c)}
              key={c}
            >
              <span className="channel-icon">{c[0]}</span>
              <div>
                <b>{c}</b>
                <small>{c === "X" ? "Draft ready" : "Copy ready"}</small>
              </div>
              <i
                onClick={(e) => {
                  e.stopPropagation();
                  setEnabled({ ...enabled, [c]: !enabled[c] });
                }}
                className={enabled[c] ? "toggle on" : "toggle"}
              />
            </button>
          ))}
          <button>
            <span className="channel-icon">◎</span>
            <div>
              <b>
                Threads <em>SOON</em>
              </b>
              <small>Not available</small>
            </div>
            <i className="toggle" />
          </button>
          <button>
            <span className="channel-icon">B</span>
            <div>
              <b>
                Bluesky <em>SOON</em>
              </b>
              <small>Not available</small>
            </div>
            <i className="toggle" />
          </button>
          <div className="newsletter">
            <input type="checkbox" defaultChecked />
            <div>
              <b>Weekly newsletter</b>
              <small>Include in next edition</small>
            </div>
          </div>
        </div>
        <div className="copy-editor panel">
          <div className="editor-head">
            <div>
              <span className="channel-icon">{tab[0]}</span>
              <div>
                <h2>{tab}</h2>
                <p>Platform-specific copy · Saved independently</p>
              </div>
            </div>
            <button
              onClick={() => {
                setTexts({
                  ...texts,
                  [tab]: buildDistributionCopy(article)[tab],
                });
                setNotice(`${tab} copy regenerated`);
              }}
            >
              ✦ Generate version
            </button>
          </div>
          <textarea
            value={texts[tab]}
            onChange={(e) => setTexts({ ...texts, [tab]: e.target.value })}
          />
          <div className="media-uploader">
            <div>
              <b>Images and video</b>
              <small>
                {tab === "X"
                  ? "Up to 4 images"
                  : tab === "Instagram"
                    ? "1–10 images or videos"
                    : "Add images or one video"}
              </small>
            </div>
            <label className="button secondary">
              ＋ Add media
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={(event) => addMedia(event.target.files)}
              />
            </label>
          </div>
          {media.length > 0 && (
            <div className="media-preview-grid">
              {media.map((item, index) => (
                <div key={`${item.name}-${index}`}>
                  {item.type.startsWith("video/") ? (
                    <video src={item.preview} controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview} alt={item.name} />
                  )}
                  <button
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      setMedia(media.filter((_, i) => i !== index))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="counter">
            <span>Auto-saved just now</span>
            <b className={texts[tab].length > 280 && tab === "X" ? "over" : ""}>
              {texts[tab].length} / {tab === "X" ? 280 : 3000}
            </b>
          </div>
          <div className="editor-actions">
            <button onClick={() => setNotice(`${tab} preview is ready`)}>
              Preview
            </button>
            <button
              onClick={() =>
                setNotice("Connect this channel in Settings before scheduling")
              }
            >
              Schedule
            </button>
            <button
              className="primary"
              disabled={publishing}
              onClick={() => publish(tab)}
            >
              {publishing ? "Publishing…" : `Publish to ${tab}`}
            </button>
          </div>
        </div>
      </div>
      <div className="master-bar">
        <div>
          <span>MASTER CONTROLS</span>
          <b>
            {Object.values(enabled).filter(Boolean).length} platforms selected
          </b>
        </div>
        <button
          onClick={() =>
            setNotice("All platform drafts saved for this session")
          }
        >
          Save drafts
        </button>
        <button
          onClick={() => {
            setTexts(buildDistributionCopy(article));
            setNotice("All platform copy regenerated");
          }}
        >
          ✦ Regenerate all copy
        </button>
        <button
          onClick={() =>
            setNotice("Connect platforms in Settings before scheduling")
          }
        >
          Schedule all
        </button>
        <button
          className="primary"
          disabled={publishing}
          onClick={publishSelected}
        >
          {publishing ? "Publishing…" : "Publish selected platforms ↗"}
        </button>
      </div>
      {notice && (
        <div className="publish-toast" role="status" aria-live="polite">
          <span>
            {publishing
              ? "●"
              : notice.toLowerCase().includes("could not") ||
                  notice.toLowerCase().includes("failed")
                ? "!"
                : "✓"}
          </span>
          <p>{notice}</p>
          {!publishing && <button onClick={() => setNotice("")}>×</button>}
        </div>
      )}
    </>
  );
}

*/

function Calendar({ articles }: { articles: Article[] }) {
  const days = [...Array(35)].map((_, i) =>
    i < 2 || i > 32 ? "" : String(i - 1),
  );
  return (
    <>
      <Title
        eyebrow="PLANNING DESK"
        title="Editorial calendar"
        sub="Coordinate publication and social distribution across every desk."
        action={
          <span className="integration-label">
            Publication dates synced from the live archive
          </span>
        }
      />
      <div className="calendar-tools">
        <button>‹</button>
        <h2>July 2026</h2>
        <button>›</button>
        <span />
        <button className="active">Month</button>
        <button>Week</button>
      </div>
      <div className="calendar">
        <div className="weekdays">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((x) => (
            <b key={x}>{x}</b>
          ))}
        </div>
        <div className="days">
          {days.map((d, i) => (
            <div className={d === "30" ? "today" : ""} key={i}>
              <span>{d}</span>
              {d &&
                articles
                  .filter((article) => article.date.startsWith(`${Number(d)} `))
                  .slice(0, 2)
                  .map((article) => (
                    <article
                      className={`event ${article.industry === "AI" ? "ai" : "gaming"}`}
                      key={article.url || article.title}
                      title={article.title}
                    >
                      <b>LIVE</b> {article.title}
                    </article>
                  ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
/* Removed newsroom sections: Industries, Frameworks, Performance and Repurpose.
function Industries({ articles }: { articles: Article[] }) {
  const desks = industries.map((desk) => ({
    ...desk,
    count: articles.filter((article) => article.industry === desk.name).length,
  }));
  const [selectedName, setSelectedName] = useState(desks[0].name);
  const sel = desks.find((desk) => desk.name === selectedName) || desks[0];
  return (
    <>
      <Title
        eyebrow="EDITORIAL DESKS"
        title="Industries"
        sub="Dedicated intelligence coverage across six community-driven markets."
      />
      <div className="industry-cards">
        {desks.map((x) => (
          <button
            className={sel.name === x.name ? "selected" : ""}
            onClick={() => setSelectedName(x.name)}
            key={x.name}
          >
            <i style={{ background: x.color }} />
            <span>{x.name}</span>
            <strong>{x.count}</strong>
            <small>published reports</small>
          </button>
        ))}
      </div>
      <div className="desk-grid">
        <div className="panel">
          <span className="overline">
            {sel.name.toUpperCase()} COMMUNITY INTELLIGENCE
          </span>
          <h2>{sel.name} desk</h2>
          <p>
            Tracking community behaviour, narratives and strategic shifts
            shaping the {sel.name.toLowerCase()} industry.
          </p>
          <div className="mini-stats">
            <div>
              <b>{sel.count}</b>
              <span>Articles</span>
            </div>
            <div>
              <b>
                {
                  new Set(
                    articles
                      .filter((a) => a.industry === sel.name)
                      .map((a) => a.framework),
                  ).size
                }
              </b>
              <span>Frameworks used</span>
            </div>
            <div>
              <b>—</b>
              <span>Analytics pending</span>
            </div>
          </div>
          <h3>Latest intelligence</h3>
          {articles
            .filter((a) => a.industry === sel.name)
            .slice(0, 6)
            .map((a) => (
              <div className="story" key={a.title}>
                <span>{a.date}</span>
                <b>{a.title}</b>
                <em>→</em>
              </div>
            ))}
        </div>
        <div className="panel intel-index">
          <span>COMING SOON</span>
          <h2>Community Intelligence Index</h2>
          <p>
            A proprietary measure of community strength, trust and momentum
            across the {sel.name.toLowerCase()} market.
          </p>
          <div className="radar">
            CI
            <br />
            <b>INDEX</b>
          </div>
          <button>View architecture →</button>
        </div>
      </div>
    </>
  );
}
function Frameworks({ articles }: { articles: Article[] }) {
  const [sel, setSel] = useState(frameworks[0]);
  return (
    <>
      <Title
        eyebrow="RESEARCH METHODOLOGY"
        title="Frameworks"
        sub="The analytical systems behind every Community Intelligence report."
      />
      <div className="framework-layout">
        <div className="panel framework-list">
          {frameworks.map((f) => (
            <button
              className={sel === f ? "selected" : ""}
              key={f}
              onClick={() => setSel(f)}
            >
              <i>{String(frameworks.indexOf(f) + 1).padStart(2, "0")}</i>
              <span>{f}</span>
              <b>
                {articles.filter((article) => article.framework === f).length}
              </b>
            </button>
          ))}
        </div>
        <div className="panel framework-detail">
          <span className="overline">CORE FRAMEWORK</span>
          <h1>{sel}</h1>
          <p>
            A structured way to understand how identity, participation and
            shared belief create durable strategic advantage around a product or
            organisation.
          </p>
          <div className="mini-stats">
            <div>
              <b>
                {articles.filter((article) => article.framework === sel).length}
              </b>
              <span>Usage count</span>
            </div>
            <div>
              <b>
                {
                  new Set(
                    articles
                      .filter((article) => article.framework === sel)
                      .map((article) => article.industry),
                  ).size
                }
              </b>
              <span>Industries</span>
            </div>
            <div>
              <b>3</b>
              <span>Related frameworks</span>
            </div>
          </div>
          <h3>Framework relationships</h3>
          <div className="relationships">
            <span>Community Intelligence Stack</span>
            <i>→</i>
            <b>{sel}</b>
            <i>→</i>
            <span>Mission Premium</span>
          </div>
          <h3>Recent applications</h3>
          {articles
            .filter((article) => article.framework === sel)
            .slice(0, 5)
            .map((a) => (
              <div className="story" key={a.title}>
                <span>{a.industry}</span>
                <b>{a.title}</b>
                <em>→</em>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
function Performance() {
  return (
    <>
      <Title
        eyebrow="INTELLIGENCE IMPACT"
        title="Performance"
        sub="Measure how research travels, resonates and compounds over time."
        action={
          <span className="integration-label">
            Awaiting analytics connection
          </span>
        }
      />
      <div className="stats performance-stats">
        {[
          ["Website views", "—", "Connect analytics"],
          ["Avg. time on page", "—", "Connect analytics"],
          ["Social reach", "—", "Connect platforms"],
          ["Link clicks", "—", "Connect platforms"],
        ].map((x) => (
          <div className="stat" key={x[0]}>
            <span>{x[0]}</span>
            <strong>{x[1]}</strong>
            <small>{x[2]}</small>
          </div>
        ))}
      </div>
      <div className="charts">
        <div className="panel main-chart">
          <div className="panel-head">
            <div>
              <h2>Historical performance</h2>
              <p>Website views and social reach</p>
            </div>
            <span>
              ● Views　<span className="orange">● Reach</span>
            </span>
          </div>
          <div className="chart-bars">
            {[42, 55, 47, 68, 61, 76, 70, 88, 72, 93, 84, 98].map((h, i) => (
              <div key={i}>
                <i style={{ height: `${h}%` }} />
                <b style={{ height: `${h * 0.62}%` }} />
              </div>
            ))}
          </div>
          <div className="chart-labels">
            <span>1 Jul</span>
            <span>8 Jul</span>
            <span>15 Jul</span>
            <span>22 Jul</span>
            <span>30 Jul</span>
          </div>
        </div>
        <div className="panel source-list">
          <h2>Traffic sources</h2>
          {[
            ["Direct", "38%"],
            ["LinkedIn", "26%"],
            ["Reddit", "17%"],
            ["Search", "12%"],
            ["Other", "7%"],
          ].map((x) => (
            <div key={x[0]}>
              <span>{x[0]}</span>
              <i>
                <b style={{ width: x[1] }} />
              </i>
              <strong>{x[1]}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="platform-metrics">
        {["LinkedIn", "Facebook", "X"].map((x, i) => (
          <div className="panel" key={x}>
            <div>
              <span className="channel-icon">{x[0]}</span>
              <h3>{x}</h3>
              <em>Integration ready</em>
            </div>
            <section>
              <b>—</b>
              <span>{i ? "Reach" : "Impressions"}</span>
              <b>—</b>
              <span>Clicks</span>
            </section>
          </div>
        ))}
      </div>
    </>
  );
}
function buildRepurpose(article: Article, format: string) {
  const insight =
    article.summary ||
    `${article.title} examines the community signals shaping ${article.industry.toLowerCase()}.`;
  const url = article.url || "https://blog.theredditrepreneur.com";
  const lead = `${article.title}\n\n${insight}`;
  const versions: Record<string, string> = {
    "LinkedIn Personal": `${lead}\n\nThis is what Community Intelligence makes visible: the meaning behind the conversation, not only the volume.\n\nRead the full analysis: ${url}`,
    "LinkedIn Company": `NEW RESEARCH — ${article.title}\n\n${insight}\n\nThe Redditrepreneur translates community conversations into strategic intelligence.\n\n${url}`,
    Instagram: `${article.title}\n\n${insight}\n\nRead the full Community Intelligence analysis through the link in bio.\n\n#CommunityIntelligence #TheRedditrepreneur #${article.industry.replace(/\s/g, "")}`,
    Facebook: `${lead}\n\nRead the full analysis from The Redditrepreneur: ${url}`,
    X: `${article.title}\n\n${insight.slice(0, 140)}\n\n${url}`,
    "Newsletter Summary": `${article.title}\n\n${insight}\n\nWhy it matters: this story reveals how community trust, belief and behaviour are changing in ${article.industry.toLowerCase()}.`,
    "Executive Summary": `Executive summary\n\nSubject: ${article.title}\nIndustry: ${article.industry}\nFramework: ${article.framework}\n\nCore finding: ${insight}\n\nStrategic implication: organisations should treat community response as decision-grade evidence rather than background noise.`,
    "Reddit Post": `${article.title}\n\n${insight}\n\nWhat are you seeing in the communities you participate in?`,
    "TikTok Script": `HOOK: ${article.title}\n\nHere’s what most people are missing. ${insight}\n\nThe bigger story is about community trust and behaviour. Follow The Redditrepreneur for more Community Intelligence.`,
    "YouTube Short Script": `TITLE: ${article.title}\n\n[OPEN] ${insight}\n\n[INSIGHT] The community reaction tells us more than the announcement alone.\n\n[CLOSE] Read the full analysis at The Redditrepreneur.`,
    "Podcast Talking Points": `• ${article.title}\n• Context: ${insight}\n• Community signal to watch\n• Implications for ${article.industry}\n• How ${article.framework} explains the shift\n• What leaders should do next`,
    "LinkedIn Carousel": `SLIDE 1 — ${article.title}\nSLIDE 2 — What happened\n${insight}\nSLIDE 3 — The community signal\nTrust and behaviour are shifting.\nSLIDE 4 — Why it matters\nCommunity response is strategic evidence.\nSLIDE 5 — Read the full analysis\n${url}`,
  };
  return versions[format] || lead;
}

function Repurpose({ articles }: { articles: Article[] }) {
  const formats = [
    "LinkedIn Personal",
    "LinkedIn Company",
    "Instagram",
    "Facebook",
    "X",
    "LinkedIn Carousel",
    "Newsletter Summary",
    "Executive Summary",
    "Reddit Post",
    "TikTok Script",
    "YouTube Short Script",
    "Podcast Talking Points",
  ];
  const [sel, setSel] = useState(formats[0]);
  const [articleIndex, setArticleIndex] = useState(0);
  const article = articles[articleIndex] || fallbackArticles[0];
  const [draft, setDraft] = useState(() => buildRepurpose(article, formats[0]));
  const [saved, setSaved] = useState(false);
  const chooseFormat = (format: string) => {
    setSel(format);
    setDraft(buildRepurpose(article, format));
    setSaved(false);
  };
  const chooseArticle = (index: number) => {
    const next = articles[index] || fallbackArticles[0];
    setArticleIndex(index);
    setDraft(buildRepurpose(next, sel));
    setSaved(false);
  };
  return (
    <>
      <Title
        eyebrow="CONTENT STUDIO"
        title="Repurpose"
        sub="Turn one intelligence report into a complete editorial campaign."
        action={
          <select
            className="article-select"
            value={articleIndex}
            onChange={(event) => chooseArticle(Number(event.target.value))}
          >
            {articles.map((item, index) => (
              <option value={index} key={item.url || item.title}>
                {item.title}
              </option>
            ))}
          </select>
        }
      />
      <div className="repurpose-layout">
        <div className="panel format-list">
          <h3>{formats.length} formats</h3>
          {formats.map((f, i) => (
            <button
              className={sel === f ? "selected" : ""}
              key={f}
              onClick={() => chooseFormat(f)}
            >
              <span>{i < 4 ? "✓" : "✦"}</span>
              <div>
                <b>{f}</b>
                <small>{i < 4 ? "Draft generated" : "Ready to generate"}</small>
              </div>
              <em>›</em>
            </button>
          ))}
        </div>
        <div className="panel repurpose-editor">
          <div className="editor-head">
            <div>
              <span className="channel-icon">{sel[0]}</span>
              <div>
                <h2>{sel}</h2>
                <p>Generated from the original analysis</p>
              </div>
            </div>
            <button onClick={() => setDraft(buildRepurpose(article, sel))}>
              ✦ Regenerate
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSaved(false);
            }}
          />
          <div className="counter">
            <span>
              {saved ? "Draft saved for this session" : "Edited just now"}
            </span>
            <b>{draft.length} characters</b>
          </div>
          <div className="editor-actions">
            <button onClick={() => navigator.clipboard.writeText(draft)}>
              Copy
            </button>
            <button onClick={() => setSaved(true)}>Save draft</button>
            <button className="primary" onClick={() => setSaved(true)}>
              Mark complete ✓
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
*/

function Settings() {
  return (
    <>
      <Title
        eyebrow="NEWSROOM CONFIGURATION"
        title="Settings"
        sub="The Newsroom tracks distribution; Buffer handles social publishing."
      />
      <div className="settings-note buffer-note">
        <div>
          <span className="overline">PUBLISHING WORKFLOW</span>
          <h2>Buffer is your social publishing centre</h2>
          <p>
            Create and schedule posts in Buffer, then return to each article’s
            Distribution page and tick off the platforms that are live.
          </p>
        </div>
        <a
          className="button primary"
          href="https://publish.buffer.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open Buffer ↗
        </a>
      </div>
      <div className="panel workflow-card">
        <span className="overline">SIMPLE WORKFLOW</span>
        <div className="buffer-workflow">
          {[
            "Article published",
            "Create posts in Buffer",
            "Publish or schedule",
            "Tick off platforms",
          ].map((step, index) => (
            <div key={step}>
              <i>{index + 1}</i>
              <b>{step}</b>
              {index < 3 && <span>→</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="settings-note privacy-note">
        <b>No social account connections are required.</b>
        <p>
          The Newsroom does not store social passwords, access tokens, API keys,
          drafts, or media. Your existing Buffer connections remain entirely in
          Buffer.
        </p>
      </div>
    </>
  );
}

/* Legacy OAuth connection centre removed; Buffer owns social connections.
function LegacySettings() {
  const [setup, setSetup] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const startConnection = (platform: string) => {
    setConnecting(true);
    setConnectionMessage(`Waiting for ${platform} approval…`);
    const popup = window.open(
      `/api/social/connect?platform=${encodeURIComponent(platform)}`,
      "newsroom-social-connect",
      "popup=yes,width=650,height=760,resizable=yes,scrollbars=yes",
    );
    let checks = 0;
    const poll = window.setInterval(async () => {
      checks += 1;
      try {
        const response = await fetch("/api/social/status", {
          cache: "no-store",
        });
        const data = (await response.json()) as { connected?: string[] };
        const current = data.connected || [];
        setConnectedPlatforms(current);
        if (
          current.includes(platform) ||
          (platform === "Facebook" && current.includes("Instagram"))
        ) {
          window.clearInterval(poll);
          popup?.close();
          setConnecting(false);
          setConnectionMessage(`${platform} connected successfully.`);
        }
      } catch {}
      if (checks >= 80 || popup?.closed) {
        window.clearInterval(poll);
        setConnecting(false);
      }
    }, 1500);
  };
  useEffect(() => {
    fetch("/api/social/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { connected?: string[] }) =>
        setConnectedPlatforms(data.connected || []),
      )
      .catch(() => undefined);
    const params = new URLSearchParams(window.location.search);
    const platform = params.get("platform");
    const result = params.get("connection");
    if (!platform || !result) return;
    queueMicrotask(() => setSetup(platform));
    const required = params.get("required")?.split(",").filter(Boolean) || [];
    if (result === "connected") {
      queueMicrotask(() => {
        setConnectedPlatforms((current) => [
          ...new Set([
            ...current,
            ...(platform === "Facebook" || platform === "Instagram"
              ? ["Facebook", "Instagram"]
              : [platform]),
          ]),
        ]);
        setConnectionMessage(
          `${platform} connected successfully. Publishing access is now securely stored.`,
        );
      });
      return;
    }
    queueMicrotask(() =>
      setConnectionMessage(
        result === "credentials-required"
          ? `Add ${required.join(" and ")} to Vercel before connecting ${platform}.`
          : result === "newsletter-provider-required"
            ? "Choose the newsletter service you use (for example Beehiiv, ConvertKit or Mailchimp) before this connection can be completed."
            : result === "denied"
              ? `${platform} did not grant access. You can try again when ready.`
              : result === "token-error"
                ? `Meta could not complete the connection: ${params.get("reason") || "token exchange failed"}.`
                : `${platform} OAuth support is the next provider connection to enable.`,
      ),
    );
  }, []);
  const platforms = [
    "LinkedIn Personal",
    "LinkedIn Company",
    "Instagram",
    "Facebook",
    "X",
    "Threads",
    "Bluesky",
    "Newsletter",
  ];
  const accountLabels: Record<string, string> = {
    "LinkedIn Personal": "Tonte Bo Douglas",
    "LinkedIn Company": "The Redditrepreneur",
    Instagram: "@theredditrepreneur · Creator account linked to Facebook",
    Facebook: "The Redditrepreneur · Facebook Page",
    X: "@redditrepreneur",
    Threads: "Account not specified",
    Bluesky: "Account supplied through secure Vercel credentials",
    Newsletter: "Newsletter provider not selected",
  };
  return (
    <>
      <Title
        eyebrow="NEWSROOM CONFIGURATION"
        title="Settings"
        sub="Prepare distribution channels and publication integrations."
      />
      <div className="settings-note">
        <b>Social connection centre</b>
        <p>
          Connect each account through its secure provider sign-in. The provider
          will show the exact publishing permissions before approval.
        </p>
      </div>
      {setup && (
        <div className="connection-panel panel">
          <div>
            <span className="overline">SECURE CONNECTION</span>
            <h2>Connect {setup}</h2>
            <p>
              This launches the official {setup} authorisation flow. Your social
              password is never entered in or stored by the Newsroom.
            </p>
            {connectionMessage && (
              <p className="connection-warning">{connectionMessage}</p>
            )}
          </div>
          <div className="connection-actions">
            <button onClick={() => setSetup(null)}>Cancel</button>
            <button
              className="button primary"
              disabled={connecting}
              onClick={() => startConnection(setup)}
            >
              {connecting ? "Waiting for approval…" : `Open ${setup} login →`}
            </button>
          </div>
        </div>
      )}
      <div className="settings-grid">
        {platforms.map((x) => (
          <div className="panel setting" key={x}>
            <div>
              <span className="channel-icon">{x[0]}</span>
              <span
                className={
                  connectedPlatforms.includes(x)
                    ? "connection connected"
                    : "connection"
                }
              >
                {connectedPlatforms.includes(x)
                  ? "● Connected"
                  : "○ Ready to connect"}
              </span>
            </div>
            <h2>{x}</h2>
            <strong className="account-identity">{accountLabels[x]}</strong>
            <p>
              {connectedPlatforms.includes(x)
                ? "Publishing authorisation is securely connected."
                : "Use the provider’s secure approval screen to connect this account."}
            </p>
            <footer>
              <button
                onClick={() => {
                  setSetup(x);
                  setConnectionMessage("");
                }}
              >
                {connectedPlatforms.includes(x) ? "Reconnect" : "Connect"}
              </button>
              <button onClick={() => setSetup(x)}>Permissions →</button>
            </footer>
          </div>
        ))}
      </div>
    </>
  );
}

*/
