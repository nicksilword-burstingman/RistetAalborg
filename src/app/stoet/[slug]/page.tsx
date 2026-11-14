import { notFound } from "next/navigation";
import { products } from "@/lib/catalog";
import { CoffeeProductPage } from "@/components/coffee-product-page";
import { productMetadata } from "@/lib/product-seo";
import "../../shop/product.css";
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
  return p ? productMetadata(p, true) : { title: "Kaffe ikke fundet" };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  if (!p) notFound();
  return <CoffeeProductPage product={p} support />;
}
