import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { newsroomUrl } from "../../../../../lib/social-connection";

function encrypt(value: string) {
  const key = createHash("sha256")
    .update(process.env.META_APP_SECRET!)
    .digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}

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

  destination.searchParams.set("connection", "connected");
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    "newsroom_meta_connection",
    encrypt(
      JSON.stringify({
        accessToken: token.access_token,
        expiresIn: token.expires_in,
        connectedAt: new Date().toISOString(),
      }),
    ),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: token.expires_in || 5184000,
      path: "/",
    },
  );
  response.cookies.delete("newsroom_meta_state");
  response.cookies.delete("newsroom_meta_platform");
  return response;
}
