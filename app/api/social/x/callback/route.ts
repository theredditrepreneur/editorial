import { NextRequest, NextResponse } from "next/server";
import {
  connectionCookie,
  newsroomUrl,
  sealConnection,
} from "../../../../../lib/social-connection";

export async function GET(request: NextRequest) {
  const destination = new URL("/settings", request.url);
  destination.searchParams.set("platform", "X");
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const verifier = request.cookies.get("newsroom_x_verifier")?.value;
  if (
    !code ||
    !verifier ||
    state !== request.cookies.get("newsroom_x_state")?.value
  ) {
    destination.searchParams.set("connection", "denied");
    return NextResponse.redirect(destination);
  }
  const callback = newsroomUrl("/api/social/x/callback");
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: callback.toString(),
    code_verifier: verifier,
  });
  const basic = Buffer.from(
    `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`,
  ).toString("base64");
  const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${basic}`,
    },
    body,
    cache: "no-store",
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) {
    destination.searchParams.set("connection", "token-error");
    return NextResponse.redirect(destination);
  }
  destination.searchParams.set("connection", "connected");
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    "newsroom_x_connection",
    sealConnection(token, process.env.X_CLIENT_SECRET!),
    { ...connectionCookie, maxAge: token.expires_in || 7200 },
  );
  response.cookies.delete("newsroom_x_state");
  response.cookies.delete("newsroom_x_verifier");
  return response;
}
