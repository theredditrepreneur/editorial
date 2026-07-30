import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  connectionCookie,
  newsroomUrl,
  sealConnection,
} from "../../../../lib/social-connection";

const requirements: Record<string, string[]> = {
  "LinkedIn Personal": ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  "LinkedIn Company": ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  Instagram: ["META_APP_ID", "META_APP_SECRET"],
  Facebook: ["META_APP_ID", "META_APP_SECRET"],
  X: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
  Threads: ["THREADS_APP_ID", "THREADS_APP_SECRET"],
  Bluesky: ["BLUESKY_IDENTIFIER", "BLUESKY_APP_PASSWORD"],
};

function settings(
  request: NextRequest,
  platform: string,
  result: string,
  required = "",
) {
  const url = new URL("/settings", request.url);
  url.searchParams.set("platform", platform);
  url.searchParams.set("connection", result);
  if (required) url.searchParams.set("required", required);
  return NextResponse.redirect(url);
}

function oauthCookies(
  response: NextResponse,
  provider: string,
  state: string,
  platform: string,
) {
  response.cookies.set(`newsroom_${provider}_state`, state, {
    ...connectionCookie,
    maxAge: 600,
  });
  response.cookies.set(`newsroom_${provider}_platform`, platform, {
    ...connectionCookie,
    maxAge: 600,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") || "Platform";
  if (platform === "Newsletter")
    return settings(request, platform, "newsletter-provider-required");
  const missing = (requirements[platform] || []).filter(
    (key) => !process.env[key],
  );
  if (missing.length)
    return settings(
      request,
      platform,
      "credentials-required",
      missing.join(","),
    );

  if (["Facebook", "Instagram"].includes(platform)) {
    const state = randomBytes(24).toString("hex");
    const callback = newsroomUrl("/api/social/meta/callback");
    const authorization = new URL("https://www.facebook.com/dialog/oauth");
    authorization.searchParams.set("client_id", process.env.META_APP_ID!);
    authorization.searchParams.set("redirect_uri", callback.toString());
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("state", state);
    authorization.searchParams.set(
      "scope",
      "public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
    );
    if (process.env.META_LOGIN_CONFIG_ID) {
      authorization.searchParams.set(
        "config_id",
        process.env.META_LOGIN_CONFIG_ID,
      );
    }
    return oauthCookies(
      NextResponse.redirect(authorization),
      "meta",
      state,
      platform,
    );
  }

  if (platform.startsWith("LinkedIn")) {
    const state = randomBytes(24).toString("hex");
    const callback = newsroomUrl("/api/social/linkedin/callback");
    const authorization = new URL(
      "https://www.linkedin.com/oauth/v2/authorization",
    );
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set(
      "client_id",
      process.env.LINKEDIN_CLIENT_ID!,
    );
    authorization.searchParams.set("redirect_uri", callback.toString());
    authorization.searchParams.set("state", state);
    authorization.searchParams.set(
      "scope",
      platform === "LinkedIn Personal"
        ? "openid profile w_member_social"
        : "openid profile",
    );
    return oauthCookies(
      NextResponse.redirect(authorization),
      "linkedin",
      state,
      platform,
    );
  }

  if (platform === "X") {
    const state = randomBytes(24).toString("hex");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const callback = newsroomUrl("/api/social/x/callback");
    const authorization = new URL("https://x.com/i/oauth2/authorize");
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("client_id", process.env.X_CLIENT_ID!);
    authorization.searchParams.set("redirect_uri", callback.toString());
    authorization.searchParams.set(
      "scope",
      "tweet.read tweet.write users.read offline.access",
    );
    authorization.searchParams.set("state", state);
    authorization.searchParams.set("code_challenge", challenge);
    authorization.searchParams.set("code_challenge_method", "S256");
    const response = oauthCookies(
      NextResponse.redirect(authorization),
      "x",
      state,
      platform,
    );
    response.cookies.set("newsroom_x_verifier", verifier, {
      ...connectionCookie,
      maxAge: 600,
    });
    return response;
  }

  if (platform === "Threads") {
    const state = randomBytes(24).toString("hex");
    const callback = newsroomUrl("/api/social/threads/callback");
    const authorization = new URL("https://threads.net/oauth/authorize");
    authorization.searchParams.set("client_id", process.env.THREADS_APP_ID!);
    authorization.searchParams.set("redirect_uri", callback.toString());
    authorization.searchParams.set(
      "scope",
      "threads_basic,threads_content_publish,threads_manage_insights",
    );
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("state", state);
    return oauthCookies(
      NextResponse.redirect(authorization),
      "threads",
      state,
      platform,
    );
  }

  if (platform === "Bluesky") {
    const response = await fetch(
      "https://bsky.social/xrpc/com.atproto.server.createSession",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: process.env.BLUESKY_IDENTIFIER,
          password: process.env.BLUESKY_APP_PASSWORD,
        }),
        cache: "no-store",
      },
    );
    const session = await response.json();
    if (!response.ok) return settings(request, platform, "token-error");
    const redirect = settings(request, platform, "connected");
    redirect.cookies.set(
      "newsroom_bluesky_connection",
      sealConnection(session, process.env.BLUESKY_APP_PASSWORD!),
      { ...connectionCookie, maxAge: 7776000 },
    );
    return redirect;
  }

  return settings(request, platform, "unsupported");
}
