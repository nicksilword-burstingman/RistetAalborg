import type Stripe from "stripe";
import { formatWeight } from "./catalog";
import type { StoredOrder } from "./server/order-repository";

// Pure mapping from the immutable order. Retry requests must send the same parameters.
export function checkoutParameters(
  order: StoredOrder,
): Stripe.Checkout.SessionCreateParams {
  const { customer, quote } = order;
  return {
    mode: "payment",
    locale: "da",
    currency: "dkk",
    client_reference_id: order.id,
    metadata: { order_id: order.id, order_number: order.number },
    customer_email: customer.email,
    allowed_payment_method_types: order.mobilePay
      ? ["card", "mobilepay"]
      : ["card"],
    line_items: quote.lines.map((line) => ({
      quantity: 1,
      price_data: {
        currency: "dkk",
        unit_amount: line.totalOre,
        tax_behavior: "inclusive",
        product_data: {
          name: `${line.name} · ${line.method}`,
          description: line.bags
            .map(
              (bag) =>
                `${bag.quantity} × ${formatWeight(bag.grams)} hele bønner`,
            )
            .join(", "),
        },
      },
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: quote.shipping.name,
          tax_behavior: "inclusive",
          fixed_amount: { amount: quote.shippingOre, currency: "dkk" },
        },
      },
    ],
    payment_intent_data: {
      metadata: { order_id: order.id },
      shipping: {
        name: `${customer.firstName} ${customer.lastName}`,
        ...(customer.phone ? { phone: customer.phone } : {}),
        address: {
          line1: customer.address,
          line2: customer.address2 || undefined,
          postal_code: customer.postalCode,
          city: customer.city,
          country: "DK",
        },
      },
    },
    success_url: `${order.siteUrl}/kasse/ordre?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${order.siteUrl}/kasse?afbrudt=1`,
    expires_at: Math.floor(order.createdAt / 1000) + 60 * 60,
  };
}
