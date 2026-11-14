import { z } from "zod";

export const subscriptionSchema = z
  .object({
    method: z.enum(["espresso", "filter", "mixed"]),
    grams: z.union([z.literal(250), z.literal(500), z.literal(1000)]),
    weeks: z.union([z.literal(2), z.literal(4), z.literal(6)]),
    coffee: z.enum(["roaster", "guatemala", "ethiopia", "brazil"]),
    quantity: z.number().int().min(1).max(4),
  })
  .strict();
export type SubscriptionSelection = z.infer<typeof subscriptionSchema>;
export const subscriptionListSchema = z.array(subscriptionSchema).max(12);
export const subscriptionSettingsSchema = z
  .object({
    prices: z
      .object({
        "250": z.number().int().min(100).max(1000000),
        "500": z.number().int().min(100).max(1000000),
        "1000": z.number().int().min(100).max(1000000),
      })
      .strict(),
  })
  .strict();
export type SubscriptionSettings = z.infer<typeof subscriptionSettingsSchema>;
export const defaultSubscriptionSettings: SubscriptionSettings = {
  prices: { "250": 8000, "500": 15000, "1000": 27900 },
};
export const defaultSubscription: SubscriptionSelection = {
  method: "mixed",
  grams: 1000,
  weeks: 4,
  coffee: "roaster",
  quantity: 1,
};
export const subscriptionMethods = {
  espresso: "Espresso",
  filter: "Filter",
  mixed: "Blandet",
};
export const subscriptionCoffees = {
  roaster: "Risterens valg",
  guatemala: "Guatemala Antigua",
  ethiopia: "Ethiopia Guji Shakisso",
  brazil: "Brazil Selection",
};
export function subscriptionKey(item: SubscriptionSelection) {
  return `${item.method}:${item.grams}:${item.weeks}:${item.coffee}`;
}
export function parseSubscriptions(input: unknown): SubscriptionSelection[] {
  const result = subscriptionListSchema.safeParse(input);
  if (!result.success) return [];
  const entries = new Map<string, SubscriptionSelection>();
  for (const selection of result.data) {
    const key = subscriptionKey(selection);
    entries.set(key, {
      ...selection,
      quantity: Math.min(
        4,
        (entries.get(key)?.quantity ?? 0) + selection.quantity,
      ),
    });
  }
  return [...entries.values()];
}
export function saveSubscriptionSelection(
  items: SubscriptionSelection[],
  input: SubscriptionSelection,
  previousKey?: string,
) {
  const selection = subscriptionSchema.parse(input);
  const remaining = items.filter(
    (item) => subscriptionKey(item) !== previousKey,
  );
  const existing = remaining.find(
    (item) => subscriptionKey(item) === subscriptionKey(selection),
  );
  if (
    (existing?.quantity ?? 0) + selection.quantity > 4 ||
    (!existing && remaining.length >= 12)
  )
    throw new RangeError(
      "Der er plads til 12 kaffevalg og højst 4 af hvert i kurven.",
    );
  return existing
    ? remaining.map((item) =>
        subscriptionKey(item) === subscriptionKey(selection)
          ? { ...item, quantity: item.quantity + selection.quantity }
          : item,
      )
    : [...remaining, selection];
}
export function subscriptionPrice(
  selection: SubscriptionSelection,
  settings: SubscriptionSettings,
) {
  return (
    settings.prices[
      String(selection.grams) as keyof SubscriptionSettings["prices"]
    ] * selection.quantity
  );
}
