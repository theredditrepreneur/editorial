import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export function sealConnection(value: unknown, secret: string) {
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}

export function openConnection<T>(sealed: string, secret: string): T {
  const bytes = Buffer.from(sealed, "base64url");
  const key = createHash("sha256").update(secret).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ]).toString("utf8"),
  ) as T;
}

export const connectionCookie = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export function newsroomUrl(path: string) {
  return new URL(
    path,
    process.env.NEWSROOM_URL || "https://editorial.theredditrepreneur.com",
  );
}
