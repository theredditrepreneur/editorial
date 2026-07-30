import { NextRequest, NextResponse } from "next/server";
import { openConnection } from "../../../../lib/social-connection";

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
  const token = openConnection<{ access_token: string }>(
    sealed,
    process.env.X_CLIENT_SECRET!,
  );
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
    const headers = {
      authorization: `Bearer ${token.access_token}`,
      "linkedin-version": "202607",
      "x-restli-protocol-version": "2.0.0",
    };
    const aclResponse = await fetch(
      "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
      { headers, cache: "no-store" },
    );
    const acl = (await aclResponse.json()) as {
      elements?: Array<{ organization?: string }>;
      message?: string;
    };
    if (!aclResponse.ok || !acl.elements?.length)
      throw new Error(
        acl.message ||
          "No LinkedIn Company Page was found where the connected member is an administrator.",
      );
    let chosen = acl.elements[0].organization;
    for (const item of acl.elements) {
      const id = item.organization?.split(":").pop();
      if (!id) continue;
      const organizationResponse = await fetch(
        `https://api.linkedin.com/rest/organizations/${id}`,
        { headers, cache: "no-store" },
      );
      if (!organizationResponse.ok) continue;
      const organization = (await organizationResponse.json()) as {
        localizedName?: string;
      };
      if (
        organization.localizedName?.toLowerCase().includes("redditrepreneur")
      ) {
        chosen = item.organization;
        break;
      }
    }
    if (!chosen)
      throw new Error(
        "The Redditrepreneur LinkedIn Page could not be identified.",
      );
    author = chosen;
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
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token.access_token}`,
      "content-type": "application/json",
      "linkedin-version": "202607",
      "x-restli-protocol-version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message ||
        "LinkedIn rejected the post. Reconnect to grant Share on LinkedIn permission.",
    );
  }
  const id = response.headers.get("x-restli-id") || undefined;
  return { id };
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing failed." },
      { status: 400 },
    );
  }
}
