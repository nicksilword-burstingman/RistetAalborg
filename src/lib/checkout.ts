import { z } from "zod";
import { cartItemKey, cartItemSchema, quoteCart, type CartItem } from "./cart";
import { MAX_BAGS, products } from "./catalog";

export const shippingMethodSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,40}$/),
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().min(2).max(240),
    amountOre: z.number().int().min(0).max(100000),
    freeAboveOre: z.number().int().min(0).max(1000000).nullable(),
  })
  .strict();

export const checkoutSettingsSchema = z
  .object({
    shippingMethods: z.array(shippingMethodSchema).max(6),
    termsReady: z.boolean(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      new Set(value.shippingMethods.map((m) => m.id)).size !==
      value.shippingMethods.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Fragtvalg skal have forskellige ID'er.",
      });
  });
export type CheckoutSettings = z.infer<typeof checkoutSettingsSchema>;
export const defaultCheckoutSettings: CheckoutSettings = {
  shippingMethods: [],
  termsReady: false,
};
export type ShippingMethod = z.infer<typeof shippingMethodSchema>;
export type CheckoutMode = "disabled" | "test" | "live";

export const checkoutItemsSchema = z
  .array(cartItemSchema.strict())
  .min(1)
  .max(48)
  .superRefine((items, ctx) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product?.variants.some((v) => v.grams === item.grams))
        ctx.addIssue({
          code: "custom",
          message: "En kaffe eller posestørrelse findes ikke længere.",
        });
      if (item.support)
        ctx.addIssue({
          code: "custom",
          message:
            "Støttekøb åbner, når formål og vilkår er bekræftet. Vælg kaffen fra SHOP imens.",
        });
      const key = cartItemKey(item);
      const total = (counts.get(key) ?? 0) + item.quantity;
      counts.set(key, total);
      if (total > MAX_BAGS)
        ctx.addIssue({
          code: "custom",
          message: "Der kan højst bestilles 99 af samme pose.",
        });
    }
  });

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Fjern ugyldige tegn.");
export const customerSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    firstName: text(80),
    lastName: text(80),
    phone: z
      .string()
      .trim()
      .max(25)
      .refine((v) => v === "" || /^\+?[\d ()-]{8,25}$/.test(v)),
    address: text(120),
    address2: z
      .string()
      .trim()
      .max(120)
      .refine((v) => !/[\u0000-\u001f\u007f]/.test(v)),
    postalCode: z.string().regex(/^[1-9]\d{3}$/),
    city: text(80),
    country: z.literal("DK"),
  })
  .strict();
export type CheckoutCustomer = z.infer<typeof customerSchema>;
export const quoteInputSchema = z
  .object({ items: checkoutItemsSchema, shippingId: z.string().max(40) })
  .strict();
export const checkoutInputSchema = quoteInputSchema.extend({
  customer: customerSchema,
  acceptTerms: z.literal(true),
  requestId: z.uuid(),
  quoteId: z.string().regex(/^[a-f0-9]{64}$/),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export type OrderLine = {
  productId: string;
  name: string;
  method: string;
  bags: { sku: string; grams: number; quantity: number }[];
  regularOre: number;
  discountOre: number;
  totalOre: number;
  vatOre: number;
};
export type OrderQuote = {
  currency: "dkk";
  vatRateBps: 2500;
  lines: OrderLine[];
  shipping: ShippingMethod & { totalOre: number; vatOre: number };
  subtotalOre: number;
  discountOre: number;
  shippingOre: number;
  totalOre: number;
  vatOre: number;
};

// All amounts are integer øre. Inclusive Danish VAT is retained in the order snapshot.
export function buildOrderQuote(
  items: CartItem[],
  shippingId: string,
  settings: CheckoutSettings,
): OrderQuote {
  const validated = checkoutItemsSchema.parse(items);
  const method = settings.shippingMethods.find((m) => m.id === shippingId);
  if (!method) throw new Error("Vælg en tilgængelig leveringsform.");
  const cart = quoteCart(validated);
  const shippingOre =
    method.freeAboveOre !== null && cart.totalOre >= method.freeAboveOre
      ? 0
      : method.amountOre;
  const lines: OrderLine[] = cart.groups.map((g) => ({
    productId: g.product.id,
    name: g.product.name,
    method: g.product.method,
    bags: g.items.map((item) => ({
      sku: g.product.variants.find((v) => v.grams === item.grams)!.sku,
      grams: item.grams,
      quantity: item.quantity,
    })),
    regularOre: g.regularOre,
    discountOre: g.discountOre,
    totalOre: g.totalOre,
    vatOre: Math.round(g.totalOre / 5),
  }));
  const shippingVat = Math.round(shippingOre / 5);
  return {
    currency: "dkk",
    vatRateBps: 2500,
    lines,
    shipping: { ...method, totalOre: shippingOre, vatOre: shippingVat },
    subtotalOre: cart.totalOre,
    discountOre: cart.discountOre,
    shippingOre,
    totalOre: cart.totalOre + shippingOre,
    vatOre: lines.reduce((sum, line) => sum + line.vatOre, shippingVat),
  };
}

export const orderStatuses = {
  pending: "Afventer betaling",
  paid: "Betalt",
  expired: "Betaling udløbet",
} as const;
export type OrderStatus = keyof typeof orderStatuses;
