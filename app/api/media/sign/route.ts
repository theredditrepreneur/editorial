import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const bucket = "newsroom-media";

export async function POST(request: NextRequest) {
  const { filename = "media", contentType = "application/octet-stream" } =
    (await request.json()) as { filename?: string; contentType?: string };
  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only image and video files are supported." },
      { status: 400 },
    );
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((item) => item.name === bucket)) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: ["image/*", "video/*"],
      fileSizeLimit: 524288000,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const extension = filename.includes(".") ? filename.split(".").pop() : "bin";
  const path = `distribution/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path)
    .data.publicUrl;
  return NextResponse.json({ bucket, path, token: data.token, publicUrl });
}
