import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/server/admin";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";
import { isSameOrigin, readBoundedJson } from "@/lib/server/security";
import { privateHeaders } from "@/lib/server/checkout-http";

export const runtime = "nodejs";
export async function PATCH(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403, headers: privateHeaders },
    );
  if (!(await getAdminSession()))
    return NextResponse.json(
      { error: "Log ind igen for at ændre ordren." },
      { status: 401, headers: privateHeaders },
    );
  try {
    const input = z
      .object({ id: z.uuid(), action: z.literal("ship") })
      .strict()
      .parse(await readBoundedJson(request, 2000));
    if (!orderRepository(getDatabase()).ship(input.id))
      return NextResponse.json(
        {
          error:
            "Kun betalte, ikke-refunderede og endnu ikke afsendte ordrer kan markeres afsendt.",
        },
        { status: 409, headers: privateHeaders },
      );
    return NextResponse.json({ saved: true }, { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { error: "Ordren kunne ikke ændres." },
      { status: 400, headers: privateHeaders },
    );
  }
}
