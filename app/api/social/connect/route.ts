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
  const destination = new URL("/settings", request.url);
  destination.searchParams.set("platform", platform);
  destination.searchParams.set(
    "connection",
    missing.length ? "credentials-required" : "oauth-setup-required",
  );
  destination.searchParams.set("required", missing.join(","));
  return NextResponse.redirect(destination);
}
