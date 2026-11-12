import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Product, formatPrice } from "@/lib/catalog";
import { supportCampaign, supportPrice } from "@/lib/support";

export function CoffeeBag({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <div className={`bag-scene ${product.color} ${large ? "large" : ""}`}>
      <div className="coffee-bag">
        <div className="bag-seal" />
        <div className="bag-label">
          {product.id === "guatemala" ? (
            <Image
              src="/images/guatemala-label.png"
              alt="Ristet Aalborgs originale Guatemala-etikette"
              width={240}
              height={360}
            />
          ) : (
            <div className={`simple-label ${product.color}`}>
              <span>
                RISTET
                <br />
                AALBORG
              </span>
              <small>KAFFE MED KÆRLIGHED</small>
              <div className="label-sun">✳</div>
              <strong>{product.country.toUpperCase()}</strong>
              <small>{product.region ?? "SELECTION"}</small>
              <div className="label-rule" />
              <small>FRISKRISTET SPECIALKAFFE</small>
            </div>
          )}
        </div>
        <span className="bag-weight">RISTET I AALBORG · 250 G</span>
      </div>
    </div>
  );
}
export function ProductCard({
  product,
  support = false,
}: {
  product: Product;
  support?: boolean;
}) {
  return (
    <Link
      href={`/${support ? "stoet" : "shop"}/${product.slug}`}
      className="product-card"
    >
      <div className={`product-visual ${product.color}`}>
        <span className="product-tag">{product.methods.join(" / ")}</span>
        <CoffeeBag product={product} />
        <span className="product-arrow">
          <ArrowUpRight size={21} />
        </span>
      </div>
      <div className="product-meta">
        <span>
          {product.country}{" "}
          <span className="muted">
            / {product.process ?? "Detaljer følger"}
          </span>
        </span>
        <span>250 g</span>
      </div>
      <div className="product-title">
        <h3>{product.name}</h3>
        <span>
          {formatPrice(
            support
              ? supportPrice(product.variants[0].priceOre)
              : product.variants[0].priceOre,
          )}
        </span>
      </div>
      {support && (
        <p className="support-card-note">
          Heraf {formatPrice(supportCampaign.contributionOre)} til det kommende
          støtteformål
        </p>
      )}
      <p className="product-note">
        {product.id === "guatemala"
          ? "Afbalanceret. Med espresso i tankerne."
          : product.id === "ethiopia"
            ? "Lysristet. Til dit filterritual."
            : "En alsidig kaffe til hverdagens kop."}
      </p>
    </Link>
  );
}
