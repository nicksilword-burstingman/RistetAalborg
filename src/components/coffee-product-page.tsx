import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { products, type Product } from "@/lib/catalog";
import { coffeeOrigins } from "@/lib/coffee-origins";
import { productStructuredData } from "@/lib/product-seo";
import { ProductDetail } from "./product-detail";
import { ProductCard } from "./product-card";
import { OriginGallery } from "./origin-gallery";

export function CoffeeProductPage({
  product,
  support = false,
}: {
  product: Product;
  support?: boolean;
}) {
  const origin = coffeeOrigins[product.coffeeId];
  const related = [
    ...products.filter(
      (entry) =>
        entry.method === product.method && entry.coffeeId !== product.coffeeId,
    ),
    ...products.filter((entry) => entry.method !== product.method),
  ].slice(0, 4);
  const facts = [
    ["Oprindelse", product.country],
    ["Region", product.region],
    ["Væksthøjde", product.altitude],
    ["Proces", product.process],
    ["Ristning", `${product.method} · ${product.roast.toLowerCase()} ristning`],
    ["Smagsnoter", product.flavorNotes.join(" · ")],
  ];
  return (
    <article className={`coffee-product coffee-theme-${product.color}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productStructuredData(product, support),
          ).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetail product={product} support={support} />
      <section
        id="om-kaffen"
        className="coffee-about"
        aria-labelledby="coffee-about-title"
      >
        <div className="coffee-about-copy">
          <p className="eyebrow">EN GOD KOP HAR MERE AT FORTÆLLE</p>
          <h2 id="coffee-about-title">
            Lidt mere
            <br />
            <em>om din kaffe.</em>
          </h2>
          <div className="coffee-description">
            {product.description.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="coffee-about-facts">
          <p className="eyebrow">BØNNEN, HELT KORT</p>
          <dl className="product-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div
            className="coffee-roast-scale"
            aria-label={`Ristegrad ${product.roastLevel} af 6, fra lys til mørk`}
          >
            <span>Lys</span>
            <div aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <i
                  key={index}
                  className={index < product.roastLevel ? "filled" : ""}
                />
              ))}
            </div>
            <span>Mørk</span>
          </div>
          <div className="coffee-facts-footnote">
            <span>Hele bønner</span>
            <span>Ristet i Aalborg</span>
            <span>På bestilling</span>
          </div>
        </div>
      </section>
      <section className="coffee-origin" aria-labelledby="coffee-origin-title">
        <header className="coffee-origin-header">
          <div>
            <p className="eyebrow">{origin.eyebrow}</p>
            <h2 id="coffee-origin-title">{origin.title}</h2>
          </div>
          <p>{origin.description}</p>
        </header>
        <OriginGallery coffeeId={product.coffeeId} />
      </section>
      <section
        className="coffee-related section"
        aria-labelledby="coffee-related-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">DER ER MERE AT SMAGE PÅ</p>
            <h2 id="coffee-related-title">
              Måske din
              <br />
              <em>næste favorit?</em>
            </h2>
          </div>
          <Link href={support ? "/stoet" : "/shop"} className="text-link">
            Udforsk vores kaffe <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="coffee-related-grid">
          {related.map((entry) => (
            <ProductCard key={entry.id} product={entry} support={support} />
          ))}
        </div>
      </section>
    </article>
  );
}
