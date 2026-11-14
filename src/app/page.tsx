import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import { products, featuredProducts, formatPrice } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { FilmIntro } from "@/components/film-intro";

export const metadata = {
  title: "Ristet Aalborg – friskristet specialkaffe på bestilling",
  description:
    "Friskristet specialkaffe på bestilling fra et uafhængigt kafferisteri i Aalborg. Udforsk espresso, filterkaffe og kaffeabonnement. God kaffe til en fair pris.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Ristet Aalborg",
            url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            logo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/images/logo.png`,
            slogan: "Friskristet specialkaffe. Til en fair pris.",
            description:
              "Uafhængigt mikroristeri i Aalborg med friskristet specialkaffe på bestilling.",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <FilmIntro />
      <section className="cover" id="forsiden" aria-labelledby="cover-title">
        <div className="editorial-kicker">
          <span>ET UAFHÆNGIGT MIKRORISTERI</span>
          <span>AALBORG, DANMARK · KAFFE MED PERSONLIGHED</span>
        </div>
        <div className="cover-masthead" aria-hidden="true">
          RISTET<span>AALBORG</span>
        </div>
        <div className="cover-grid">
          <div className="cover-copy">
            <p className="eyebrow">
              FRISKRISTET PÅ BESTILLING · SPECIALKAFFE TIL EN FAIR PRIS.
            </p>
            <h2 id="cover-title">
              God kaffe.
              <br />
              Uden den
              <br />
              <em>høje pris.</em>
            </h2>
            <p>
              Til dig med fuld kalender. Til dig med tom kaffekop. Til dig, der
              bare er nysgerrig. Her er der plads til alle.
            </p>
            <Link href="/shop" className="button dark">
              Find din kaffe <ArrowUpRight size={19} />
            </Link>
            <span className="cover-handwriting">
              Lidt mindre højtideligt. Ret meget os.
            </span>
          </div>
          <div className="cover-art">
            <div className="cover-photo">
              <Image
                src="/images/coffee-picking.jpg"
                alt="En hånd plukker modne kaffebær fra en gren. Illustrativt foto, ikke fra vores leverandør."
                fill
                priority
                sizes="(max-width:760px) 100vw, 55vw"
              />
            </div>
            <div className="cover-label">
              <Image
                {...products[0].label}
                sizes="(max-width: 760px) 175px, (max-width: 1000px) 180px, 280px"
                preload
              />
            </div>
            <div className="cover-price">
              <span>DIN NÆSTE GODE KOP</span>
              <strong>{formatPrice(products[0].variants[0].priceOre)}</strong>
              <small>
                <b>250 g</b>
                <span>eksempelpris inkl. moms</span>
              </small>
            </div>
            <span className="cover-scribble">
              Små batches.
              <br />
              <em>Stor personlighed.</em>
            </span>
          </div>
        </div>
        <div className="cover-bottom">
          <span>KVALITET I KOPPEN. PLADS I BUDGETTET.</span>
          <a href="#kaffen">GÅ PÅ OPDAGELSE ↓</a>
        </div>
        <p className="photo-credit">
          Illustrativt høstfoto, ikke vores leverandør · Saddymonster /
          Wikimedia Commons ·{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0
          </a>{" "}
          · beskåret
        </p>
      </section>
      <div className="attitude-strip">
        <span>GOD KAFFE SKAL VÆRE FOR ALLE</span>
        <span aria-hidden="true">✳</span>
        <span>OGSÅ DIG, DER ER NY I DET</span>
        <span aria-hidden="true">✳</span>
        <span>RISTET I AALBORG</span>
      </div>
      <section className="section coffees" id="kaffen">
        <div className="editorial-kicker">
          <span>01 / KAFFEN</span>
          <span>SMÅ BATCHES. STOR NYSGERRIGHED.</span>
        </div>
        <div className="section-heading">
          <div>
            <h2>
              Smag dig frem.
              <br />
              <em>Du behøver ikke vide alt.</em>
            </h2>
            <p className="editorial-intro">
              Espresso, filter eller bare en ny favorit? Start dér, hvor du er.
            </p>
          </div>
          <Link href="/shop" className="text-link">
            Hele sortimentet <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
        <p className="draft-note">
          Et første kig på sortimentet · Eksempelpriser inkl. moms · Salget er
          ikke åbnet endnu
        </p>
      </section>
      <section className="manifesto">
        <div className="editorial-kicker">
          <span>02 / DET, VI TROR PÅ</span>
          <span>ET LILLE KAFFEMANIFEST</span>
        </div>
        <h2>
          Specialkaffe.
          <br />
          Til <em>almindelige</em>
          <br />
          mennesker<span>.</span>
        </h2>
        <div className="manifesto-bottom">
          <span className="manifesto-star" aria-hidden="true">
            ✳
          </span>
          <p>
            Du skal kunne udforske god kaffe, selv om du også har en husleje.
            Derfor er målet enkelt: kvalitet i koppen og en pris, flere kan være
            med på. Ingen adgangskrav. Ingen smagseksamen.
          </p>
          <Link href="/om-os" className="text-link">
            Derfor er vi her <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section origin-editorial">
        <div className="origin-photo">
          <Image
            src="/images/handpicked-coffee.webp"
            alt="En kaffedyrker plukker modne, røde kaffebær med hånden blandt grønne kaffeplanter"
            fill
            sizes="(max-width:760px) 100vw, 50vw"
          />
        </div>
        <div className="origin-copy">
          <p className="eyebrow">03 / FØR DEN FØRSTE SLURK</p>
          <h2>
            Mange hænder.
            <br />
            <em>Én god kop.</em>
          </h2>
          <p>
            Før din første slurk er der nogen, der har stået med hænderne blandt
            kaffebærrene. Plukket, sorteret og passet på den råvare, vi får lov
            at riste. God kaffe begynder med mennesker.
          </p>
          <p>
            Derfor går vi op i, hvor bønnerne kommer fra, og hvad de kan blive
            til i koppen. Fra Guatemalas højland til din kaffepause i Aalborg:
            Specialkaffe må gerne have en historie. Prisen behøver ikke være en
            hel roman.
          </p>
          <Link href="/shop" className="text-link">
            Lær din kaffe at kende <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section founder-editorial">
        <div className="founder-visual">
          <div className="editorial-kicker">
            <span>04 / MENNESKET BAG</span>
            <span>100 % PERSONLIGT</span>
          </div>
          <Image
            src="/images/founder-choosing-beans.webp"
            alt="Grundlæggeren af Ristet Aalborg på jagt efter kaffebønner til sit eget mikroristeri"
            width={1400}
            height={1867}
            sizes="(max-width: 760px) 90vw, 42vw"
            className="founder-portrait"
          />
          <span className="founder-sticker">
            Mange idéer.
            <br />
            <em>Ét stort hjerte.</em>
          </span>
          <small>PÅ JAGT EFTER BØNNER. OG EN IDÉ, DER IKKE VILLE SLIPPE.</small>
        </div>
        <div className="founder-copy">
          <p className="eyebrow">
            MEDICINSTUDERENDE. KAFFERISTER. IDÉMENNESKE.
          </p>
          <h2>
            Krudt i røven.
            <br />
            <em>
              Hjertet på
              <br />
              rette sted.
            </em>
          </h2>
          <p>
            Jeg studerer medicin, har hovedet fuldt af tanker og svært ved at
            lade en god idé ligge. Ristet Aalborg er én af dem.
          </p>
          <p>
            At hjælpe andre betyder noget for mig. Det gør det på studiet, og
            det skal også kunne mærkes her. I måden, jeg møder dig på. I
            priserne. Og i muligheden for at lade en pose kaffe støtte et godt
            formål.
          </p>
          <Link href="/om-os" className="text-link">
            Mød mennesket bag Ristet <ArrowUpRight size={18} />
          </Link>
          <span className="founder-signature">
            Kaffe med kærlighed. Helt bogstaveligt.
          </span>
        </div>
      </section>
      <section className="support-editorial">
        <div>
          <p className="eyebrow">05 / EN KOP MED LIDT MERE I</p>
          <h2>
            God smag.
            <br />
            <em>God mavefornemmelse.</em>
          </h2>
          <p>
            Samme kaffe. 20 kr. ekstra pr. pose, tiltænkt et godt formål. Fordi
            omsorg også gerne må få plads i en webshop.
          </p>
          <Link href="/stoet" className="button cream">
            Kaffe med omtanke <ArrowUpRight size={19} />
          </Link>
          <small>
            Støtteformål og vilkår er på vej. Der indsamles ingen penge endnu.
          </small>
        </div>
        <div className="support-mark">
          <Heart size={78} strokeWidth={1} aria-hidden="true" />
          <strong>
            +20<span>kr.</span>
          </strong>
          <p>
            LIDT EKSTRA FRA DIG.
            <br />
            TILTÆNKT NOGET GODT.
          </p>
        </div>
      </section>
      <section className="section everyday-editorial">
        <div className="everyday-image">
          <Image
            src="/images/coffee-moment.jpg"
            alt="Kaffe og en stille stund i hverdagen"
            fill
            sizes="(max-width:760px) 100vw, 45vw"
          />
          <span>DER MÅ GODT VÆRE EN PAUSE MIDT I DET HELE.</span>
        </div>
        <div>
          <p className="eyebrow">06 / FIND DIN EGEN RYTME</p>
          <h2>
            Hjernen på højtryk.
            <br />
            <em>Kaffen på plads.</em>
          </h2>
          <p>
            Et abonnement til hverdagen med mange bolde i luften. Eller en
            bryggeguide til de fem minutter, du tager for dig selv.
          </p>
          <Link href="/abonnement" className="text-link">
            Udforsk kaffeabonnement <ArrowUpRight size={18} />
          </Link>
          <Link href="/bryggeguide" className="text-link">
            Bryg en kop, du kan lide <ArrowUpRight size={18} />
          </Link>
          <small>
            Sammensæt dit abonnement og gem dit valg. Betaling åbner senere.
          </small>
        </div>
      </section>
      <section className="newsletter editorial-newsletter">
        <p className="eyebrow">POST FRA ET HOVED MED MANGE IDÉER</p>
        <h2>
          Nye bønner.
          <br />
          Skæve tanker.
          <br />
          <em>Ingen kaffefacade.</em>
        </h2>
        <p>
          Små historier fra risteriet, nye kaffer og noget, du kan bruge i din
          næste kop.
        </p>
        <div className="coming-soon">
          Nyhedsbrevet er på vej <ArrowUpRight size={18} />
        </div>
        <small>Tilmelding åbner, når nyhedsbrevet er klar.</small>
      </section>
    </>
  );
}
