"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUpRight, Check, ShoppingBag } from "lucide-react";
import {
  formatPrice,
  formatWeight,
  products,
  type Product,
} from "@/lib/catalog";
import { quoteSelection } from "@/lib/pricing";
import { supportCampaign } from "@/lib/support";
import { useCart } from "./cart-provider";
import { QuantitySelector } from "./quantity-selector";

export function ProductDetail({
  product,
  support = false,
}: {
  product: Product;
  support?: boolean;
}) {
  const [grams, setGrams] = useState(250);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const quote = quoteSelection(product, grams, quantity, support);
  const basePath = support ? "stoet" : "shop";
  const editions = products.filter(
    (entry) => entry.coffeeId === product.coffeeId,
  );
  const addToCart = () => {
    try {
      cart.addItem({ productId: product.id, grams, quantity, support });
      setAdded(true);
      setMessage(
        `${quantity} ${quantity === 1 ? "pose" : "poser"} à ${formatWeight(grams)} er lagt i kurven.`,
      );
    } catch (error) {
      setAdded(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Kaffen kunne ikke lægges i kurven. Prøv igen.",
      );
    }
  };

  return (
    <section className="coffee-product-hero" aria-labelledby="coffee-title">
      <nav className="coffee-breadcrumbs" aria-label="Brødkrumme">
        <Link href="/">Forside</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/${basePath}`}>{support ? "Støt" : "Shop"}</Link>
        <span aria-hidden="true">/</span>
        <span>
          {product.name} · {product.method}
        </span>
      </nav>
      <div className="coffee-hero-grid">
        <div className="coffee-hero-heading">
          <span className="coffee-roast-badge">{product.method}ristet</span>
          <h1 id="coffee-title">{product.name}</h1>
          <span className="coffee-hero-origin">
            {product.country} · 100 % Arabica
          </span>
        </div>
        <figure className="coffee-hero-figure">
          <Image
            {...product.image}
            sizes="(max-width: 760px) 88vw, (max-width: 1100px) 46vw, 36vw"
            preload
            className="coffee-hero-image"
          />
        </figure>
        <div className="coffee-hero-intro">
          <p>{product.summary}</p>
          <a href="#om-kaffen" className="coffee-read-more">
            Lær kaffen at kende <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
        <div className="coffee-purchase">
          <nav className="coffee-editions" aria-label="Vælg ristning">
            {editions.map((edition) => (
              <Link
                href={`/${basePath}/${edition.slug}`}
                key={edition.id}
                aria-current={edition.id === product.id ? "page" : undefined}
              >
                {edition.method}
              </Link>
            ))}
          </nav>
          <fieldset className="coffee-bag-options">
            <legend>Vælg posestørrelse</legend>
            <div className="choice-row">
              {product.variants.map((variant) => (
                <button
                  type="button"
                  key={variant.sku}
                  aria-pressed={grams === variant.grams}
                  onClick={() => {
                    setGrams(variant.grams);
                    setAdded(false);
                    setMessage("");
                  }}
                >
                  <strong>{formatWeight(variant.grams)}</strong>
                  <span>
                    {formatPrice(
                      variant.priceOre +
                        (support ? supportCampaign.contributionOre : 0),
                    )}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="coffee-purchase-quantity">
            <QuantitySelector
              value={quantity}
              onChange={(next) => {
                setQuantity(next);
                setAdded(false);
                setMessage("");
              }}
            />
            <span className="coffee-whole-beans">Kun hele bønner</span>
          </div>
          <div
            className="coffee-purchase-price"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>{formatWeight(quote.totalGrams)} i alt</span>
            <strong>{formatPrice(quote.totalOre)}</strong>
          </div>
          {quote.discountOre > 0 && (
            <p className="coffee-quantity-saving">
              Mængdepris · Du sparer {formatPrice(quote.discountOre)}
            </p>
          )}
          <button
            type="button"
            className="coffee-add-button"
            onClick={addToCart}
            disabled={!cart.ready}
          >
            {added ? <Check size={18} /> : <ShoppingBag size={18} />}
            {added ? "Læg flere i kurven" : "Læg i kurv"}
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
          <div
            className="coffee-cart-feedback"
            role="status"
            aria-live="polite"
          >
            {message}
            {added && (
              <>
                {" "}
                <Link href="/kurv">Se kurven →</Link>
              </>
            )}
          </div>
          <p className="coffee-price-note">
            Inkl. moms · Friskristet på bestilling
          </p>
          <p className="coffee-volume-note">
            Samme kaffe og ristning får automatisk mængdepris. Fx 2 × 500 g til
            1 kg-prisen.
          </p>
          {support && (
            <p className="coffee-support-note">
              Heraf {formatPrice(quote.supportOre)} til et kommende
              støtteformål. Modtager og vilkår offentliggøres inden salgsstart.
            </p>
          )}
          <Link
            className="coffee-support-link"
            href={`/${support ? "shop" : "stoet"}/${product.slug}`}
          >
            {support
              ? "Se kaffen uden støtte"
              : "Vælg kaffen med 20 kr. i støtte pr. pose"}{" "}
            <ArrowUpRight size={13} />
          </Link>
          <p className="coffee-preview-note">
            Forhåndsvisning · Du kan gemme din kurv. Betaling åbner senere.
          </p>
          {cart.storageError && <p role="alert">{cart.storageError}</p>}
        </div>
      </div>
    </section>
  );
}
