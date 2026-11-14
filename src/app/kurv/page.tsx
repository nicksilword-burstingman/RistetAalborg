import { CartView } from "@/components/cart-view";
import "../shop/product.css";
export const metadata = {
  title: "Din kurv",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <section className="section cart-page">
      <p className="eyebrow">DIN KURV</p>
      <h1>
        Din næste <em>gode kop.</em>
      </h1>
      <CartView />
    </section>
  );
}
