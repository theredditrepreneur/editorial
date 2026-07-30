import { NextRequest, NextResponse } from "next/server";
import {
  connectionCookie,
  newsroomUrl,
  sealConnection,
} from "../../../../../lib/social-connection";

export async function GET(request: NextRequest) {
  const platform =
    request.cookies.get("newsroom_linkedin_platform")?.value ||
    "LinkedIn Personal";
  const destination = new URL("/settings", request.url);
  destination.searchParams.set("platform", platform);
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (
    !code ||
    state !== request.cookies.get("newsroom_linkedin_state")?.value
  ) {
    destination.searchParams.set("connection", "denied");
    return NextResponse.redirect(destination);
  }
  const callback = newsroomUrl("/api/social/linkedin/callback");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: callback.toString(),
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  });
  const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) {
    destination.searchParams.set("connection", "token-error");
    return NextResponse.redirect(destination);
  }
  destination.searchParams.set("connection", "connected");
  const response = NextResponse.redirect(destination);
  const cookieName =
    platform === "LinkedIn Company"
      ? "newsroom_linkedin_company_connection"
      : "newsroom_linkedin_personal_connection";
  response.cookies.set(
    cookieName,
    sealConnection(token, process.env.LINKEDIN_CLIENT_SECRET!),
    { ...connectionCookie, maxAge: token.expires_in || 5184000 },
  );
  response.cookies.delete("newsroom_linkedin_state");
  response.cookies.delete("newsroom_linkedin_platform");
  return response;
}
