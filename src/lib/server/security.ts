import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export class RequestSizeError extends Error {}

export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new RequestSizeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Request body missing");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    bytes += result.value.length;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new RequestSizeError();
    }
    chunks.push(result.value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const newSessionToken = () => randomBytes(32).toString("hex");

export async function hashPassword(password: string) {
  const salt = randomBytes(24).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt-v1:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":");
  if (
    parts.length !== 3 ||
    parts[0] !== "scrypt-v1" ||
    !/^[a-f0-9]{48}$/.test(parts[1]) ||
    !/^[a-f0-9]{128}$/.test(parts[2]) ||
    password.length > 256
  )
    return false;
  const actual = (await scrypt(password, parts[1], 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(parts[2], "hex"));
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return (
      parsed.origin === new URL(request.url).origin ||
      parsed.origin === process.env.NEXT_PUBLIC_SITE_URL ||
      (parsed.host === request.headers.get("host") &&
        parsed.protocol === new URL(request.url).protocol)
    );
  } catch {
    return false;
  }
}
