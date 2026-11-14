import { OrderConfirmation } from "@/components/order-confirmation";
import "../checkout.css";
export const metadata = {
  title: "Din bestilling",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function OrderPage() {
  return <OrderConfirmation />;
}
