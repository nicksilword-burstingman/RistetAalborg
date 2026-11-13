import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/server/admin";
import { getDatabase } from "@/lib/server/database";
import { digest, isSameOrigin } from "@/lib/server/security";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403 },
    );
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token)
    getDatabase()
      .prepare("DELETE FROM admin_sessions WHERE token_hash=?")
      .run(digest(token));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
