import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/admin";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";
import { checkoutSettingsSchema } from "@/lib/checkout";
import { isSameOrigin, readBoundedJson } from "@/lib/server/security";
import { privateHeaders } from "@/lib/server/checkout-http";

export const runtime = "nodejs";
export async function PUT(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403, headers: privateHeaders },
    );
  if (!(await getAdminSession()))
    return NextResponse.json(
      { error: "Log ind igen for at gemme." },
      { status: 401, headers: privateHeaders },
    );
  try {
    const parsed = checkoutSettingsSchema.safeParse(
      await readBoundedJson(request, 15000),
    );
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "Kontrollér fragtens navn, beskrivelse og beløb. Brug forskellige ID'er.",
        },
        { status: 400, headers: privateHeaders },
      );
    const settings = orderRepository(getDatabase()).saveSettings(parsed.data);
    return NextResponse.json(settings, { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { error: "Indstillingerne kunne ikke gemmes." },
      { status: 400, headers: privateHeaders },
    );
  }
}
