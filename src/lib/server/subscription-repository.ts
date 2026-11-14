import "server-only";
import { getDatabase } from "./database";
import {
  defaultSubscriptionSettings,
  subscriptionSettingsSchema,
  type SubscriptionSettings,
} from "../subscriptions";
export function subscriptionSettings(): SubscriptionSettings {
  const row = getDatabase()
    .prepare("SELECT document FROM subscription_settings WHERE id=1")
    .get();
  return row
    ? subscriptionSettingsSchema.parse(JSON.parse(String(row.document)))
    : defaultSubscriptionSettings;
}
export function saveSubscriptionSettings(input: unknown) {
  const parsed = subscriptionSettingsSchema.parse(input);
  getDatabase()
    .prepare(
      "INSERT INTO subscription_settings(id,document) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document",
    )
    .run(JSON.stringify(parsed));
  return parsed;
}
