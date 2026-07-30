import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const requirements: Record<string, string[]> = {
  "LinkedIn Personal": ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  "LinkedIn Company": ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  Instagram: ["META_APP_ID", "META_APP_SECRET"],
  Facebook: ["META_APP_ID", "META_APP_SECRET"],
  X: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
  Threads: ["META_APP_ID", "META_APP_SECRET"],
  Bluesky: ["BLUESKY_IDENTIFIER", "BLUESKY_APP_PASSWORD"],
  Newsletter: ["NEWSLETTER_API_KEY"],
};

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") || "Platform";
  const required = requirements[platform] || [];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    const destination = new URL("/settings", request.url);
    destination.searchParams.set("platform", platform);
    destination.searchParams.set("connection", "credentials-required");
    destination.searchParams.set("required", missing.join(","));
    return NextResponse.redirect(destination);
  }

  if (["Facebook", "Instagram"].includes(platform)) {
    const state = randomBytes(24).toString("hex");
    const callback = new URL("/api/social/meta/callback", request.url);
    const authorization = new URL("https://www.facebook.com/dialog/oauth");
    authorization.searchParams.set("client_id", process.env.META_APP_ID!);
    authorization.searchParams.set("redirect_uri", callback.toString());
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("state", state);
    authorization.searchParams.set(
      "scope",
      "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
    );
    const response = NextResponse.redirect(authorization);
    response.cookies.set("newsroom_meta_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    response.cookies.set("newsroom_meta_platform", platform, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  }

  const destination = new URL("/settings", request.url);
  destination.searchParams.set("platform", platform);
  destination.searchParams.set("connection", "provider-coming-next");
  return NextResponse.redirect(destination);
}
