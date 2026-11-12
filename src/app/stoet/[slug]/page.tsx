import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/lib/catalog";
import { ProductDetail } from "@/components/product-detail";
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  return {
    title: p ? `${p.name} — med støtte` : "Kaffe ikke fundet",
    description: p?.description,
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <section className="section">
      <nav className="breadcrumbs" aria-label="Brødkrumme">
        <Link href="/">Forside</Link> / <Link href="/stoet">Støt</Link> /{" "}
        <span>{p.name}</span>
      </nav>
      <ProductDetail product={p} support />
    </section>
  );
}
