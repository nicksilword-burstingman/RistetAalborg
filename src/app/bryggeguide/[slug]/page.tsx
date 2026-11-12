import { notFound } from "next/navigation";
import Link from "next/link";
import { guides } from "@/lib/guides";
export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: guides.find((g) => g.slug === slug)?.name ?? "Bryggeguide" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = guides.find((g) => g.slug === slug);
  if (!g) notFound();
  return (
    <article className="section reading-page">
      <Link className="text-link" href="/bryggeguide">
        ← Alle bryggeguides
      </Link>
      <p className="eyebrow">BRYGGEGUIDE</p>
      <h1>{g.name}</h1>
      <p className="lead">{g.subtitle}</p>
      <dl className="product-facts">
        {[
          ["Forhold", g.ratio],
          ["Formaling", g.grind],
          ["Temperatur", g.temperature],
          ["Tid", g.time],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <h2>Sådan gør du</h2>
      <ol className="steps">
        {g.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p>
        Opskriften er et udgangspunkt. Juster én ting ad gangen, og lad din smag
        bestemme.
      </p>
    </article>
  );
}
