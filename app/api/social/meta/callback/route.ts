import { NextRequest, NextResponse } from "next/server";
import {
  connectionCookie,
  newsroomUrl,
  sealConnection,
} from "../../../../../lib/social-connection";

export async function GET(request: NextRequest) {
  const destination = new URL("/settings", request.url);
  const platform =
    request.cookies.get("newsroom_meta_platform")?.value || "Facebook";
  destination.searchParams.set("platform", platform);
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("newsroom_meta_state")?.value;
  const code = request.nextUrl.searchParams.get("code");
  if (!state || !expectedState || state !== expectedState || !code) {
    destination.searchParams.set("connection", "denied");
    return NextResponse.redirect(destination);
  }

  const callback = newsroomUrl("/api/social/meta/callback");
  const tokenUrl = new URL("https://graph.facebook.com/oauth/access_token");
  tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  tokenUrl.searchParams.set("redirect_uri", callback.toString());
  tokenUrl.searchParams.set("code", code);
  const tokenResponse = await fetch(tokenUrl, { cache: "no-store" });
  const token = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!tokenResponse.ok || !token.access_token) {
    destination.searchParams.set("connection", "token-error");
    destination.searchParams.set(
      "reason",
      token.error?.message || "Meta rejected the token exchange",
    );
    return NextResponse.redirect(destination);
  }

  const accountsUrl = new URL("https://graph.facebook.com/me/accounts");
  accountsUrl.searchParams.set("access_token", token.access_token);
  accountsUrl.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username}",
  );
  const accountsResponse = await fetch(accountsUrl, { cache: "no-store" });
  const accounts = accountsResponse.ok
    ? ((await accountsResponse.json()) as { data?: unknown[] }).data || []
    : [];

  destination.searchParams.set("connection", "connected");
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    "newsroom_meta_connection",
    sealConnection(
      {
        accessToken: token.access_token,
        expiresIn: token.expires_in,
        connectedAt: new Date().toISOString(),
        accounts,
      },
      process.env.META_APP_SECRET!,
    ),
    {
      ...connectionCookie,
      maxAge: token.expires_in || 5184000,
    },
  );
  response.cookies.delete("newsroom_meta_state");
  response.cookies.delete("newsroom_meta_platform");
  return response;
}
