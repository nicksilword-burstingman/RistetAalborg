"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useCart } from "./cart-provider";
import { formatPrice, formatWeight } from "@/lib/catalog";
import { quoteCart } from "@/lib/cart";
import {
  customerSchema,
  type CheckoutMode,
  type OrderQuote,
  type ShippingMethod,
} from "@/lib/checkout";

type Options = {
  shippingMethods: ShippingMethod[];
  payment: { mode: CheckoutMode; ready: boolean; mobilePay: boolean };
};
type QuoteResponse = {
  quote: OrderQuote;
  quoteId: string;
  fingerprint: string;
};

export function CheckoutView() {
  const cart = useCart();
  const [options, setOptions] = useState<Options | null>(null);
  const [shippingId, setShippingId] = useState("");
  const [quoted, setQuoted] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const attempt = useRef<{ payload: string; requestId: string } | null>(null);
  const pending = useRef(false);
  const cartQuote = quoteCart(cart.items);
  const fingerprint = JSON.stringify({ items: cart.items, shippingId });
  const quote = quoted?.fingerprint === fingerprint ? quoted : null;

  useEffect(() => {
    const abort = new AbortController();
    setCancelled(
      new URLSearchParams(window.location.search).get("afbrudt") === "1",
    );
    fetch("/api/checkout/options", { cache: "no-store", signal: abort.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<Options>;
      })
      .then((data) => {
        setOptions(data);
        setShippingId(data.shippingMethods[0]?.id ?? "");
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setOptionsError(
            "Kassen kunne ikke hentes. Genindlæs siden for at prøve igen.",
          );
      });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!cart.ready || !cart.items.length || !shippingId) return;
    const abort = new AbortController();
    setQuoteError("");
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: fingerprint,
      signal: abort.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => setQuoted({ ...data, fingerprint }))
      .catch((err) => {
        if (!abort.signal.aborted)
          setQuoteError(
            err instanceof Error ? err.message : "Prisen kunne ikke beregnes.",
          );
      });
    return () => abort.abort();
  }, [fingerprint, cart.ready, cart.items.length, shippingId]);

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote || !options?.payment.ready || pending.current) return;
    const form = new FormData(event.currentTarget);
    const parsed = customerSchema.safeParse(
      Object.fromEntries(
        [
          "email",
          "firstName",
          "lastName",
          "phone",
          "address",
          "address2",
          "postalCode",
          "city",
          "country",
        ].map((field) => [field, form.get(field) ?? ""]),
      ),
    );
    if (!parsed.success) {
      setError(
        "Kontrollér din e-mail, navn, adresse og dit danske postnummer.",
      );
      return;
    }
    if (form.get("acceptTerms") !== "on") {
      setError("Læs og acceptér handelsbetingelserne for at fortsætte.");
      return;
    }
    pending.current = true;
    setSubmitting(true);
    setError("");
    const payload = {
      items: cart.items,
      shippingId,
      customer: parsed.data,
      acceptTerms: true,
      quoteId: quote.quoteId,
    };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.payload !== serialized)
      attempt.current = { payload: serialized, requestId: crypto.randomUUID() };
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          requestId: attempt.current!.requestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) attempt.current = null;
        throw new Error(data.error);
      }
      const destination = new URL(data.url);
      if (
        destination.protocol !== "https:" ||
        destination.hostname !== "checkout.stripe.com"
      )
        throw new Error("Betalingssiden kunne ikke verificeres.");
      window.location.assign(destination.href);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Betalingssiden kunne ikke åbnes. Prøv igen.",
      );
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  if (!cart.ready)
    return (
      <p className="checkout-loading" role="status">
        Vi finder din kaffe frem …
      </p>
    );
  if (!cart.items.length)
    return (
      <div className="checkout-empty">
        <Package size={32} />
        <h1>Din kop starter her.</h1>
        <p>Din kurv er tom. Find din kaffe, så klarer vi resten sammen.</p>
        <Link href="/shop" className="button dark">
          Udforsk vores kaffe <ArrowUpRight size={17} />
        </Link>
      </div>
    );
  return (
    <div className="checkout-shell">
      <div className="checkout-heading">
        <Link href="/kurv" className="checkout-back">
          <ArrowLeft size={15} /> Tilbage til kurven
        </Link>
        <p className="eyebrow">FRA VORES RISTER TIL DIN KOP</p>
        <h1>
          God kaffe.
          <br />
          <em>Næsten hjemme.</em>
        </h1>
        <p>
          Friskristet specialkaffe på bestilling. Hele bønner, klar til dit
          hverdagsritual.
        </p>
      </div>
      {cancelled && (
        <p className="checkout-notice" role="status">
          Du er tilbage i kassen. Din kurv er bevaret; vi viser først en
          bestilling som betalt, når betalingen er bekræftet.
        </p>
      )}
      {options?.payment.mode === "test" && (
        <p className="checkout-notice" role="status">
          <strong>Testtilstand.</strong> Dette er et testkøb. Der trækkes ingen
          rigtige penge, og kaffen sendes ikke.
        </p>
      )}
      {options && !options.payment.ready && (
        <div className="checkout-notice">
          <strong>Vi gør klar til den første bestilling.</strong>
          <p>
            Du kan gennemgå din kurv og felterne her. Betaling åbner, når
            betaling, levering og salgsvilkår er klar.
          </p>
        </div>
      )}
      {optionsError && (
        <p role="alert" className="checkout-error">
          {optionsError}
        </p>
      )}
      <form
        onSubmit={pay}
        className="checkout-layout"
        aria-label="Kontakt, levering og betaling"
      >
        <div className="checkout-fields">
          <fieldset className="checkout-section" disabled={submitting}>
            <legend>
              <span>01</span> Dig og din kaffe
            </legend>
            <p>Vi bruger din e-mail til oplysninger om din bestilling.</p>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="din@email.dk"
              />
            </label>
          </fieldset>
          <fieldset className="checkout-section" disabled={submitting}>
            <legend>
              <span>02</span> Hvor skal kaffen hen?
            </legend>
            <div className="checkout-two-fields">
              <label>
                Fornavn
                <input
                  name="firstName"
                  autoComplete="shipping given-name"
                  required
                  maxLength={80}
                />
              </label>
              <label>
                Efternavn
                <input
                  name="lastName"
                  autoComplete="shipping family-name"
                  required
                  maxLength={80}
                />
              </label>
            </div>
            <label>
              Adresse
              <input
                name="address"
                autoComplete="shipping address-line1"
                required
                maxLength={120}
              />
            </label>
            <label>
              Lejlighed, etage m.m. <small>(valgfrit)</small>
              <input
                name="address2"
                autoComplete="shipping address-line2"
                maxLength={120}
              />
            </label>
            <div className="checkout-two-fields postcode">
              <label>
                Postnummer
                <input
                  name="postalCode"
                  autoComplete="shipping postal-code"
                  required
                  inputMode="numeric"
                  pattern="[1-9][0-9]{3}"
                  maxLength={4}
                />
              </label>
              <label>
                By
                <input
                  name="city"
                  autoComplete="shipping address-level2"
                  required
                  maxLength={80}
                />
              </label>
            </div>
            <label>
              Land
              <select name="country" autoComplete="shipping country">
                <option value="DK">Danmark</option>
              </select>
            </label>
            <label>
              Telefon <small>(valgfrit)</small>
              <input
                name="phone"
                type="tel"
                autoComplete="shipping tel"
                maxLength={25}
              />
            </label>
          </fieldset>
          <fieldset className="checkout-section" disabled={submitting}>
            <legend>
              <span>03</span> På vej til dig
            </legend>
            {!options ? (
              <p role="status">Henter leveringsmuligheder …</p>
            ) : !options.shippingMethods.length ? (
              <p className="checkout-muted">
                Fragtpriser og leveringsmuligheder kommer inden salgsstart.
              </p>
            ) : (
              options.shippingMethods.map((method) => {
                const free =
                  method.freeAboveOre !== null &&
                  cartQuote.totalOre >= method.freeAboveOre;
                return (
                  <label
                    key={method.id}
                    className={`checkout-shipping ${shippingId === method.id ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="shippingId"
                      value={method.id}
                      checked={shippingId === method.id}
                      onChange={() => setShippingId(method.id)}
                    />
                    <Truck size={21} strokeWidth={1.4} />
                    <span>
                      <strong>{method.name}</strong>
                      <small>{method.description}</small>
                      {method.freeAboveOre !== null && (
                        <small>
                          Gratis fra {formatPrice(method.freeAboveOre)} efter
                          mængderabat
                        </small>
                      )}
                    </span>
                    <b>
                      {free || method.amountOre === 0
                        ? "Gratis"
                        : formatPrice(method.amountOre)}
                    </b>
                  </label>
                );
              })
            )}
          </fieldset>
          <fieldset className="checkout-section" disabled={submitting}>
            <legend>
              <span>04</span> En tryg afslutning
            </legend>
            <div className="checkout-payment">
              <ShieldCheck size={27} strokeWidth={1.3} />
              <div>
                <strong>Sikker betaling hos Stripe</strong>
                <p>
                  Du vælger betalingskort
                  {options?.payment.mobilePay ? " eller MobilePay" : ""} på
                  Stripes betalingsside. Dine kortoplysninger indtastes dér.
                </p>
              </div>
            </div>
            <label className="checkout-consent">
              <input type="checkbox" name="acceptTerms" required />
              <span>
                Jeg har læst og accepterer{" "}
                <Link
                  href="/information/handelsbetingelser"
                  target="_blank"
                  rel="noopener"
                >
                  handelsbetingelserne
                </Link>
                . Læs også vores{" "}
                <Link
                  href="/information/privatliv"
                  target="_blank"
                  rel="noopener"
                >
                  privatlivspolitik
                </Link>
                .
              </span>
            </label>
            <p className="checkout-muted">
              Levering til danske adresser. Alle priser er i DKK og inkl. moms.
            </p>
          </fieldset>
        </div>
        <aside className="checkout-summary" aria-label="Din bestilling">
          <div className="checkout-summary-title">
            <p className="eyebrow">GOD KAFFE. FAIR PRIS.</p>
            <h2>Din bestilling</h2>
            <Link href="/kurv">Ret kurven</Link>
          </div>
          <ul className="checkout-products">
            {cartQuote.groups.map((group) => (
              <li key={group.key}>
                <div className={`checkout-bag ${group.product.color}`}>
                  <Image {...group.product.image} sizes="90px" />
                </div>
                <div>
                  <strong>{group.product.name}</strong>
                  <span>
                    {group.product.method} · Hele bønner
                    {group.support ? " · Med støtte" : ""}
                  </span>
                  {group.items.map((item) => (
                    <small key={item.grams}>
                      {item.quantity} × {formatWeight(item.grams)}
                    </small>
                  ))}
                </div>
                <b>{formatPrice(group.totalOre)}</b>
              </li>
            ))}
          </ul>
          <dl className="checkout-totals">
            <div>
              <dt>Kaffe</dt>
              <dd>{formatPrice(cartQuote.totalOre + cartQuote.discountOre)}</dd>
            </div>
            {cartQuote.discountOre > 0 && (
              <div className="checkout-saving">
                <dt>
                  <Check size={14} /> Mængderabat
                </dt>
                <dd>−{formatPrice(cartQuote.discountOre)}</dd>
              </div>
            )}
            <div>
              <dt>Fragt</dt>
              <dd>
                {quote
                  ? quote.quote.shippingOre === 0
                    ? "Gratis"
                    : formatPrice(quote.quote.shippingOre)
                  : "Afventer fragtvalg"}
              </dd>
            </div>
            <div className="checkout-grand-total">
              <dt>
                {quote ? "I alt" : "Subtotal"} <small>inkl. moms</small>
              </dt>
              <dd>
                {formatPrice(quote?.quote.totalOre ?? cartQuote.totalOre)}
              </dd>
            </div>
          </dl>
          {quote ? (
            <p className="checkout-vat">
              Heraf moms {formatPrice(quote.quote.vatOre)}
            </p>
          ) : (
            <p className="checkout-vat">
              Prisen ovenfor er uden eventuel fragt.
            </p>
          )}
          {(quoteError || error) && (
            <p className="checkout-error" role="alert">
              {error || quoteError}
            </p>
          )}
          <button
            type="submit"
            className="button dark checkout-pay"
            disabled={submitting || !options?.payment.ready || !quote}
          >
            <LockKeyhole size={16} />{" "}
            {submitting
              ? "Åbner sikker betaling …"
              : !options?.payment.ready
                ? "Betaling åbner snart"
                : !quote
                  ? "Beregner din pris …"
                  : options.payment.mode === "test"
                    ? `Til testbetaling · ${formatPrice(quote.quote.totalOre)}`
                    : `Fortsæt til betaling · ${formatPrice(quote.quote.totalOre)}`}
          </button>
          <p className="checkout-assurance">
            Du gennemgår og bekræfter betalingen hos Stripe.
          </p>
          <div className="checkout-small-print">
            <Package size={19} />
            <p>
              Vi pakker de posestørrelser, du har valgt. Mængdeprisen følger den
              samlede vægt af samme kaffe og ristning.
            </p>
          </div>
          {cart.storageError && (
            <p className="checkout-error" role="alert">
              {cart.storageError}
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
