import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { StoryTimeline } from "@/components/story-timeline";
import { timelineRepository } from "@/lib/server/timeline";
import "./journey.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "Vores rejse – mennesket bag Ristet Aalborg",
  description:
    "Fra en solorejse i Asien og medicinstudiet til et lille kafferisteri i Aalborg. Følg den personlige rejse mod friskristet specialkaffe til en fair pris.",
};
export default function Page() {
  const { chapters } = timelineRepository().read();
  return (
    <>
      <section className="about-opening" aria-labelledby="about-title">
        <div className="editorial-kicker">
          <span>MENNESKET BAG RISTET</span>
          <span>LOKALT. ÆRLIGT. UDEN FILTER.</span>
        </div>
        <div className="about-opening-grid">
          <div className="about-opening-copy">
            <p className="eyebrow">
              MEDICINSTUDERENDE. KAFFENYSGERRIG. RET MEGET MIG.
            </p>
            <h1 id="about-title">
              Et hoved fuldt af idéer.
              <br />
              <em>Et hjerte for mennesker.</em>
            </h1>
            <p>Og en ret stor kærlighed til kaffe.</p>
            <p>
              Jeg er en fyr med krudt i røven. Jeg får mange idéer. Nogle bliver
              ved tanken. Denne her blev til Ristet Aalborg.
            </p>
            <p>
              Min ambition er enkel: friskristet specialkaffe på bestilling til
              en pris, flere kan være med på. Også når huslejen er betalt.
            </p>
            <p>
              På medicinstudiet handler det om mennesker. Den omtanke vil jeg
              også have med ind i risteriet – og give videre, hvor jeg kan.
            </p>
            <div className="about-opening-links">
              <Link href="#journey-title" className="text-link">
                Her begyndte det hele{" "}
                <ArrowDownRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/stoet" className="text-link">
                Kaffe med omtanke{" "}
                <ArrowDownRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <figure className="about-opening-portrait">
            <Image
              src="/images/founder-portrait.jpg"
              width={900}
              height={1600}
              sizes="(max-width: 760px) 88vw, 36vw"
              alt="Grundlæggeren af Ristet Aalborg med en kaffekop i hånden ved computeren."
              preload
            />
            <figcaption>MANGE TANKER. GOD KAFFE. PLADS TIL DIG.</figcaption>
            <span className="about-personal-note" aria-hidden="true">
              Hej.
              <br />
              <em>Det er mig bag bønnerne.</em>
            </span>
          </figure>
        </div>
      </section>
      <StoryTimeline chapters={chapters} />
    </>
  );
}
