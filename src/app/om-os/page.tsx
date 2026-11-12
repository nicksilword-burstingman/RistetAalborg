import Image from "next/image";
import Link from "next/link";
export const metadata = {
  title: "Mennesket bag Ristet — kaffe, medicin og omtanke",
};
export default function Page() {
  return (
    <section className="section personal-about">
      <div className="editorial-kicker">
        <span>MENNESKET BAG RISTET</span>
        <span>LOKALT. ÆRLIGT. UDEN FILTER.</span>
      </div>
      <div className="page-intro">
        <h1>
          Et hoved fuldt af idéer.
          <br />
          <em>Et hjerte for mennesker.</em>
        </h1>
        <p>Og en ret stor kærlighed til kaffe.</p>
      </div>
      <div className="story about-story">
        <div>
          <h2>
            Hej. Det er mig
            <br />
            <em>bag bønnerne.</em>
          </h2>
          <p>
            Jeg er medicinstuderende, kaffenysgerrig og en fyr med krudt i
            røven. Jeg får mange idéer. Nogle bliver ved tanken. Denne her blev
            til Ristet Aalborg.
          </p>
          <p>
            Jeg vil gerne gøre en forskel for andre mennesker. Det er en vigtig
            del af mit forhold til medicin, og det er også en del af den måde,
            jeg vil drive mit risteri på.
          </p>
          <h3>God kaffe skal være til at komme til.</h3>
          <p>
            Du skal ikke have et særligt ordforråd eller et stort kaffebudget
            for at være med. Måske vil du bare prøve noget andet end den
            sædvanlige pose fra supermarkedet. Måske har du allerede nørdet
            kaffe i årevis. Begge dele er lige velkomne.
          </p>
          <p>
            Min ambition er friskristet specialkaffe i små batches til en fair
            pris. Noget, der føles som en god beslutning i hverdagen — også når
            huslejen er betalt.
          </p>
          <h3>Omsorgen skal kunne mærkes.</h3>
          <p>
            Derfor er der også en støtteside. Idéen er, at du kan vælge den
            samme kaffe til 20 kr. mere pr. pose, og at de ekstra penge går til
            et bestemt formål. Modtager og vilkår skal være på plads inden
            åbning.
          </p>
          <div className="info-links">
            <Link className="text-link" href="/shop">
              Find din kaffe ↗
            </Link>
            <Link className="text-link" href="/stoet">
              Kaffe med omtanke ↗
            </Link>
          </div>
        </div>
        <figure className="founder-portrait">
          <Image
            src="/images/founder-portrait.jpg"
            width={900}
            height={1600}
            sizes="(max-width: 760px) 88vw, 43vw"
            alt="Grundlæggeren af Ristet Aalborg smiler ved computeren med en kaffekop i hånden."
          />
          <figcaption>MANGE TANKER. GOD KAFFE. PLADS TIL DIG.</figcaption>
        </figure>
      </div>
      <div className="about-workbench">
        <div>
          <p className="eyebrow">ET LILLE KIG BAG SKÆRMEN</p>
          <h2>
            En kop kaffe.
            <br />
            <em>Og noget på hjerte.</em>
          </h2>
          <p>
            Her sidder jeg og bygger det, du kigger på lige nu. Med en kop inden
            for rækkevidde og hovedet fuldt af idéer til Ristet Aalborg.
          </p>
          <p>
            Hjemmesiden skal føles som det, der er bag den: et menneske, der
            elsker kaffe og gerne vil dele glæden ved den.
          </p>
        </div>
        <figure className="founder-work-photo">
          <Image
            src="/images/founder-at-work.jpg"
            width={900}
            height={1600}
            sizes="(max-width: 760px) 88vw, 43vw"
            alt="Grundlæggeren arbejder på Ristet Aalborgs hjemmeside ved bordet med sin kaffe ved computeren."
          />
          <figcaption>FRA EN IDÉ TIL NOGET, VI KAN DELE.</figcaption>
        </figure>
      </div>
    </section>
  );
}
