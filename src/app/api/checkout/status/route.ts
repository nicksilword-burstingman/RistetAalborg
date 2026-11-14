import { NextResponse } from "next/server";
import { checkoutOwner, privateHeaders } from "@/lib/server/checkout-http";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const owner = await checkoutOwner();
  const id = new URL(request.url).searchParams.get("session_id");
  const order =
    owner && id && /^cs_(test_|live_)?[a-zA-Z0-9]{10,200}$/.test(id)
      ? orderRepository(getDatabase()).bySession(id, owner)
      : null;
  if (!order)
    return NextResponse.json(
      {
        error:
          "Bestillingen findes ikke i denne browser. Brug den browser, hvor du startede købet.",
      },
      { status: 404, headers: privateHeaders },
    );
  return NextResponse.json(
    {
      id: order.id,
      number: order.number,
      status: order.status,
      mode: order.mode,
      customer: order.customer,
      quote: order.quote,
      refundedOre: order.refundedOre,
    },
    { headers: privateHeaders },
  );
}
