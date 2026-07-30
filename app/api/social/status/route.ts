import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const metaConnected = Boolean(
    request.cookies.get("newsroom_meta_connection")?.value,
  );
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
