"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { formatPrice, formatWeight } from "@/lib/catalog";
import { cartItemKey, quoteCart } from "@/lib/cart";
import { useCart } from "./cart-provider";
import { QuantitySelector } from "./quantity-selector";
import { SubscriptionsInCart } from "./subscriptions-in-cart";
import {
  subscriptionKey,
  subscriptionPrice,
  subscriptionCoffees,
} from "@/lib/subscriptions";

export function CartView() {
  const cart = useCart();
  const quote = quoteCart(cart.items);
  if (!cart.ready) return <p role="status">Henter din kurv …</p>;
  if (!cart.items.length && !cart.subscriptions.length)
    return (
      <div className="empty-state">
        <h2>Der er plads til god kaffe.</h2>
        <p>Find din favorit, og vælg præcis de poser, der passer til dig.</p>
        <Link href="/shop" className="button dark">
          Udforsk vores kaffe <ArrowUpRight size={18} />
        </Link>
      </div>
    );
  return (
    <div className="cart-layout">
      <div className="cart-groups">
        <SubscriptionsInCart />
        {quote.groups.map((group) => (
          <article key={group.key} className="cart-group">
            <Link
              href={`/${group.support ? "stoet" : "shop"}/${group.product.slug}`}
              className={`cart-product-image ${group.product.color}`}
            >
              <Image
                {...group.product.image}
                sizes="(max-width: 760px) 100px, 160px"
              />
            </Link>
            <div className="cart-product-copy">
              <p className="eyebrow">
                {group.product.method} · Hele bønner
                {group.support ? " · Med støtte" : ""}
              </p>
              <Link
                href={`/${group.support ? "stoet" : "shop"}/${group.product.slug}`}
              >
                <h2>{group.product.name}</h2>
              </Link>
              {group.items.map((item) => (
                <div className="cart-bag-row" key={cartItemKey(item)}>
                  <span>{formatWeight(item.grams)} pr. pose</span>
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(quantity) =>
                      cart.updateQuantity(cartItemKey(item), quantity)
                    }
                    label={`Antal poser à ${formatWeight(item.grams)}`}
                  />
                  <button
                    type="button"
                    className="cart-remove"
                    aria-label={`Fjern ${formatWeight(item.grams)} ${group.product.name}, ${group.product.method}`}
                    onClick={() => cart.removeItem(cartItemKey(item))}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <div className="cart-group-total">
                <span>
                  {formatWeight(group.totalGrams)} i alt · {group.quantity}{" "}
                  {group.quantity === 1 ? "pose" : "poser"}
                </span>
                <strong>{formatPrice(group.totalOre)}</strong>
              </div>
              {group.discountOre > 0 && (
                <p className="cart-saving">
                  Mængdepris: Du sparer {formatPrice(group.discountOre)}.
                </p>
              )}
              {group.supportOre > 0 && (
                <p className="cart-support">
                  Heraf {formatPrice(group.supportOre)} i støtte. Modtageren er
                  endnu ikke fastlagt.
                </p>
              )}
            </div>
          </article>
        ))}
        <Link href="/shop" className="text-link">
          Find lidt mere til koppen <ArrowUpRight size={17} />
        </Link>
      </div>
      <aside className="cart-summary" aria-label="Samlet pris">
        <p className="eyebrow">DIT KAFFEOVERBLIK</p>
        {quote.groups.length > 0 && (
          <dl>
            <div>
              <dt>Enkeltkøb og eventuel støtte</dt>
              <dd>{formatPrice(quote.totalOre + quote.discountOre)}</dd>
            </div>
            {quote.discountOre > 0 && (
              <div>
                <dt>Mængderabat</dt>
                <dd>−{formatPrice(quote.discountOre)}</dd>
              </div>
            )}
            <div>
              <dt>Fragt</dt>
              <dd>Beregnes i kassen</dd>
            </div>
            <div className="cart-total">
              <dt>Enkeltkøb inkl. moms</dt>
              <dd>{formatPrice(quote.totalOre)}</dd>
            </div>
          </dl>
        )}
        {cart.subscriptions.length > 0 && (
          <div className="cart-subscription-overview">
            <p className="eyebrow">ABONNEMENT · FORELØBIGE PRISER</p>
            <dl>
              {cart.subscriptions.map((item) => (
                <div key={subscriptionKey(item)}>
                  <dt>
                    {subscriptionCoffees[item.coffee]}
                    <small>
                      {item.quantity} × {formatWeight(item.grams)} hver{" "}
                      {item.weeks}. uge
                    </small>
                  </dt>
                  <dd>
                    {cart.subscriptionSettings
                      ? formatPrice(
                          subscriptionPrice(item, cart.subscriptionSettings),
                        )
                      : "Afventer pris"}
                    <small>pr. levering</small>
                  </dd>
                </div>
              ))}
            </dl>
            <p>Inkl. moms, før fragt. Ingen abonnementer er aktive.</p>
          </div>
        )}
        {quote.groups.length > 0 && (
          <p>
            {quote.quantity} {quote.quantity === 1 ? "pose" : "poser"} ·{" "}
            {formatWeight(quote.totalGrams)} hele bønner
          </p>
        )}
        <div className="cart-checkout-note">
          <Link href="/kasse" className="button dark">
            Gå til kassen <ArrowUpRight size={18} />
          </Link>
          <p>
            {cart.subscriptions.length
              ? "Dine kaffevalg er gemt i kurven. Se dem samlet i kassen. Abonnementer er endnu ikke aktive."
              : "Vælg levering og gennemgå din bestilling i kassen."}
          </p>
        </div>
        {quote.groups.length > 0 && (
          <p className="cart-pricing-explanation">
            Mængdepris beregnes automatisk for samme kaffe og ristning. Vi
            pakker stadig i de posestørrelser, du har valgt.
          </p>
        )}
        {cart.storageError && <p role="alert">{cart.storageError}</p>}
      </aside>
    </div>
  );
}
