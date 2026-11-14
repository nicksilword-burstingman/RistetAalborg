import { CheckoutView } from "@/components/checkout-view";
import "./checkout.css";
export const metadata = {
  title: "Kassen · Din kaffe er næsten hjemme",
  robots: { index: false, follow: false },
};
export default function CheckoutPage() {
  return <CheckoutView />;
}
