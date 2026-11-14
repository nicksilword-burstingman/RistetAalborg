import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import Stripe from "stripe";
import {
  buildOrderQuote,
  checkoutInputSchema,
  checkoutItemsSchema,
  checkoutSettingsSchema,
  customerSchema,
  type CheckoutSettings,
} from "../src/lib/checkout";
import { initializeDatabase } from "../src/lib/server/database";
import { orderRepository } from "../src/lib/server/order-repository";
import { reconcileStripeEvent } from "../src/lib/server/stripe-reconciliation";
import { checkoutParameters } from "../src/lib/stripe-checkout";
import { assessPaymentConfiguration } from "../src/lib/payment-configuration";

const settings: CheckoutSettings = {
  shippingMethods: [
    {
      id: "test-delivery",
      name: "Testlevering",
      description: "Kun en testpris",
      amountOre: 3900,
      freeAboveOre: 40000,
    },
  ],
  termsReady: false,
};
const items = [
  { productId: "guatemala", grams: 500, quantity: 2, support: false },
];
const customer = {
  email: "test@example.com",
  firstName: "Test",
  lastName: "Kunde",
  phone: "",
  address: "Testvej 1",
  address2: "",
  postalCode: "9000",
  city: "Aalborg",
  country: "DK" as const,
};
const shippingId = "test-delivery";
test("payment configuration fails closed and cannot mix test keys with live payments or publish draft products", () => {
  assert.equal(assessPaymentConfiguration(settings, {}).ready, false);
  const env = {
    RISTET_CHECKOUT_MODE: "test",
    STRIPE_SECRET_KEY: "sk_test_unit_fixture",
    STRIPE_WEBHOOK_SECRET: "whsec_unit_fixture",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  };
  assert.equal(assessPaymentConfiguration(settings, env).ready, true);
  for (const patch of [
    { STRIPE_SECRET_KEY: "sk_live_unit_fixture" },
    { STRIPE_WEBHOOK_SECRET: "" },
    { NEXT_PUBLIC_SITE_URL: "http://insecure.example" },
    { NEXT_PUBLIC_SITE_URL: "https://user:pass@example.com" },
    { RISTET_CHECKOUT_MODE: "other" },
  ])
    assert.equal(
      assessPaymentConfiguration(settings, { ...env, ...patch }).ready,
      false,
    );
  const live = assessPaymentConfiguration(
    { ...settings, termsReady: true },
    {
      ...env,
      RISTET_CHECKOUT_MODE: "live",
      STRIPE_SECRET_KEY: "sk_live_unit_fixture",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      RISTET_TERMS_VERSION: "approved-1",
    },
  );
  assert.equal(live.ready, false);
  assert.match(live.issues.join(" "), /kladder/);
  assert.equal(
    assessPaymentConfiguration({ ...settings, shippingMethods: [] }, env).ready,
    false,
  );
  assert.equal(
    JSON.stringify(assessPaymentConfiguration(settings, env)).includes(
      "sk_test",
    ),
    false,
  );
});
function setup() {
  const db = new DatabaseSync(":memory:");
  initializeDatabase(db);
  const repo = orderRepository(db);
  const order = repo.create({
    ownerHash: "test-owner",
    requestId: randomUUID(),
    payloadHash: "test-hash",
    mode: "test",
    mobilePay: false,
    customer,
    quote: buildOrderQuote(items, shippingId, settings),
    siteUrl: "http://localhost:3000",
    termsVersion: "test-terms",
  });
  return { db, repo, order };
}
function fixtureEvent(
  order: ReturnType<typeof setup>["order"],
  overrides: Record<string, unknown> = {},
  type = "checkout.session.completed",
): Stripe.Event {
  // Unit fixtures only. These are never sent to a running shop or Stripe.
  return {
    id: `evt_${randomUUID()}`,
    type,
    livemode: false,
    data: {
      object: {
        id: "cs_test_fixture1234567890",
        metadata: { order_id: order.id },
        client_reference_id: order.id,
        mode: "payment",
        status: "complete",
        payment_status: "paid",
        payment_intent: "pi_fixture",
        amount_total: order.quote.totalOre,
        currency: "dkk",
        livemode: false,
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}
const noCharge = async (): Promise<Stripe.Charge> => {
  throw new Error("Unexpected charge request");
};

test("checkout rejects unknown SKUs, modified client prices, unsupported support, quantities and foreign addresses", () => {
  assert.equal(checkoutItemsSchema.safeParse(items).success, true);
  for (const entry of [
    { ...items[0], productId: "missing" },
    { ...items[0], priceOre: 1 },
    { ...items[0], grams: 12 },
    { ...items[0], quantity: 0 },
    { ...items[0], support: true },
  ])
    assert.equal(checkoutItemsSchema.safeParse([entry]).success, false);
  assert.equal(
    checkoutItemsSchema.safeParse([
      { ...items[0], quantity: 70 },
      { ...items[0], quantity: 70 },
    ]).success,
    false,
  );
  assert.equal(
    customerSchema.safeParse({ ...customer, country: "SE" }).success,
    false,
  );
  assert.equal(
    customerSchema.safeParse({ ...customer, postalCode: "0000" }).success,
    false,
  );
  assert.equal(
    customerSchema.safeParse({ ...customer, address: "Test\nvej" }).success,
    false,
  );
  const input = {
    items,
    shippingId,
    customer,
    requestId: randomUUID(),
    quoteId: "a".repeat(64),
    acceptTerms: true,
  };
  assert.equal(checkoutInputSchema.safeParse(input).success, true);
  assert.equal(
    checkoutInputSchema.safeParse({ ...input, acceptTerms: false }).success,
    false,
  );
  assert.equal(
    checkoutInputSchema.safeParse({ ...input, totalOre: 1 }).success,
    false,
  );
});

test("server applies quantity prices, shipping thresholds after discounts, and inclusive VAT without floats", () => {
  const quote = buildOrderQuote(items, shippingId, settings);
  assert.equal(quote.subtotalOre, 28000);
  assert.equal(quote.discountOre, 2000);
  assert.equal(quote.shippingOre, 3900);
  assert.equal(quote.totalOre, 31900);
  assert.equal(quote.vatOre, 6380);
  assert.deepEqual(quote.lines[0].bags, [
    { sku: "GUA-ESPRESSO-500", grams: 500, quantity: 2 },
  ]);
  const larger = buildOrderQuote(
    [{ ...items[0], quantity: 3 }],
    shippingId,
    settings,
  );
  assert.equal(larger.subtotalOre, 43000);
  assert.equal(larger.shippingOre, 0);
  const threshold = {
    ...settings,
    shippingMethods: [{ ...settings.shippingMethods[0], freeAboveOre: 29000 }],
  };
  assert.equal(buildOrderQuote(items, shippingId, threshold).shippingOre, 3900);
  assert.throws(() =>
    buildOrderQuote(items, "invented-free-shipping", settings),
  );
  assert.throws(() =>
    buildOrderQuote(items, shippingId, { ...settings, shippingMethods: [] }),
  );
});

test("shipping configuration is persistent and cannot contain duplicate IDs, negative or fractional øre", () => {
  const { db, repo } = setup();
  try {
    assert.deepEqual(repo.settings(), {
      shippingMethods: [],
      termsReady: false,
    });
    repo.saveSettings(settings);
    assert.deepEqual(orderRepository(db).settings(), settings);
    for (const bad of [
      {
        ...settings,
        shippingMethods: [
          ...settings.shippingMethods,
          ...settings.shippingMethods,
        ],
      },
      {
        ...settings,
        shippingMethods: [{ ...settings.shippingMethods[0], amountOre: -1 }],
      },
      {
        ...settings,
        shippingMethods: [{ ...settings.shippingMethods[0], amountOre: 1.5 }],
      },
    ])
      assert.equal(checkoutSettingsSchema.safeParse(bad).success, false);
  } finally {
    db.close();
  }
});

test("order snapshots persist independently of later catalog settings; private receipts require their browser owner", () => {
  const { db, repo, order } = setup();
  try {
    repo.saveSettings({
      ...settings,
      shippingMethods: [{ ...settings.shippingMethods[0], amountOre: 9999 }],
    });
    repo.attachSession(
      order.id,
      "cs_test_fixture1234567890",
      "https://checkout.stripe.com/test-fixture",
    );
    assert.equal(
      repo.byRequest(order.ownerHash, order.requestId)!.id,
      order.id,
    );
    assert.equal(repo.byRequest("different-owner", order.requestId), null);
    assert.equal(
      repo.bySession("cs_test_fixture1234567890", "different-owner"),
      null,
    );
    assert.equal(
      repo.bySession("cs_test_fixture1234567890", order.ownerHash)!.quote
        .shippingOre,
      3900,
    );
    assert.throws(() => repo.create({ ...order }));
    assert.throws(() =>
      repo.attachSession(
        order.id,
        "cs_other",
        "https://checkout.stripe.com/other",
      ),
    );
    assert.equal(repo.ship(order.id), false);
    initializeDatabase(db);
    assert.equal(repo.byId(order.id)!.number, order.number);
  } finally {
    db.close();
  }
});

test("Stripe session parameters preserve discounted amounts, shipping address and a stable idempotent snapshot", () => {
  const { db, order } = setup();
  try {
    const params = checkoutParameters(order);
    assert.deepEqual(params, checkoutParameters(order));
    assert.equal(params.mode, "payment");
    assert.equal(params.locale, "da");
    assert.deepEqual(params.allowed_payment_method_types, ["card"]);
    assert.equal(params.line_items![0].price_data!.unit_amount, 28000);
    assert.equal(
      params.shipping_options![0].shipping_rate_data!.fixed_amount!.amount,
      3900,
    );
    assert.equal(params.payment_intent_data!.shipping!.address.country, "DK");
    assert.equal(
      params.payment_intent_data!.shipping!.address.postal_code,
      "9000",
    );
    assert.equal(params.allow_promotion_codes, undefined);
    assert.deepEqual(
      checkoutParameters({ ...order, mobilePay: true })
        .allowed_payment_method_types,
      ["card", "mobilepay"],
    );
    assert.match(params.success_url!, /\{CHECKOUT_SESSION_ID\}/);
    assert.equal(order.status, "pending");
  } finally {
    db.close();
  }
});

test("unpaid, incomplete and unrelated Stripe sessions cannot mark an order paid", async () => {
  const { db, repo, order } = setup();
  try {
    for (const override of [
      { payment_status: "unpaid" },
      { payment_status: "no_payment_required" },
      { status: "open" },
      { metadata: { order_id: "unknown" } },
    ])
      assert.equal(
        await reconcileStripeEvent(
          repo,
          fixtureEvent(order, override),
          noCharge,
        ),
        false,
      );
    assert.equal(repo.byId(order.id)!.status, "pending");
    assert.equal(
      Number(db.prepare("SELECT count(*) AS n FROM commerce_outbox").get()!.n),
      0,
    );
    for (const override of [
      { amount_total: 1 },
      { currency: "eur" },
      { livemode: true },
      { client_reference_id: "wrong" },
      { payment_intent: null },
    ])
      await assert.rejects(() =>
        reconcileStripeEvent(repo, fixtureEvent(order, override), noCharge),
      );
    assert.equal(repo.byId(order.id)!.status, "pending");
  } finally {
    db.close();
  }
});

test("verified paid events deduplicate across deliveries, preserve payment references and enqueue one accounting event", async () => {
  const { db, repo, order } = setup();
  try {
    const event = fixtureEvent(order);
    assert.equal(await reconcileStripeEvent(repo, event, noCharge), true);
    assert.equal(await reconcileStripeEvent(repo, event, noCharge), false);
    await reconcileStripeEvent(
      repo,
      fixtureEvent(order, {}, "checkout.session.async_payment_succeeded"),
      noCharge,
    );
    assert.equal(repo.byId(order.id)!.status, "paid");
    assert.equal(repo.byId(order.id)!.paymentIntentId, "pi_fixture");
    assert.equal(
      Number(db.prepare("SELECT count(*) AS n FROM commerce_outbox").get()!.n),
      1,
    );
    assert.deepEqual(repo.statistics(), {
      paidOrders: 0,
      revenueOre: 0,
      testOrders: 1,
    });
    await reconcileStripeEvent(
      repo,
      fixtureEvent(
        order,
        { status: "expired", payment_status: "unpaid", payment_intent: null },
        "checkout.session.expired",
      ),
      noCharge,
    );
    assert.equal(repo.byId(order.id)!.status, "paid");
    assert.equal(repo.ship(order.id), true);
    assert.equal(repo.ship(order.id), false);
  } finally {
    db.close();
  }
});

test("event failures roll back and a mismatched Stripe session cannot replace an attached session", async () => {
  const { db, repo, order } = setup();
  try {
    repo.attachSession(
      order.id,
      "cs_test_other1234567890",
      "https://checkout.stripe.com/test",
    );
    await assert.rejects(() =>
      reconcileStripeEvent(repo, fixtureEvent(order), noCharge),
    );
    assert.equal(
      Number(db.prepare("SELECT count(*) AS n FROM payment_events").get()!.n),
      0,
    );
    assert.equal(repo.byId(order.id)!.status, "pending");
  } finally {
    db.close();
  }
});

test("refunds await paid events, reconcile current provider amounts, deduplicate and do not regress", async () => {
  const { db, repo, order } = setup();
  try {
    const event = {
      id: "evt_refund",
      type: "charge.refunded",
      livemode: false,
      data: { object: { id: "ch_fixture", metadata: { order_id: order.id } } },
    } as unknown as Stripe.Event;
    const charge = {
      id: "ch_fixture",
      metadata: { order_id: order.id },
      payment_intent: "pi_fixture",
      amount: order.quote.totalOre,
      amount_refunded: 8000,
      currency: "dkk",
      livemode: false,
    } as unknown as Stripe.Charge;
    await assert.rejects(() =>
      reconcileStripeEvent(repo, event, async () => charge),
    );
    await reconcileStripeEvent(repo, fixtureEvent(order), noCharge);
    await reconcileStripeEvent(repo, event, async () => charge);
    assert.equal(repo.byId(order.id)!.refundedOre, 8000);
    assert.equal(
      await reconcileStripeEvent(repo, event, async () => charge),
      false,
    );
    await reconcileStripeEvent(
      repo,
      { ...event, id: "evt_older" } as Stripe.Event,
      async () => ({ ...charge, amount_refunded: 1000 }),
    );
    assert.equal(repo.byId(order.id)!.refundedOre, 8000);
    assert.equal(repo.ship(order.id), false);
    assert.equal(
      Number(
        db
          .prepare(
            "SELECT count(*) AS n FROM commerce_outbox WHERE kind='order.refunded'",
          )
          .get()!.n,
      ),
      1,
    );
  } finally {
    db.close();
  }
});

test("Stripe signatures reject changed raw bodies, wrong secrets and stale signatures", () => {
  const stripe = new Stripe("sk_test_unit_fixture_not_a_real_key");
  const secret = "whsec_unit_fixture_not_a_real_secret";
  const payload = JSON.stringify({
    id: "evt_unit",
    object: "event",
    type: "checkout.session.completed",
    data: { object: {} },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(
    stripe.webhooks.constructEvent(payload, header, secret).id,
    "evt_unit",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload, header, "whsec_wrong"),
  );
  const old = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp: 1,
  });
  assert.throws(() => stripe.webhooks.constructEvent(payload, old, secret));
});

test("checkout creation attempts are rate limited without retaining raw IP addresses", () => {
  const { db, repo } = setup();
  try {
    for (let i = 0; i < 10; i++)
      assert.equal(repo.allowAttempt("browser", 1000000), true);
    assert.equal(repo.allowAttempt("browser", 1000001), false);
    assert.equal(repo.allowAttempt("another-browser", 1000001), true);
    assert.equal(repo.allowAttempt("browser", 1000000 + 600001), true);
  } finally {
    db.close();
  }
});
