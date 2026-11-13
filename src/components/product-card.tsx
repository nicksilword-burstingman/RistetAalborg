import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Product, formatPrice } from "@/lib/catalog";
import { supportCampaign, supportPrice } from "@/lib/support";

export function CoffeeLabel({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <div className={`bag-scene ${large ? "large" : ""}`}>
      <Image
        {...product.label}
        className="coffee-label-artwork"
        sizes={
          large
            ? "(max-width: 760px) 78vw, 420px"
            : "(max-width: 760px) 74vw, (max-width: 1050px) 25vw, 300px"
        }
      />
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
        <CoffeeLabel product={product} />
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
