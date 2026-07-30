import { NextRequest, NextResponse } from "next/server";
import { openConnection } from "../../../../lib/social-connection";

export async function GET(request: NextRequest) {
  let metaConnected = false;
  const metaCookie = request.cookies.get("newsroom_meta_connection")?.value;
  if (metaCookie && process.env.META_APP_SECRET) {
    try {
      const connection = openConnection<{
        accounts?: Array<{ access_token?: string }>;
      }>(metaCookie, process.env.META_APP_SECRET);
      metaConnected = Boolean(connection.accounts?.[0]?.access_token);
    } catch {
      metaConnected = false;
    }
  }
  const connected = metaConnected ? ["Facebook", "Instagram"] : [];
  if (request.cookies.has("newsroom_linkedin_personal_connection"))
    connected.push("LinkedIn Personal");
  if (request.cookies.has("newsroom_linkedin_company_connection"))
    connected.push("LinkedIn Company");
  if (request.cookies.has("newsroom_x_connection")) connected.push("X");
  if (request.cookies.has("newsroom_threads_connection"))
    connected.push("Threads");
  if (request.cookies.has("newsroom_bluesky_connection"))
    connected.push("Bluesky");
  return NextResponse.json({ connected });
}
