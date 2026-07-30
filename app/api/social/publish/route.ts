import { NextRequest, NextResponse } from "next/server";
import {
  openConnection,
  sealConnection,
} from "../../../../lib/social-connection";

type Media = { url: string; type: string };
type MetaAccount = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
};

async function graph(path: string, data: Record<string, string>) {
  const body = new URLSearchParams(data);
  const response = await fetch(`https://graph.facebook.com/${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || result.error)
    throw new Error(result.error?.message || "Meta rejected the post");
  return result as { id?: string };
}

async function publishMeta(
  request: NextRequest,
  platform: string,
  text: string,
  media: Media[],
) {
  const sealed = request.cookies.get("newsroom_meta_connection")?.value;
  if (!sealed)
    throw new Error("Reconnect Facebook and Instagram in Settings first.");
  const connection = openConnection<{ accounts?: MetaAccount[] }>(
    sealed,
    process.env.META_APP_SECRET!,
  );
  const page =
    connection.accounts?.find((item) =>
      item.name.toLowerCase().includes("redditrepreneur"),
    ) || connection.accounts?.[0];
  if (!page?.access_token)
    throw new Error("Reconnect Meta to grant Page publishing permissions.");

  if (platform === "Facebook Page") {
    if (!media.length) {
      const post = await graph(`${page.id}/feed`, {
        message: text,
        access_token: page.access_token,
      });
      return {
        id: post.id,
        url: post.id
          ? `https://facebook.com/${post.id.replace("_", "/posts/")}`
          : undefined,
      };
    }
    if (media.length === 1 && media[0].type.startsWith("video/")) {
      const post = await graph(`${page.id}/videos`, {
        file_url: media[0].url,
        description: text,
        access_token: page.access_token,
      });
      return {
        id: post.id,
        url: post.id ? `https://facebook.com/${post.id}` : undefined,
      };
    }
    const photos = await Promise.all(
      media.map((item) =>
        graph(`${page.id}/photos`, {
          url: item.url,
          published: "false",
          access_token: page.access_token,
        }),
      ),
    );
    const post = await graph(`${page.id}/feed`, {
      message: text,
      attached_media: JSON.stringify(
        photos.map((photo) => ({ media_fbid: photo.id })),
      ),
      access_token: page.access_token,
    });
    return {
      id: post.id,
      url: post.id
        ? `https://facebook.com/${post.id.replace("_", "/posts/")}`
        : undefined,
    };
  }

  const instagram = page.instagram_business_account;
  if (!instagram)
    throw new Error(
      "No Instagram Creator/Business account is linked to the selected Facebook Page.",
    );
  if (!media.length)
    throw new Error("Instagram requires at least one image or video.");
  const carousel = media.length > 1;
  const children: string[] = [];
  for (const item of media) {
    const payload: Record<string, string> = { access_token: page.access_token };
    if (item.type.startsWith("video/")) {
      payload.media_type = carousel ? "VIDEO" : "REELS";
      payload.video_url = item.url;
    } else {
      payload.image_url = item.url;
    }
    if (carousel) payload.is_carousel_item = "true";
    else payload.caption = text;
    const child = await graph(`${instagram.id}/media`, payload);
    if (!child.id)
      throw new Error("Instagram did not create the media container.");
    children.push(child.id);
  }
  let creationId = children[0];
  if (carousel) {
    const parent = await graph(`${instagram.id}/media`, {
      media_type: "CAROUSEL",
      children: children.join(","),
      caption: text,
      access_token: page.access_token,
    });
    creationId = parent.id!;
  }
  const published = await graph(`${instagram.id}/media_publish`, {
    creation_id: creationId,
    access_token: page.access_token,
  });
  return {
    id: published.id,
    url: published.id ? `https://instagram.com/p/${published.id}` : undefined,
  };
}

async function publishX(request: NextRequest, text: string, media: Media[]) {
  const sealed = request.cookies.get("newsroom_x_connection")?.value;
  if (!sealed) throw new Error("Reconnect X in Settings first.");
  if (media.some((item) => item.type.startsWith("video/")))
    throw new Error(
      "X video upload is not enabled yet; use up to four images.",
    );
  if (media.length > 4)
    throw new Error("X supports a maximum of four images per post.");
  let token = openConnection<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    obtainedAt?: number;
  }>(sealed, process.env.X_CLIENT_SECRET!);
  let refreshedConnection: string | undefined;
  const expiresAt =
    (token.obtainedAt || 0) + (token.expires_in || 7200) * 1000 - 60_000;
  if (token.refresh_token && Date.now() >= expiresAt) {
    const refreshBody = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
    });
    const basic = Buffer.from(
      `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`,
    ).toString("base64");
    const refreshResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        authorization: `Basic ${basic}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: refreshBody,
      cache: "no-store",
    });
    const refreshed = await refreshResponse.json();
    if (!refreshResponse.ok || !refreshed.access_token)
      throw new Error("Your X session expired. Reconnect X in Settings.");
    token = {
      ...refreshed,
      refresh_token: refreshed.refresh_token || token.refresh_token,
      obtainedAt: Date.now(),
    };
    refreshedConnection = sealConnection(token, process.env.X_CLIENT_SECRET!);
  }
  const mediaIds: string[] = [];
  for (const item of media) {
    const fileResponse = await fetch(item.url, { cache: "no-store" });
    if (!fileResponse.ok)
      throw new Error("Could not retrieve an uploaded image.");
    const encoded = Buffer.from(await fileResponse.arrayBuffer()).toString(
      "base64",
    );
    const upload = await fetch("https://api.x.com/2/media/upload", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        media: encoded,
        media_category: "tweet_image",
        media_type: item.type,
      }),
      cache: "no-store",
    });
    const result = await upload.json();
    if (!upload.ok || !result.data?.id)
      throw new Error(result.detail || "X rejected an image upload.");
    mediaIds.push(result.data.id);
  }
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}),
    }),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.data?.id)
    throw new Error(result.detail || "X rejected the post.");
  return {
    id: result.data.id,
    url: `https://x.com/i/web/status/${result.data.id}`,
    refreshedConnection,
  };
}

async function publishLinkedIn(
  request: NextRequest,
  text: string,
  media: Media[],
  company = false,
) {
  const sealed = request.cookies.get(
    company
      ? "newsroom_linkedin_company_connection"
      : "newsroom_linkedin_personal_connection",
  )?.value;
  if (!sealed)
    throw new Error(
      `Reconnect LinkedIn ${company ? "Company" : "Personal"} in Settings first.`,
    );
  if (media.length)
    throw new Error(
      "LinkedIn media publishing is not enabled yet; publish this version as text.",
    );
  const token = openConnection<{ access_token: string }>(
    sealed,
    process.env.LINKEDIN_CLIENT_SECRET!,
  );
  let author: string;
  if (company) {
    const organizationId = process.env.LINKEDIN_ORGANIZATION_ID?.trim();
    if (!organizationId || !/^\d+$/.test(organizationId))
      throw new Error(
        "Add LINKEDIN_ORGANIZATION_ID to Vercel with The Redditrepreneur Page's numeric LinkedIn ID.",
      );
    author = `urn:li:organization:${organizationId}`;
  } else {
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      },
    );
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub)
      throw new Error(
        "LinkedIn could not identify the connected member. Reconnect the account.",
      );
    author = `urn:li:person:${profile.sub}`;
  }
  // The UGC endpoint is covered by w_member_social/w_organization_social.
  // LinkedIn's newer Posts endpoint requires separate partner API approval.
  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token.access_token}`,
      "content-type": "application/json",
      "linkedin-version": "202607",
      "x-restli-protocol-version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message ||
        `LinkedIn rejected the ${company ? "Company" : "Personal"} post. Reconnect it in Settings and confirm its publishing product is approved.`,
    );
  }
  const id = response.headers.get("x-restli-id") || undefined;
  return { id };
}

export async function POST(request: NextRequest) {
  let requestedPlatform = "unknown";
  try {
    const {
      platform,
      text,
      media = [],
    } = (await request.json()) as {
      platform: string;
      text: string;
      media?: Media[];
    };
    requestedPlatform = platform;
    if (!text?.trim())
      return NextResponse.json(
        { error: "Post copy cannot be empty." },
        { status: 400 },
      );
    const result =
      platform === "X"
        ? await publishX(request, text, media)
        : platform === "LinkedIn Personal" || platform === "LinkedIn Company"
          ? await publishLinkedIn(
              request,
              text,
              media,
              platform === "LinkedIn Company",
            )
          : ["Facebook Page", "Instagram"].includes(platform)
            ? await publishMeta(request, platform, text, media)
            : (() => {
                throw new Error(`${platform} publishing is not enabled yet.`);
              })();
    const { refreshedConnection, ...publicResult } = result as typeof result & {
      refreshedConnection?: string;
    };
    const response = NextResponse.json({ ok: true, ...publicResult });
    if (refreshedConnection)
      response.cookies.set("newsroom_x_connection", refreshedConnection, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
      });
    return response;
  } catch (error) {
    console.error("Social publish failed", {
      platform: requestedPlatform,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing failed." },
      { status: 400 },
    );
  }
}
