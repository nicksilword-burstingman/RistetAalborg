import { NextResponse } from "next/server";
import { checkoutInputSchema, buildOrderQuote } from "@/lib/checkout";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";
import { paymentConfiguration } from "@/lib/server/checkout-config";
import { checkoutOwner, privateHeaders } from "@/lib/server/checkout-http";
import { stripeClient, checkoutParameters } from "@/lib/server/stripe-payments";
import { customerSession } from "@/lib/server/customer-auth";
import {
  digest,
  isSameOrigin,
  readBoundedJson,
  RequestSizeError,
} from "@/lib/server/security";

export const runtime = "nodejs";
const reply = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: privateHeaders });
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply("Anmodningen blev afvist.", 403);
  const ownerHash = await checkoutOwner();
  if (!ownerHash)
    return reply("Tillad nødvendige cookies, og genindlæs kassen.", 401);
  const repo = orderRepository(getDatabase());
  if (!repo.allowAttempt(ownerHash))
    return reply(
      "Der er sendt flere betalingsforsøg. Vent lidt, før du prøver igen.",
      429,
    );
  const settings = repo.settings();
  const config = paymentConfiguration(settings);
  if (!config.ready || config.mode === "disabled")
    return reply(
      "Betaling er ikke klar endnu. Der er ikke trukket penge.",
      503,
    );
  let input;
  try {
    const result = checkoutInputSchema.safeParse(
      await readBoundedJson(request, 24000),
    );
    if (!result.success)
      return reply(
        "Kontrollér kontaktoplysninger, dansk adresse, kurv og handelsbetingelser.",
        400,
      );
    input = result.data;
  } catch (error) {
    return reply(
      "Bestillingen kunne ikke læses.",
      error instanceof RequestSizeError ? 413 : 400,
    );
  }
  let quote;
  try {
    quote = buildOrderQuote(input.items, input.shippingId, settings);
  } catch {
    return reply(
      "Leveringsformen er ændret. Genindlæs kassen og vælg levering igen.",
      409,
    );
  }
  if (digest(JSON.stringify(quote)) !== input.quoteId)
    return reply(
      "Prisen eller fragten er ændret. Genindlæs kassen og gennemgå den nye pris.",
      409,
    );
  const payloadHash = digest(JSON.stringify(input));
  let order = repo.byRequest(ownerHash, input.requestId);
  if (
    order &&
    (order.payloadHash !== payloadHash || order.mode !== config.mode)
  )
    return reply("Bestillingen er ændret. Genindlæs kassen.", 409);
  if (
    order &&
    (order.status !== "pending" || Date.now() - order.createdAt > 50 * 60000)
  )
    return reply(
      "Dette betalingsforsøg er afsluttet eller udløbet. Genindlæs kassen for at starte et nyt.",
      409,
    );
  const account = await customerSession(request.headers);
  order ??= repo.create({
    customerId: account?.user.id,
    ownerHash,
    requestId: input.requestId,
    payloadHash,
    mode: config.mode,
    mobilePay: config.mobilePay,
    customer: input.customer,
    quote,
    siteUrl: config.siteUrl,
    termsVersion: config.termsVersion,
  });
  if (order.stripeCheckoutUrl)
    return NextResponse.json(
      { url: order.stripeCheckoutUrl },
      { headers: privateHeaders },
    );
  try {
    const session = await stripeClient().checkout.sessions.create(
      checkoutParameters(order),
      { idempotencyKey: `ristet-checkout-${order.id}` },
    );
    if (!session.url || session.livemode !== (order.mode === "live"))
      throw new Error("Unexpected Stripe checkout mode");
    repo.attachSession(order.id, session.id, session.url);
    return NextResponse.json({ url: session.url }, { headers: privateHeaders });
  } catch (error) {
    // Never log Stripe payloads, customer details, keys or checkout URLs.
    console.error("Checkout provider request failed", {
      orderId: order.id,
      kind: error instanceof Error ? error.name : "unknown",
    });
    return reply(
      "Betalingssiden kunne ikke åbnes. Prøv igen. Bestillingen er ikke bekræftet betalt.",
      502,
    );
  }
}
