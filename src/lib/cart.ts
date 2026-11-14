import { z } from "zod";
import { bagSizes, MAX_BAGS, products, type Product } from "./catalog";
import { quoteCoffee } from "./pricing";
import { supportCampaign } from "./support";

export const cartItemSchema = z.object({
  productId: z.string().max(80),
  grams: z
    .number()
    .int()
    .refine((grams) => bagSizes.some((size) => size === grams)),
  quantity: z.number().int().min(1).max(MAX_BAGS),
  support: z.boolean(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export const CART_STORAGE_KEY = "ristet-cart-v1";

export function cartItemKey(
  item: Pick<CartItem, "productId" | "grams" | "support">,
) {
  return `${item.productId}:${item.grams}:${item.support ? "support" : "shop"}`;
}

export function parseCart(input: unknown): CartItem[] {
  const parsed = z
    .array(cartItemSchema)
    .max(products.length * bagSizes.length * 2)
    .safeParse(input);
  if (!parsed.success) return [];
  const unique = new Map<string, CartItem>();
  for (const item of parsed.data) {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product?.variants.some((variant) => variant.grams === item.grams))
      continue;
    const key = cartItemKey(item);
    const existing = unique.get(key);
    unique.set(key, {
      ...item,
      quantity: Math.min(MAX_BAGS, item.quantity + (existing?.quantity ?? 0)),
    });
  }
  return [...unique.values()];
}

export function addCartItem(items: CartItem[], input: CartItem) {
  const item = cartItemSchema.parse(input);
  const existing = items.find(
    (entry) => cartItemKey(entry) === cartItemKey(item),
  );
  if ((existing?.quantity ?? 0) + item.quantity > MAX_BAGS)
    throw new RangeError("Der kan højst ligge 99 af samme pose i kurven.");
  return parseCart([...items, item]);
}

export type CartGroup = {
  key: string;
  product: Product;
  support: boolean;
  items: CartItem[];
  totalGrams: number;
  quantity: number;
  regularOre: number;
  coffeeOre: number;
  supportOre: number;
  discountOre: number;
  totalOre: number;
};

export function quoteCart(input: CartItem[]) {
  const groups = new Map<string, CartGroup>();
  for (const item of parseCart(input)) {
    const product = products.find((entry) => entry.id === item.productId)!;
    const key = `${item.productId}:${item.support}`;
    const group = groups.get(key) ?? {
      key,
      product,
      support: item.support,
      items: [],
      totalGrams: 0,
      quantity: 0,
      regularOre: 0,
      coffeeOre: 0,
      supportOre: 0,
      discountOre: 0,
      totalOre: 0,
    };
    group.items.push(item);
    group.totalGrams += item.grams * item.quantity;
    group.quantity += item.quantity;
    group.regularOre +=
      product.variants.find((variant) => variant.grams === item.grams)!
        .priceOre * item.quantity;
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    group.coffeeOre = quoteCoffee(group.product, group.totalGrams);
    group.supportOre = group.support
      ? group.quantity * supportCampaign.contributionOre
      : 0;
    group.discountOre = group.regularOre - group.coffeeOre;
    group.totalOre = group.coffeeOre + group.supportOre;
  }
  const result = [...groups.values()];
  return {
    groups: result,
    quantity: result.reduce((total, group) => total + group.quantity, 0),
    totalGrams: result.reduce((total, group) => total + group.totalGrams, 0),
    discountOre: result.reduce((total, group) => total + group.discountOre, 0),
    supportOre: result.reduce((total, group) => total + group.supportOre, 0),
    totalOre: result.reduce((total, group) => total + group.totalOre, 0),
  };
}
