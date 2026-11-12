import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { guides } from "@/lib/guides";
export const metadata = { title: "Bryggeguide — få mere ud af din kaffe" };
export default function Page() {
  return (
    <section className="section">
      <div className="page-intro">
        <p className="eyebrow">SMÅ JUSTERINGER. STOR KAFFEGLÆDE.</p>
        <h1>
          Din vej til en
          <br />
          <em>bedre kop.</em>
        </h1>
        <p>
          Fire enkle bryggeguides til hverdagen. Brug opskrifterne som
          udgangspunkt, og smag dig frem.
        </p>
      </div>
      <div className="guide-grid">
        {guides.map((g, i) => (
          <Link
            className="guide-card"
            key={g.slug}
            href={`/bryggeguide/${g.slug}`}
          >
            <span className="eyebrow">0{i + 1} / BRYGGEGUIDE</span>
            <h2>{g.name}</h2>
            <p>{g.subtitle}</p>
            <span className="text-link">
              {g.time}
              <ArrowUpRight size={20} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
