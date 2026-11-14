import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  checkoutSettingsSchema,
  defaultCheckoutSettings,
  type CheckoutCustomer,
  type CheckoutSettings,
  type OrderQuote,
  type OrderStatus,
} from "../checkout";

export type StoredOrder = {
  id: string;
  number: string;
  ownerHash: string;
  requestId: string;
  payloadHash: string;
  mode: "test" | "live";
  mobilePay: boolean;
  status: OrderStatus;
  customer: CheckoutCustomer;
  quote: OrderQuote;
  siteUrl: string;
  termsVersion: string;
  createdAt: number;
  paidAt: number | null;
  stripeSessionId: string | null;
  stripeCheckoutUrl: string | null;
  paymentIntentId: string | null;
  refundedOre: number;
  fulfillment: "unfulfilled" | "shipped";
};
type Row = Record<string, unknown>;
function decode(row: Row | undefined): StoredOrder | null {
  if (!row) return null;
  return {
    id: String(row.id),
    number: String(row.number),
    ownerHash: String(row.owner_hash),
    requestId: String(row.request_id),
    payloadHash: String(row.payload_hash),
    mode: row.mode as StoredOrder["mode"],
    mobilePay: Boolean(row.mobilepay),
    status: row.status as OrderStatus,
    customer: JSON.parse(String(row.customer)),
    quote: JSON.parse(String(row.quote)),
    siteUrl: String(row.site_url),
    termsVersion: String(row.terms_version),
    createdAt: Number(row.created_at),
    paidAt: row.paid_at === null ? null : Number(row.paid_at),
    stripeSessionId: row.stripe_session_id as string | null,
    stripeCheckoutUrl: row.stripe_checkout_url as string | null,
    paymentIntentId: row.payment_intent_id as string | null,
    refundedOre: Number(row.refunded_ore),
    fulfillment: row.fulfillment as StoredOrder["fulfillment"],
  };
}

export function orderRepository(db: DatabaseSync) {
  const byId = (id: string) =>
    decode(db.prepare("SELECT * FROM commerce_orders WHERE id=?").get(id));
  return {
    byId,
    settings(): CheckoutSettings {
      const row = db
        .prepare("SELECT document FROM checkout_settings WHERE id=1")
        .get();
      return row
        ? checkoutSettingsSchema.parse(JSON.parse(String(row.document)))
        : defaultCheckoutSettings;
    },
    saveSettings(input: CheckoutSettings) {
      const parsed = checkoutSettingsSchema.parse(input);
      db.prepare(
        "INSERT INTO checkout_settings(id,document) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document",
      ).run(JSON.stringify(parsed));
      return parsed;
    },
    byRequest(ownerHash: string, requestId: string) {
      return decode(
        db
          .prepare(
            "SELECT * FROM commerce_orders WHERE owner_hash=? AND request_id=?",
          )
          .get(ownerHash, requestId),
      );
    },
    bySession(id: string, ownerHash: string) {
      return decode(
        db
          .prepare(
            "SELECT * FROM commerce_orders WHERE stripe_session_id=? AND owner_hash=?",
          )
          .get(id, ownerHash),
      );
    },
    create(
      input: Pick<
        StoredOrder,
        | "ownerHash"
        | "requestId"
        | "payloadHash"
        | "mode"
        | "mobilePay"
        | "customer"
        | "quote"
        | "siteUrl"
        | "termsVersion"
      > & { customerId?: string },
    ) {
      const id = randomUUID();
      const now = Date.now();
      const number = `RA-${new Date(now).toISOString().slice(0, 10).replaceAll("-", "")}-${id.slice(0, 8).toUpperCase()}`;
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare(
          `INSERT INTO commerce_orders
        (id,number,owner_hash,request_id,payload_hash,mode,mobilepay,customer,quote,site_url,terms_version,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(
          id,
          number,
          input.ownerHash,
          input.requestId,
          input.payloadHash,
          input.mode,
          Number(input.mobilePay),
          JSON.stringify(input.customer),
          JSON.stringify(input.quote),
          input.siteUrl,
          input.termsVersion,
          now,
        );
        if (input.customerId)
          db.prepare(
            "INSERT INTO commerce_customer_links(order_id,user_id) VALUES(?,?)",
          ).run(id, input.customerId);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return byId(id)!;
    },
    attachSession(orderId: string, sessionId: string, url: string) {
      const order = byId(orderId);
      if (
        !order ||
        (order.stripeSessionId && order.stripeSessionId !== sessionId)
      )
        throw new Error("Payment session conflict");
      db.prepare(
        "UPDATE commerce_orders SET stripe_session_id=?,stripe_checkout_url=? WHERE id=?",
      ).run(sessionId, url, orderId);
    },
    allowAttempt(ownerHash: string, now = Date.now()) {
      db.prepare("DELETE FROM checkout_attempts WHERE attempted_at<?").run(
        now - 3600000,
      );
      const local = Number(
        db
          .prepare(
            "SELECT count(*) AS n FROM checkout_attempts WHERE owner_hash=? AND attempted_at>?",
          )
          .get(ownerHash, now - 600000)!.n,
      );
      const global = Number(
        db.prepare("SELECT count(*) AS n FROM checkout_attempts").get()!.n,
      );
      if (local >= 10 || global >= 500) return false;
      db.prepare(
        "INSERT INTO checkout_attempts(owner_hash,attempted_at) VALUES(?,?)",
      ).run(ownerHash, now);
      return true;
    },
    // A return URL cannot invoke this transition. Caller must verify the provider event first.
    applyPayment(event: {
      id: string;
      type: "paid" | "expired";
      orderId: string;
      sessionId: string;
      paymentIntentId: string | null;
      amountOre: number;
      currency: string;
      live: boolean;
    }) {
      db.exec("BEGIN IMMEDIATE");
      try {
        if (
          db.prepare("SELECT id FROM payment_events WHERE id=?").get(event.id)
        ) {
          db.exec("COMMIT");
          return false;
        }
        const order = byId(event.orderId);
        if (
          !order ||
          (order.stripeSessionId &&
            order.stripeSessionId !== event.sessionId) ||
          order.quote.totalOre !== event.amountOre ||
          event.currency !== "dkk" ||
          (order.mode === "live") !== event.live ||
          (event.type === "paid" && !event.paymentIntentId) ||
          (event.type === "paid" &&
            order.paymentIntentId &&
            order.paymentIntentId !== event.paymentIntentId)
        )
          throw new Error("Payment does not match immutable order");
        db.prepare("INSERT INTO payment_events VALUES(?,?,?,?)").run(
          event.id,
          order.id,
          event.type,
          Date.now(),
        );
        if (event.type === "paid" && order.status !== "paid") {
          db.prepare(
            "UPDATE commerce_orders SET status='paid',paid_at=?,stripe_session_id=?,payment_intent_id=? WHERE id=?",
          ).run(Date.now(), event.sessionId, event.paymentIntentId, order.id);
          db.prepare(
            "INSERT OR IGNORE INTO commerce_outbox(id,order_id,kind,created_at) VALUES(?,?,?,?)",
          ).run(`paid:${order.id}`, order.id, "order.paid", Date.now());
        } else if (event.type === "expired" && order.status === "pending") {
          db.prepare(
            "UPDATE commerce_orders SET status='expired',stripe_session_id=? WHERE id=?",
          ).run(event.sessionId, order.id);
        }
        db.exec("COMMIT");
        return true;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    applyRefund(event: {
      id: string;
      paymentIntentId: string;
      amountOre: number;
      originalOre: number;
      currency: string;
      live: boolean;
    }) {
      db.exec("BEGIN IMMEDIATE");
      try {
        if (
          db.prepare("SELECT id FROM payment_events WHERE id=?").get(event.id)
        ) {
          db.exec("COMMIT");
          return false;
        }
        const order = decode(
          db
            .prepare("SELECT * FROM commerce_orders WHERE payment_intent_id=?")
            .get(event.paymentIntentId),
        );
        if (
          !order ||
          order.status !== "paid" ||
          order.quote.totalOre !== event.originalOre ||
          !Number.isInteger(event.amountOre) ||
          event.amountOre < 0 ||
          event.amountOre > order.quote.totalOre ||
          event.currency !== "dkk" ||
          (order.mode === "live") !== event.live
        )
          throw new Error(
            "Refund does not match order; retry after payment event",
          );
        db.prepare("INSERT INTO payment_events VALUES(?,?,?,?)").run(
          event.id,
          order.id,
          "refund",
          Date.now(),
        );
        // Cumulative refunds cannot decrease when events arrive out of order.
        if (event.amountOre > order.refundedOre) {
          db.prepare(
            "UPDATE commerce_orders SET refunded_ore=? WHERE id=?",
          ).run(event.amountOre, order.id);
          db.prepare(
            "INSERT OR IGNORE INTO commerce_outbox(id,order_id,kind,created_at) VALUES(?,?,?,?)",
          ).run(
            `refund:${order.id}:${event.amountOre}`,
            order.id,
            "order.refunded",
            Date.now(),
          );
        }
        db.exec("COMMIT");
        return true;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    list(limit = 100) {
      return db
        .prepare(
          "SELECT * FROM commerce_orders ORDER BY created_at DESC LIMIT ?",
        )
        .all(limit)
        .map((r) => decode(r)!);
    },
    statistics() {
      const live = db
        .prepare(
          "SELECT count(*) AS orders, coalesce(sum(json_extract(quote,'$.totalOre')-refunded_ore),0) AS revenue FROM commerce_orders WHERE status='paid' AND mode='live'",
        )
        .get()!;
      const tests = db
        .prepare(
          "SELECT count(*) AS n FROM commerce_orders WHERE mode='test' AND status='paid'",
        )
        .get()!;
      return {
        paidOrders: Number(live.orders),
        revenueOre: Number(live.revenue),
        testOrders: Number(tests.n),
      };
    },
    ship(id: string) {
      return (
        db
          .prepare(
            "UPDATE commerce_orders SET fulfillment='shipped' WHERE id=? AND status='paid' AND refunded_ore=0 AND fulfillment='unfulfilled'",
          )
          .run(id).changes === 1
      );
    },
  };
}
