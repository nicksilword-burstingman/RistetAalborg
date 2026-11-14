import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/admin";
import { isSameOrigin, readBoundedJson } from "@/lib/server/security";
import { saveSubscriptionSettings } from "@/lib/server/subscription-repository";
import { privateHeaders } from "@/lib/server/checkout-http";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  if (!isSameOrigin(request) || !(await getAdminSession()))
    return NextResponse.json(
      { error: "Log ind som administrator først." },
      { status: 403, headers: privateHeaders },
    );
  try {
    return NextResponse.json(
      {
        settings: saveSubscriptionSettings(
          await readBoundedJson(request, 2000),
        ),
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json(
      { error: "Kontrollér priserne, og prøv igen." },
      { status: 400, headers: privateHeaders },
    );
  }
}
