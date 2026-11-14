import type { CheckoutMode, CheckoutSettings } from "./checkout";
import { products } from "./catalog";

// This pure validator returns flags, never API keys. Only its server facade reads env.
export function assessPaymentConfiguration(
  settings: CheckoutSettings,
  env: Record<string, string | undefined>,
) {
  const mode: CheckoutMode =
    env.RISTET_CHECKOUT_MODE === "test"
      ? "test"
      : env.RISTET_CHECKOUT_MODE === "live"
        ? "live"
        : "disabled";
  const keyMatchesMode =
    mode !== "disabled" &&
    new RegExp(`^(sk|rk)_${mode}_`).test(env.STRIPE_SECRET_KEY ?? "");
  const webhookConfigured = Boolean(
    env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"),
  );
  let siteUrl = "";
  try {
    const url = new URL(env.NEXT_PUBLIC_SITE_URL ?? "");
    if (
      !url.username &&
      !url.password &&
      (url.protocol === "https:" ||
        (mode !== "live" &&
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)))
    )
      siteUrl = url.origin;
  } catch {
    /* Fail closed until configured. */
  }
  const issues: string[] = [];
  if (mode === "disabled") issues.push("Betaling er ikke åbnet endnu.");
  if (!keyMatchesMode)
    issues.push(
      "Stripe-forbindelsen er ikke konfigureret til denne driftstilstand.",
    );
  if (!webhookConfigured)
    issues.push("Bekræftelse af betalinger fra Stripe mangler.");
  if (!siteUrl) issues.push("Webshoppens adresse skal konfigureres.");
  if (!settings.shippingMethods.length)
    issues.push("Leveringsformer og fragtpriser er ikke fastlagt endnu.");
  if (mode === "live" && (!settings.termsReady || !env.RISTET_TERMS_VERSION))
    issues.push(
      "Handels- og privatlivsbetingelser skal færdiggøres før salgsstart.",
    );
  if (
    mode === "live" &&
    products.some((p) => (p.status as string) !== "published")
  )
    issues.push(
      "Produkterne er stadig kladder. Offentliggørelse og lagerstyring skal være på plads før salgsstart.",
    );
  return {
    mode,
    ready: issues.length === 0,
    issues,
    siteUrl,
    keyMatchesMode,
    webhookConfigured,
    mobilePay: env.STRIPE_MOBILEPAY_ENABLED === "true",
    termsVersion: env.RISTET_TERMS_VERSION || "test-draft",
  };
}
