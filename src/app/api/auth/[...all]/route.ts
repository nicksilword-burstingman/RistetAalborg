import { customerAuth } from "@/lib/server/customer-auth";
import { getDatabase } from "@/lib/server/database";
import { digest, isSameOrigin, readBoundedJson } from "@/lib/server/security";
import { privateHeaders } from "@/lib/server/checkout-http";
import { z } from "zod";
export const runtime = "nodejs";
const allowed = new Set([
  "sign-up/email",
  "sign-in/email",
  "sign-out",
  "get-session",
  "change-password",
]);
async function handle(request: Request) {
  const endpoint = new URL(request.url).pathname.replace(/^\/api\/auth\//, "");
  const fail = (error: string, status: number) =>
    Response.json({ error }, { status, headers: privateHeaders });
  if (!allowed.has(endpoint))
    return fail("Denne kontofunktion er ikke åben endnu.", 404);
  if (request.method === "POST") {
    if (!isSameOrigin(request)) return fail("Anmodningen blev afvist.", 403);
    let body: unknown;
    try {
      body = await readBoundedJson(request, 8000);
    } catch {
      return fail("Oplysningerne kunne ikke læses.", 400);
    }
    if (endpoint === "sign-up/email") {
      const parsed = z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.email().max(254),
          password: z.string().min(12).max(128),
        })
        .strict()
        .safeParse(body);
      if (!parsed.success)
        return fail(
          "Kontrollér navn, e-mail og adgangskode på mindst 12 tegn.",
          400,
        );
      body = parsed.data;
    }
    const db = getDatabase();
    const now = Date.now();
    db.prepare("DELETE FROM customer_auth_attempts WHERE attempted_at < ?").run(
      now - 15 * 60000,
    );
    const email =
      body &&
      typeof body === "object" &&
      "email" in body &&
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const key = digest(`${endpoint}:${email}`);
    const count = db
      .prepare("SELECT count(*) AS n FROM customer_auth_attempts WHERE key=?")
      .get(key);
    const total = db
      .prepare("SELECT count(*) AS n FROM customer_auth_attempts")
      .get();
    if (Number(count?.n) >= (email ? 12 : 80) || Number(total?.n) >= 200)
      return fail("For mange forsøg. Vent 15 minutter, og prøv igen.", 429);
    db.prepare(
      "INSERT INTO customer_auth_attempts(key,attempted_at) VALUES(?,?)",
    ).run(key, now);
    const forwarded = new Headers(request.headers);
    forwarded.delete("content-length");
    request = new Request(request.url, {
      method: "POST",
      headers: forwarded,
      body: JSON.stringify(body),
    });
  }
  const response = await (await customerAuth()).handler(request);
  for (const [key, value] of Object.entries(privateHeaders))
    response.headers.set(key, value);
  return response;
}
export { handle as GET, handle as POST };
