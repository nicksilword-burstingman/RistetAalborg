import "server-only";
import type { CheckoutSettings } from "../checkout";
import { assessPaymentConfiguration } from "../payment-configuration";

export function paymentConfiguration(settings: CheckoutSettings) {
  return assessPaymentConfiguration(settings, process.env);
}
