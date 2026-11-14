import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "../src/lib/server/database";
import { customerRepository } from "../src/lib/server/customer-repository";
import {
  defaultSubscription,
  defaultSubscriptionSettings,
  parseSubscriptions,
  saveSubscriptionSelection,
  subscriptionKey,
  subscriptionPrice,
  subscriptionSchema,
  type SubscriptionSelection,
} from "../src/lib/subscriptions";
import { addCartItem, quoteCart } from "../src/lib/cart";
import { customerProfileSchema } from "../src/lib/customer-profile";

test("subscription choices reject prices, unsupported schedules, ground coffee and oversized lists", () => {
  for (const patch of [
    { weeks: 3 },
    { grams: 3000 },
    { quantity: 5 },
    { coffee: "unknown" },
    { priceOre: 1 },
    { grind: "filter" },
  ])
    assert.equal(
      subscriptionSchema.safeParse({ ...defaultSubscription, ...patch })
        .success,
      false,
    );
  assert.deepEqual(parseSubscriptions(Array(13).fill(defaultSubscription)), []);
});
test("subscriptions keep their schedule and price separate from one-off quantity tiers", () => {
  const normal = addCartItem([], {
    productId: "guatemala",
    grams: 500,
    quantity: 2,
    support: false,
  });
  assert.equal(quoteCart(normal).totalOre, 28000);
  const subscription = { ...defaultSubscription, quantity: 2 };
  assert.equal(
    subscriptionPrice(subscription, defaultSubscriptionSettings),
    55800,
  );
  assert.equal(
    subscriptionPrice(
      { ...subscription, grams: 500 },
      { prices: { "250": 9000, "500": 15500, "1000": 29900 } },
    ),
    31000,
  );
});
test("editing subscriptions replaces the old selection and merges matching choices without overflowing", () => {
  const current = saveSubscriptionSelection([], defaultSubscription);
  const edited = saveSubscriptionSelection(
    current,
    { ...defaultSubscription, weeks: 2 },
    subscriptionKey(defaultSubscription),
  );
  assert.equal(edited.length, 1);
  assert.equal(edited[0].weeks, 2);
  assert.equal(
    saveSubscriptionSelection(current, defaultSubscription)[0].quantity,
    2,
  );
  assert.throws(
    () =>
      saveSubscriptionSelection(
        [{ ...defaultSubscription, quantity: 4 }],
        defaultSubscription,
      ),
    RangeError,
  );
});
test("customer profiles are isolated by authenticated user ID and survive repeat migrations", () => {
  const db = new DatabaseSync(":memory:");
  initializeDatabase(db);
  const repo = customerRepository(db);
  repo.save("customer-a", {
    address: null,
    subscriptions: [defaultSubscription],
  });
  initializeDatabase(db);
  assert.equal(repo.profile("customer-a").subscriptions.length, 1);
  assert.deepEqual(repo.profile("customer-b").subscriptions, []);
  assert.deepEqual(repo.orders("customer-b"), []);
  assert.equal(
    customerProfileSchema.safeParse({
      address: null,
      subscriptions: [],
      userId: "customer-a",
    }).success,
    false,
  );
  db.close();
});

test("adding an existing subscription to a full cart preserves every selection", () => {
  const choices: SubscriptionSelection[] = ([2, 4, 6] as const).flatMap(
    (weeks) =>
      (["roaster", "guatemala", "ethiopia", "brazil"] as const).map(
        (coffee) => ({ ...defaultSubscription, weeks, coffee }),
      ),
  );
  const updated = saveSubscriptionSelection(choices, choices[0]);
  assert.equal(updated.length, 12);
  assert.equal(updated[0].quantity, 2);
  assert.deepEqual(updated.slice(1), choices.slice(1));
  assert.throws(
    () =>
      saveSubscriptionSelection(choices, {
        ...defaultSubscription,
        method: "filter",
      }),
    RangeError,
  );
});
