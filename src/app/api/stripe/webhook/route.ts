import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/server/stripe-payments";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";
import { reconcileStripeEvent } from "@/lib/server/stripe-reconciliation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !process.env.STRIPE_SECRET_KEY)
    return new NextResponse(null, { status: 503 });
  if (!signature) return new NextResponse(null, { status: 400 });
  // Do not parse JSON before verifying the signature over the bounded raw bytes.
  const reader = request.body?.getReader();
  if (!reader || Number(request.headers.get("content-length")) > 1000000)
    return new NextResponse(null, { status: 413 });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.length;
    if (bytes > 1000000) {
      await reader.cancel();
      return new NextResponse(null, { status: 413 });
    }
    chunks.push(part.value);
  }
  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.concat(chunks),
      signature,
      secret,
    );
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const repo = orderRepository(getDatabase());
  try {
    await reconcileStripeEvent(repo, event, (id) =>
      stripe.charges.retrieve(id),
    );
    return NextResponse.json({ received: true });
  } catch {
    console.error("Stripe event awaiting retry", {
      eventId: event.id,
      type: event.type,
    });
    return new NextResponse(null, { status: 500 });
  }
}
