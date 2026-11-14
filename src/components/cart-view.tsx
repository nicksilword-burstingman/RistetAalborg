"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { formatPrice, formatWeight } from "@/lib/catalog";
import { cartItemKey, quoteCart } from "@/lib/cart";
import { useCart } from "./cart-provider";
import { QuantitySelector } from "./quantity-selector";

export function CartView() {
  const cart = useCart();
  const quote = quoteCart(cart.items);
  if (!cart.ready) return <p role="status">Henter din kurv …</p>;
  if (!cart.items.length)
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
        <dl>
          <div>
            <dt>Kaffe og eventuel støtte</dt>
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
            <dd>Oplyses ved salgsstart</dd>
          </div>
          <div className="cart-total">
            <dt>I alt inkl. moms</dt>
            <dd>{formatPrice(quote.totalOre)}</dd>
          </div>
        </dl>
        <p>
          {quote.quantity} {quote.quantity === 1 ? "pose" : "poser"} ·{" "}
          {formatWeight(quote.totalGrams)} hele bønner
        </p>
        <div className="cart-checkout-note">
          <strong>Vi gør klar til den første bestilling.</strong>
          <p>
            Du kan gemme og tilpasse din kurv. Betaling og bestilling åbner, når
            webshoppen er klar.
          </p>
        </div>
        <p className="cart-pricing-explanation">
          Mængdepris beregnes automatisk for samme kaffe og ristning. Vi pakker
          stadig i de posestørrelser, du har valgt.
        </p>
        {cart.storageError && <p role="alert">{cart.storageError}</p>}
      </aside>
    </div>
  );
}
