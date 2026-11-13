import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import {
  orderChapters,
  type TimelineChapter,
  type TimelineImage,
} from "@/lib/timeline";
import { JourneyMotion } from "./journey-motion";

function StoryText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((paragraph, index) => (
        <p key={index}>
          {paragraph
            .split(/(\*\*[^*]+\*\*)/g)
            .map((part, i) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i}>{part.slice(2, -2)}</strong>
              ) : (
                part
              ),
            )}
        </p>
      ))}
    </>
  );
}
function StoryImages({ images }: { images: TimelineImage[] }) {
  if (!images.length) return null;
  return (
    <div
      className={`journey-media ${images.length > 1 ? "journey-collage" : ""}`}
    >
      {images.map((image) => (
        <figure key={image.id} className="journey-image">
          <div
            className={`journey-image-frame crop-${image.crop}`}
            style={{
              aspectRatio:
                image.crop === "auto" || image.crop === "contain"
                  ? `${image.width}/${image.height}`
                  : undefined,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              loading="lazy"
              sizes={
                images.length > 1
                  ? "(max-width: 760px) 42vw, 23vw"
                  : "(max-width: 760px) 80vw, (max-width: 1200px) 40vw, 520px"
              }
              style={{
                objectFit: image.crop === "contain" ? "contain" : "cover",
                objectPosition: `${image.focusX}% ${image.focusY}%`,
              }}
            />
          </div>
          {image.caption && <figcaption>{image.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
export function StoryTimeline({ chapters }: { chapters: TimelineChapter[] }) {
  const ordered = orderChapters(chapters);
  const future = ordered.find((c) => c.isFuture);
  return (
    <section className="journey-section" aria-labelledby="journey-title">
      <JourneyMotion>
        <header className="journey-heading">
          <div className="editorial-kicker">
            <span>IKKE BYGGET PÅ EN DAG</span>
            <span>BARE EN IDÉ, DER BLEV VED</span>
          </div>
          <p className="eyebrow">SMÅ SKRIDT. EN HEL DEL KAFFE.</p>
          <h1 id="journey-title">
            VORES <em>REJSE</em>
          </h1>
          <p className="journey-intro">
            Fra en spontan idé på den anden side af jorden til friskristet
            specialkaffe i hjertet af Aalborg.
          </p>
          <nav
            className="journey-shortcuts"
            aria-label="Gå til et kapitel i historien"
          >
            <a href={`#kapitel-${ordered[0].id}`}>
              Den første idé <ArrowDown size={13} aria-hidden="true" />
            </a>
            {future && (
              <a href={`#kapitel-${future.id}`}>
                Det næste kapitel <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            )}
          </nav>
        </header>
        <div className="journey-track">
          <div className="journey-line" aria-hidden="true">
            <span />
          </div>
          <ol className="journey-entries">
            {ordered.map((chapter, index) => (
              <li
                key={chapter.id}
                id={`kapitel-${chapter.id}`}
                className={`journey-entry ${index % 2 ? "journey-reverse" : ""} ${chapter.images.length ? "" : "journey-text-only"} ${chapter.isFuture ? "journey-future" : ""}`}
              >
                <a
                  className="journey-dot"
                  href={`#kapitel-${chapter.id}`}
                  aria-label={`Kapitel ${index + 1}: ${chapter.period} – ${chapter.title}`}
                >
                  <span />
                </a>
                <div className="journey-copy">
                  <p className="journey-period">
                    {chapter.dateTime ? (
                      <time dateTime={chapter.dateTime}>{chapter.period}</time>
                    ) : (
                      chapter.period
                    )}
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </p>
                  <h3>{chapter.title}</h3>
                  <div className="journey-body">
                    <StoryText text={chapter.body} />
                  </div>
                </div>
                <StoryImages images={chapter.images} />
              </li>
            ))}
          </ol>
        </div>
      </JourneyMotion>
      <div className="journey-invitation">
        <span className="journey-invitation-star" aria-hidden="true">
          ✳
        </span>
        <p className="eyebrow">EN PLADS I HVERDAGEN. OGSÅ DIN.</p>
        <h2>
          VÆR MED TIL AT GØRE
          <br />
          <em>GOD KAFFE TIL HVERDAG.</em>
        </h2>
        <p>
          Ristet Aalborg handler ikke om at gøre specialkaffe eksklusivt.
          Tværtimod.
        </p>
        <p>
          Vi vil gøre den tilgængelig for flere – uden at gå på kompromis med
          smagen.
        </p>
        <p>Og jo flere vi bliver, jo længere kan vi tage idéen.</p>
        <Link href="/shop" className="button dark">
          UDFORSK VORES KAFFE <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
