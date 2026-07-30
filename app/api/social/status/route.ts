import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const metaConnected = Boolean(
    request.cookies.get("newsroom_meta_connection")?.value,
  );
  return NextResponse.json({
    connected: metaConnected ? ["Facebook", "Instagram"] : [],
  });
}
