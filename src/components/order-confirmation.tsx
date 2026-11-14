"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, ArrowUpRight } from "lucide-react";
import {
  type CheckoutCustomer,
  type OrderQuote,
  type OrderStatus,
} from "@/lib/checkout";
import { formatPrice, formatWeight } from "@/lib/catalog";
import { useCart } from "./cart-provider";

type Receipt = {
  id: string;
  number: string;
  status: OrderStatus;
  mode: "test" | "live";
  customer: CheckoutCustomer;
  quote: OrderQuote;
  refundedOre: number;
};
export function OrderConfirmation() {
  const cart = useCart();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(true);
  const [retry, setRetry] = useState(0);
  const consumed = useRef(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session_id");
    if (!id) {
      setError("Der mangler en reference til din bestilling.");
      setWaiting(false);
      return;
    }
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    setWaiting(true);
    setError("");
    async function load() {
      try {
        const res = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(id!)}`,
          { cache: "no-store", signal: abort.signal },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setReceipt(data);
        if (data.status === "pending" && ++count < 20)
          timer = setTimeout(load, 2500);
        else setWaiting(false);
      } catch (err) {
        if (!abort.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Bestillingen kunne ikke hentes.",
          );
          setWaiting(false);
        }
      }
    }
    void load();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [retry]);
  useEffect(() => {
    if (!cart.ready || receipt?.status !== "paid" || consumed.current) return;
    consumed.current = true;
    cart.consumeOrder(
      receipt.id,
      receipt.quote.lines.flatMap((line) =>
        line.bags.map((bag) => ({
          productId: line.productId,
          grams: bag.grams,
          quantity: bag.quantity,
          support: false,
        })),
      ),
    );
  }, [cart, receipt]);
  const paid = receipt?.status === "paid";
  return (
    <section className="order-confirmation">
      {paid ? (
        <CheckCircle2 size={40} strokeWidth={1.1} />
      ) : (
        <Clock3 size={40} strokeWidth={1.1} />
      )}
      <p className="eyebrow">
        {receipt?.mode === "test"
          ? "TESTBESTILLING · INGEN RIGTIG BETALING"
          : "DIN BESTILLING"}
      </p>
      <h1>
        {paid
          ? receipt.mode === "test"
            ? "Testbetalingen gik igennem."
            : "Tak. Der er kaffe på vej."
          : receipt?.status === "expired"
            ? "Betalingsforsøget er udløbet."
            : "Vi venter på betalingsbekræftelsen."}
      </h1>
      {!paid && receipt?.status !== "expired" && (
        <p role="status">
          {waiting
            ? "Vi henter den sikre bekræftelse fra Stripe. Du skal ikke betale igen."
            : "Vi har endnu ikke modtaget en betalingsbekræftelse. Opdatér status om lidt. Undgå at betale igen, mens du afventer svar."}
        </p>
      )}
      {receipt?.mode === "test" && (
        <p className="checkout-notice">
          Dette er en test. Der trækkes ingen rigtige penge, og bestillingen
          bliver ikke sendt.
        </p>
      )}
      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}
      {receipt && (
        <>
          <p>
            Bestillingsreference <strong>{receipt.number}</strong>
          </p>
          <ul className="checkout-products">
            {receipt.quote.lines.map((line) => (
              <li
                key={line.productId}
                style={{ gridTemplateColumns: "1fr auto" }}
              >
                <div>
                  <strong>
                    {line.name} · {line.method}
                  </strong>
                  {line.bags.map((bag) => (
                    <small key={bag.sku}>
                      {bag.quantity} × {formatWeight(bag.grams)} hele bønner
                    </small>
                  ))}
                </div>
                <b>{formatPrice(line.totalOre)}</b>
              </li>
            ))}
          </ul>
          <dl className="checkout-totals">
            <div>
              <dt>{receipt.quote.shipping.name}</dt>
              <dd>{formatPrice(receipt.quote.shippingOre)}</dd>
            </div>
            <div className="checkout-grand-total">
              <dt>I alt inkl. moms</dt>
              <dd>{formatPrice(receipt.quote.totalOre)}</dd>
            </div>
            <div>
              <dt>Heraf moms</dt>
              <dd>{formatPrice(receipt.quote.vatOre)}</dd>
            </div>
            {receipt.refundedOre > 0 && (
              <div>
                <dt>Tilbagebetalt</dt>
                <dd>{formatPrice(receipt.refundedOre)}</dd>
              </div>
            )}
          </dl>
          {paid && (
            <div className="order-address">
              <strong>Leveringsadresse</strong>
              <p>
                {receipt.customer.firstName} {receipt.customer.lastName}
                <br />
                {receipt.customer.address}
                <br />
                {receipt.customer.address2 && (
                  <>
                    {receipt.customer.address2}
                    <br />
                  </>
                )}
                {receipt.customer.postalCode} {receipt.customer.city}
                <br />
                Danmark
              </p>
            </div>
          )}
        </>
      )}
      <div className="order-actions">
        {!paid && (
          <button
            className="button dark"
            disabled={waiting}
            onClick={() => setRetry((v) => v + 1)}
          >
            {waiting ? "Henter status …" : "Opdatér status"}
          </button>
        )}
        <Link className="button dark" href="/shop">
          Udforsk vores kaffe <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
