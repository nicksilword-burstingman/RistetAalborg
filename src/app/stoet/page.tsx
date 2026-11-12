import Link from "next/link";
import { Heart } from "lucide-react";
import { products } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
export const metadata = {
  title: "Støt — kaffe med omtanke",
  description:
    "Samme gode kaffe. 20 kr. ekstra pr. pose til et kommende støtteformål.",
};
export default function SupportPage() {
  return (
    <section className="section">
      <div className="page-intro">
        <p className="eyebrow">SAMME KAFFE. LIDT MERE OMTANKE.</p>
        <h1>
          En god kop.
          <br />
          <em>Et godt formål.</em>
        </h1>
        <p>
          Vælg din sædvanlige kaffe, og læg 20 kr. ekstra pr. pose til et godt
          formål. Samme bønner, samme størrelser og samme kærlighed til kaffe.
        </p>
      </div>
      <div className="support-intro">
        <Heart size={28} aria-hidden="true" />
        <div>
          <h2>20 kr. ekstra. Uanset posens størrelse.</h2>
          <p>
            En pose på 250 g til 80 kr. bliver til 100 kr. En pose på 1 kg til
            260 kr. bliver til 280 kr. De ekstra 20 kr. er tiltænkt
            støtteformålet.
          </p>
        </div>
      </div>
      <div className="notice">
        <strong>Støtteformålet er på vej.</strong> Modtager, periode og vilkår
        offentliggøres inden åbning. Dette er en forhåndsvisning med
        eksempelpriser inkl. moms. Der kan endnu ikke købes kaffe eller
        indsamles støtte.
      </div>
      <div className="section-heading">
        <h2>
          Din kaffe. <em>Med omtanke.</em>
        </h2>
        <Link className="text-link" href="/shop">
          Se det almindelige sortiment →
        </Link>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} support />
        ))}
      </div>
    </section>
  );
}
