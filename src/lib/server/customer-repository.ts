import type { DatabaseSync } from "node:sqlite";
import {
  customerProfileSchema,
  emptyCustomerProfile,
} from "../customer-profile";
export function customerRepository(db: DatabaseSync) {
  return {
    profile(userId: string) {
      const row = db
        .prepare(
          "SELECT address,subscriptions FROM customer_profiles WHERE user_id=?",
        )
        .get(userId);
      return row
        ? customerProfileSchema.parse({
            address: row.address ? JSON.parse(String(row.address)) : null,
            subscriptions: JSON.parse(String(row.subscriptions)),
          })
        : emptyCustomerProfile;
    },
    save(userId: string, input: unknown) {
      const parsed = customerProfileSchema.parse(input);
      db.prepare(
        "INSERT INTO customer_profiles(user_id,address,subscriptions,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET address=excluded.address,subscriptions=excluded.subscriptions,updated_at=excluded.updated_at",
      ).run(
        userId,
        parsed.address ? JSON.stringify(parsed.address) : null,
        JSON.stringify(parsed.subscriptions),
        Date.now(),
      );
      return parsed;
    },
    attachOrder(userId: string, orderId: string) {
      db.prepare(
        "INSERT INTO commerce_customer_links(order_id,user_id) VALUES(?,?) ON CONFLICT(order_id) DO NOTHING",
      ).run(orderId, userId);
    },
    orders(userId: string) {
      return db
        .prepare(
          "SELECT o.number,o.status,o.mode,o.quote,o.created_at,o.fulfillment,o.refunded_ore FROM commerce_orders o JOIN commerce_customer_links c ON o.id=c.order_id WHERE c.user_id=? ORDER BY o.created_at DESC LIMIT 50",
        )
        .all(userId)
        .map((row) => ({
          number: String(row.number),
          status: String(row.status),
          mode: String(row.mode),
          totalOre: Number(JSON.parse(String(row.quote)).totalOre),
          createdAt: Number(row.created_at),
          fulfillment: String(row.fulfillment),
          refundedOre: Number(row.refunded_ore),
        }));
    },
  };
}
