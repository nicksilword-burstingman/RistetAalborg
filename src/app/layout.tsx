import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";
import "./customer-experience.css";
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
    images: [
      {
        url: "/images/handpicked-coffee.webp",
        width: 1197,
        height: 1314,
        alt: "Kaffebær plukkes i hånden – vejen til en god kop specialkaffe",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
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
