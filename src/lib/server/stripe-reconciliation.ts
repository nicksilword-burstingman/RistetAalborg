import type Stripe from "stripe";
import type { orderRepository } from "./order-repository";

// Only call with an event whose raw-body signature has already been verified.
export async function reconcileStripeEvent(
  repo: ReturnType<typeof orderRepository>,
  event: Stripe.Event,
  retrieveCharge: (id: string) => Promise<Stripe.Charge>,
) {
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.expired",
    ].includes(event.type)
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (!orderId || !repo.byId(orderId)) return false;
    if (
      session.client_reference_id !== orderId ||
      session.mode !== "payment" ||
      event.livemode !== session.livemode
    )
      throw new Error("Order reference mismatch");
    const expired = event.type === "checkout.session.expired";
    if (expired && session.status !== "expired") return false;
    if (
      !expired &&
      (session.payment_status !== "paid" || session.status !== "complete")
    )
      return false;
    return repo.applyPayment({
      id: event.id,
      type: expired ? "expired" : "paid",
      orderId,
      sessionId: session.id,
      amountOre: session.amount_total ?? -1,
      currency: session.currency ?? "",
      live: session.livemode,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    });
  }
  if (event.type === "charge.refunded") {
    const source = event.data.object as Stripe.Charge;
    if (!source.metadata?.order_id || !repo.byId(source.metadata.order_id))
      return false;
    const charge = await retrieveCharge(source.id);
    if (
      charge.metadata.order_id !== source.metadata.order_id ||
      event.livemode !== charge.livemode
    )
      throw new Error("Refund reference mismatch");
    return repo.applyRefund({
      id: event.id,
      paymentIntentId:
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? ""),
      amountOre: charge.amount_refunded,
      originalOre: charge.amount,
      currency: charge.currency,
      live: charge.livemode,
    });
  }
  return false;
}
