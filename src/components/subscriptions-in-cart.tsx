"use client";
import Link from "next/link";
import { RefreshCw, Trash2 } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatPrice, formatWeight } from "@/lib/catalog";
import {
  subscriptionCoffees,
  subscriptionMethods,
  subscriptionKey,
  subscriptionPrice,
} from "@/lib/subscriptions";

export function SubscriptionsInCart() {
  const cart = useCart();
  if (!cart.subscriptions.length) return null;
  return (
    <section className="subscription-cart" aria-label="Dine kaffeabonnementer">
      <div className="subscription-cart-heading">
        <RefreshCw size={20} />
        <h2>Kaffe i din rytme</h2>
        <span>Kaffevalg · ikke aktiveret</span>
      </div>
      {cart.subscriptions.map((item) => (
        <article key={subscriptionKey(item)} className="subscription-cart-item">
          <div>
            <p className="eyebrow">HVER {item.weeks}. UGE · HELE BØNNER</p>
            <h3>{subscriptionCoffees[item.coffee]}</h3>
            <p>
              {item.quantity} × {formatWeight(item.grams)} ·{" "}
              {subscriptionMethods[item.method]}
            </p>
            <strong>
              {cart.subscriptionSettings
                ? `${formatPrice(subscriptionPrice(item, cart.subscriptionSettings))} pr. levering`
                : "Pris afventer forbindelse"}
            </strong>
            <div className="subscription-item-actions">
              <Link
                href={`/abonnement?valg=${encodeURIComponent(JSON.stringify(item))}`}
                className="text-link"
              >
                Ret dit valg
              </Link>
              <button
                type="button"
                className="cart-remove"
                onClick={() => cart.removeSubscription(subscriptionKey(item))}
                aria-label={`Fjern ${subscriptionCoffees[item.coffee]}, ${subscriptionMethods[item.method]}, hver ${item.weeks}. uge`}
              >
                <Trash2 size={17} /> Fjern
              </button>
            </div>
          </div>
        </article>
      ))}
      <p>
        Foreløbige priser inkl. moms, før fragt. Hvert kaffevalg følger sin egen
        leveringsrytme. Abonnementer kan først bestilles, når betaling, fragt og
        abonnementsvilkår er klar.
      </p>
    </section>
  );
}
