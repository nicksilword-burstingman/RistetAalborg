import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { dataDirectory, getDatabase } from "./database";
import { digest } from "./security";

export const ADMIN_COOKIE = "ristet_admin_session";
export const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;

export function adminPasswordHash() {
  if (process.env.ADMIN_PASSWORD_HASH) return process.env.ADMIN_PASSWORD_HASH;
  try {
    return readFileSync(
      path.join(dataDirectory(), "admin-password.hash"),
      "utf8",
    ).trim();
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const credential = adminPasswordHash();
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !credential) return null;
  const session = getDatabase()
    .prepare(
      "SELECT role, expires_at, credential_hash FROM admin_sessions WHERE token_hash=?",
    )
    .get(digest(token));
  if (
    !session ||
    session.role !== "owner" ||
    Number(session.expires_at) <= Date.now() ||
    session.credential_hash !== digest(credential)
  )
    return null;
  return { role: "owner" as const };
}

export function secureAdminCookie(request: Request) {
  return (
    new URL(request.url).protocol === "https:" ||
    Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"))
  );
}
