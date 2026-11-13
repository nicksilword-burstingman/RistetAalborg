import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_LIFETIME_SECONDS,
  adminPasswordHash,
  secureAdminCookie,
} from "@/lib/server/admin";
import { getDatabase } from "@/lib/server/database";
import {
  digest,
  isSameOrigin,
  newSessionToken,
  readBoundedJson,
  RequestSizeError,
  verifyPassword,
} from "@/lib/server/security";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403 },
    );
  const hash = adminPasswordHash();
  if (!hash)
    return NextResponse.json(
      { error: "Administratoradgangen er ikke oprettet endnu." },
      { status: 503 },
    );
  const db = getDatabase();
  db.prepare("DELETE FROM login_attempts WHERE attempted_at < ?").run(
    Date.now() - 15 * 60 * 1000,
  );
  const attempts = db
    .prepare("SELECT COUNT(*) AS total FROM login_attempts")
    .get();
  if (Number(attempts?.total) >= 10)
    return NextResponse.json(
      { error: "For mange loginforsøg. Prøv igen om 15 minutter." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  db.prepare("INSERT INTO login_attempts(attempted_at) VALUES (?)").run(
    Date.now(),
  );
  let body: unknown;
  try {
    body = await readBoundedJson(request, 4096);
  } catch (error) {
    if (error instanceof RequestSizeError)
      return NextResponse.json({ error: "Ugyldigt login." }, { status: 413 });
    return NextResponse.json({ error: "Ugyldigt login." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("password" in body) ||
    typeof body.password !== "string" ||
    !(await verifyPassword(body.password, hash))
  )
    return NextResponse.json(
      { error: "Adgangskoden er ikke korrekt." },
      { status: 401 },
    );
  db.prepare("DELETE FROM login_attempts").run();
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").run(
    Date.now(),
  );
  const token = newSessionToken();
  db.prepare("INSERT INTO admin_sessions VALUES (?, ?, 'owner', ?)").run(
    digest(token),
    digest(hash),
    Date.now() + SESSION_LIFETIME_SECONDS * 1000,
  );
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: secureAdminCookie(request),
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
