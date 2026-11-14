import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server/admin";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";
import { paymentConfiguration } from "@/lib/server/checkout-config";
import { CheckoutSettingsEditor } from "@/components/checkout-settings-editor";
import { SubscriptionSettingsEditor } from "@/components/subscription-settings-editor";
import { subscriptionSettings } from "@/lib/server/subscription-repository";
import { OrderFulfillmentButton } from "@/components/order-fulfillment-button";
import { orderStatuses } from "@/lib/checkout";
import { formatPrice, formatWeight } from "@/lib/catalog";
import "../admin.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "Ordrer, fragt og betaling",
  robots: { index: false, follow: false },
};
export default async function CommerceAdminPage() {
  if (!(await getAdminSession())) redirect("/admin");
  const repo = orderRepository(getDatabase());
  const settings = repo.settings();
  const config = paymentConfiguration(settings);
  const stats = repo.statistics();
  const orders = repo.list();
  return (
    <section className="admin-shell admin-commerce">
      <Link href="/admin" className="text-link">
        ← Tilbage til administrationen
      </Link>
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">RISTET AALBORG · ADMINISTRATION</p>
          <h1>Ordrer & levering</h1>
        </div>
        <Link href="/kasse" className="button dark">
          Se kassen
        </Link>
      </div>
      <div className="admin-commerce-stats">
        <div>
          <small>Betalte ordrer · rigtige køb</small>
          <strong>{stats.paidOrders}</strong>
        </div>
        <div>
          <small>Salg inkl. moms efter refunderinger · rigtige køb</small>
          <strong>{formatPrice(stats.revenueOre)}</strong>
        </div>
        <div>
          <small>Gennemførte testkøb</small>
          <strong>{stats.testOrders}</strong>
        </div>
      </div>
      <div className="admin-payment-status">
        <h2>Betalingsforbindelse</h2>
        <p>
          Drift:{" "}
          <strong>
            {config.mode === "disabled"
              ? "Lukket"
              : config.mode === "test"
                ? "Testtilstand"
                : "Rigtige betalinger"}
          </strong>{" "}
          · {config.ready ? "Klar" : "Afventer opsætning"}
        </p>
        <ul>
          {config.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
        <p>
          MobilePay:{" "}
          {config.mobilePay
            ? "Aktiveret i webshopkonfigurationen; skal også være godkendt hos Stripe."
            : "Ikke aktiveret."}{" "}
          MobilePay via Stripe kan bruges til enkeltkøb, ikke til
          abonnementstræk.
        </p>
        <p>
          Kortoplysninger håndteres af Stripe. Refunderinger foretages i
          Stripe-dashboardet og registreres her via verificerede beskeder fra
          Stripe. Kvitteringsmails skal aktiveres hos Stripe; en separat
          ordremail er endnu ikke tilsluttet.
        </p>
      </div>
      <CheckoutSettingsEditor initialSettings={settings} />
      <SubscriptionSettingsEditor initial={subscriptionSettings()} />
      <section className="admin-order-list">
        <h2>Seneste bestillinger</h2>
        <p>
          Viser de seneste 100 forsøg og bestillinger. Testkøb er markeret
          tydeligt og tæller ikke som rigtigt salg. En betaling reserverer endnu
          ikke lager.
        </p>
        {!orders.length && <p>Der er ingen bestillinger endnu.</p>}
        {orders.map((order) => (
          <details key={order.id} className="admin-order">
            <summary>
              <strong>{order.number}</strong>
              <span>
                {order.mode === "test" ? "TEST · " : ""}
                {orderStatuses[order.status]}
                {order.fulfillment === "shipped" ? " · Afsendt" : ""}
              </span>
              <b>{formatPrice(order.quote.totalOre)}</b>
            </summary>
            <div className="admin-order-body">
              <p>
                {new Date(order.createdAt).toLocaleString("da-DK", {
                  timeZone: "Europe/Copenhagen",
                })}
              </p>
              <div className="admin-order-columns">
                <div>
                  <h3>Kunde og levering</h3>
                  <p>
                    {order.customer.firstName} {order.customer.lastName}
                    <br />
                    {order.customer.email}
                    <br />
                    {order.customer.phone}
                    <br />
                    {order.customer.address}
                    <br />
                    {order.customer.address2}
                    <br />
                    {order.customer.postalCode} {order.customer.city}
                    <br />
                    Danmark
                  </p>
                  <p>
                    {order.quote.shipping.name} ·{" "}
                    {formatPrice(order.quote.shippingOre)}
                  </p>
                </div>
                <div>
                  <h3>Poser til pakning</h3>
                  {order.quote.lines.map((line) => (
                    <div key={line.productId}>
                      <strong>
                        {line.name} · {line.method}
                      </strong>
                      {line.bags.map((bag) => (
                        <p key={bag.sku}>
                          {bag.quantity} × {formatWeight(bag.grams)} · {bag.sku}
                        </p>
                      ))}
                      <p>
                        {formatPrice(line.totalOre)} · heraf mængderabat{" "}
                        {formatPrice(line.discountOre)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <p>
                I alt inkl. moms {formatPrice(order.quote.totalOre)} · heraf
                moms {formatPrice(order.quote.vatOre)}
                {order.refundedOre > 0
                  ? ` · Tilbagebetalt ${formatPrice(order.refundedOre)}`
                  : ""}
              </p>
              <p className="admin-provider-reference">
                Stripe-session: {order.stripeSessionId || "Ikke oprettet"}
                <br />
                Betalingsreference: {order.paymentIntentId || "Afventer"}
                <br />
                Accepteret vilkårsversion: {order.termsVersion}
              </p>
              {order.status === "paid" &&
                order.refundedOre === 0 &&
                order.fulfillment === "unfulfilled" && (
                  <OrderFulfillmentButton id={order.id} />
                )}
            </div>
          </details>
        ))}
      </section>
    </section>
  );
}
