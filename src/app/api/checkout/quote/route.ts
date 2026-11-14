import { NextResponse } from "next/server";
import { quoteInputSchema, buildOrderQuote } from "@/lib/checkout";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";
import {
  isSameOrigin,
  readBoundedJson,
  digest,
  RequestSizeError,
} from "@/lib/server/security";
import { privateHeaders } from "@/lib/server/checkout-http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403, headers: privateHeaders },
    );
  try {
    const parsed = quoteInputSchema.safeParse(
      await readBoundedJson(request, 20000),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Kontrollér din kurv." },
        { status: 400, headers: privateHeaders },
      );
    const settings = orderRepository(getDatabase()).settings();
    const quote = buildOrderQuote(
      parsed.data.items,
      parsed.data.shippingId,
      settings,
    );
    return NextResponse.json(
      { quote, quoteId: digest(JSON.stringify(quote)) },
      { headers: privateHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RequestSizeError
            ? "Kurven er for stor."
            : "Prisen kunne ikke beregnes. Kontrollér dit fragtvalg og prøv igen.",
      },
      {
        status: error instanceof RequestSizeError ? 413 : 400,
        headers: privateHeaders,
      },
    );
  }
}
