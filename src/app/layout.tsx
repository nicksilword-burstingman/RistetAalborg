import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Ristet Aalborg — Friskristet specialkaffe. Til en fair pris.",
    template: "%s | Ristet Aalborg",
  },
  description:
    "God kaffe skal være for alle. Oplev Ristet Aalborg, et uafhængigt kafferisteri i Aalborg med friskristet specialkaffe og kaffeabonnement.",
  robots: { index: false, follow: false },
  openGraph: {
    locale: "da_DK",
    type: "website",
    siteName: "Ristet Aalborg",
    images: ["/images/coffee-hero.jpg"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>
        <a className="skip-link" href="#main">
          Spring til indhold
        </a>
        <CartProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
