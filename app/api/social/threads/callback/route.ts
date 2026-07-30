import { NextRequest, NextResponse } from "next/server";
import {
  connectionCookie,
  newsroomUrl,
  sealConnection,
} from "../../../../../lib/social-connection";

export async function GET(request: NextRequest) {
  const destination = new URL("/settings", request.url);
  destination.searchParams.set("platform", "Threads");
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (!code || state !== request.cookies.get("newsroom_threads_state")?.value) {
    destination.searchParams.set("connection", "denied");
    return NextResponse.redirect(destination);
  }
  const callback = newsroomUrl("/api/social/threads/callback");
  const body = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID!,
    client_secret: process.env.THREADS_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: callback.toString(),
    code,
  });
  const tokenResponse = await fetch(
    "https://graph.threads.net/oauth/access_token",
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
  response.cookies.set(
    "newsroom_threads_connection",
    sealConnection(token, process.env.THREADS_APP_SECRET!),
    { ...connectionCookie, maxAge: 5184000 },
  );
  response.cookies.delete("newsroom_threads_state");
  return response;
}
