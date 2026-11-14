"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Coffee, RefreshCw } from "lucide-react";
import { formatPrice, formatWeight } from "@/lib/catalog";
import {
  defaultSubscription,
  subscriptionCoffees,
  subscriptionMethods,
  subscriptionPrice,
  type SubscriptionSelection,
} from "@/lib/subscriptions";
import { useCart } from "./cart-provider";

export function SubscriptionConfigurator({
  initial = defaultSubscription,
  editKey,
}: {
  initial?: SubscriptionSelection;
  editKey?: string;
}) {
  const cart = useCart();
  const [selection, setSelection] = useState(initial);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const change = (patch: Partial<SubscriptionSelection>) => {
    setSelection((s) => ({ ...s, ...patch }));
    setAdded(false);
    setMessage("");
  };
  function add(event: FormEvent) {
    event.preventDefault();
    try {
      cart.saveSubscription(selection, editKey);
      setAdded(true);
      setMessage(
        "Dit kaffevalg er lagt i kurven. Der er ikke startet et abonnement.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Dit valg kunne ikke gemmes.",
      );
    }
  }
  return (
    <form className="configurator" onSubmit={add}>
      <div className="subscription-choices">
        <fieldset>
          <legend>
            <span>01</span> Hvad brygger du?
          </legend>
          <div className="choice-row">
            {(
              Object.entries(subscriptionMethods) as [
                SubscriptionSelection["method"],
                string,
              ][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={selection.method === value}
                onClick={() => change({ method: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <p>
            Blandet giver plads til både espresso- og filterrist. Altid hele
            bønner.
          </p>
        </fieldset>
        <fieldset>
          <legend>
            <span>02</span> Hvor meget kaffe?
          </legend>
          <div className="choice-row">
            {([250, 500, 1000] as const).map((grams) => (
              <button
                type="button"
                key={grams}
                aria-pressed={selection.grams === grams}
                onClick={() => change({ grams })}
              >
                {formatWeight(grams)}
                <small>
                  {cart.subscriptionSettings
                    ? formatPrice(
                        cart.subscriptionSettings.prices[
                          String(grams) as "250" | "500" | "1000"
                        ],
                      )
                    : "Henter pris …"}
                </small>
              </button>
            ))}
          </div>
          <p>
            Den samlede mængde pr. kaffevalg og levering. Den endelige pakning
            aftales ved åbning.
          </p>
        </fieldset>
        <fieldset>
          <legend>
            <span>03</span> Find din rytme
          </legend>
          <div className="choice-row">
            {([2, 4, 6] as const).map((weeks) => (
              <button
                type="button"
                key={weeks}
                aria-pressed={selection.weeks === weeks}
                onClick={() => change({ weeks })}
              >
                Hver {weeks}. uge
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field-label">
          Din kaffe
          <select
            value={selection.coffee}
            onChange={(e) =>
              change({
                coffee: e.target.value as SubscriptionSelection["coffee"],
              })
            }
          >
            {Object.entries(subscriptionCoffees).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Antal kaffevalg pr. levering
          <select
            value={selection.quantity}
            onChange={(e) => change({ quantity: Number(e.target.value) })}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <aside className="subscription-summary">
        <p className="eyebrow">
          <RefreshCw size={14} /> DIN KAFFERYTME
        </p>
        <h2>
          {formatWeight(selection.grams * selection.quantity)}
          <br />
          <em>hver {selection.weeks}. uge.</em>
        </h2>
        <p>
          {subscriptionMethods[selection.method]} ·{" "}
          {subscriptionCoffees[selection.coffee]}
        </p>
        <strong>
          {cart.subscriptionSettings
            ? formatPrice(
                subscriptionPrice(selection, cart.subscriptionSettings),
              )
            : "Henter pris …"}
        </strong>
        <p>
          Foreløbig pris pr. levering inkl. moms. Fragt er endnu ikke fastlagt.
          Priser og vilkår bekræftes, før du kan bestille.
        </p>
        <button
          className="button dark"
          type="submit"
          disabled={!cart.ready || !cart.subscriptionSettings || added}
        >
          {added ? <Check size={18} /> : <Coffee size={18} />}
          {added
            ? "Lagt i kurven"
            : editKey
              ? "Gem ændringer i kurven"
              : "Læg kaffevalget i kurven"}
        </button>
        <p role="status" aria-live="polite">
          {message || cart.subscriptionError}
        </p>
        {added && (
          <Link className="text-link" href="/kurv">
            Se din kurv <ArrowUpRight size={17} />
          </Link>
        )}
        <div className="notice">
          Vi gør klar til abonnementer. Du kan sammensætte og gemme dit valg nu.
          Der trækkes ingen penge, og der sendes ingen kaffe endnu.
        </div>
      </aside>
    </form>
  );
}
