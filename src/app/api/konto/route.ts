import { NextResponse } from "next/server";
import { customerSession } from "@/lib/server/customer-auth";
import { getDatabase } from "@/lib/server/database";
import { customerRepository } from "@/lib/server/customer-repository";
import { isSameOrigin, readBoundedJson } from "@/lib/server/security";
import { privateHeaders } from "@/lib/server/checkout-http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await customerSession(request.headers);
  if (!session)
    return NextResponse.json({ user: null }, { headers: privateHeaders });
  const repo = customerRepository(getDatabase());
  return NextResponse.json(
    {
      user: {
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
      },
      profile: repo.profile(session.user.id),
      orders: repo.orders(session.user.id),
    },
    { headers: privateHeaders },
  );
}
export async function PUT(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403, headers: privateHeaders },
    );
  const session = await customerSession(request.headers);
  if (!session)
    return NextResponse.json(
      { error: "Log ind for at gemme din profil." },
      { status: 401, headers: privateHeaders },
    );
  try {
    const profile = customerRepository(getDatabase()).save(
      session.user.id,
      await readBoundedJson(request, 10000),
    );
    return NextResponse.json({ profile }, { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { error: "Kontrollér din adresse og dine kaffevalg." },
      { status: 400, headers: privateHeaders },
    );
  }
}
