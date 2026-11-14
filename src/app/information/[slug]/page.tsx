import { notFound } from "next/navigation";
import { ContactDetails } from "@/components/contact-details";
const pages: Record<string, { title: string; paragraphs: string[] }> = {
  faq: {
    title: "Spørgsmål & svar",
    paragraphs: [
      "Kan jeg bestille kaffe nu? Ikke endnu. Webshoppen er under opbygning, og sortimentet vises som produktkladder med eksempelpriser.",
      "Hvor ristes kaffen? Ristet Aalborg er et uafhængigt mikroristeri i Aalborg.",
      "Er priserne inkl. moms? Ja, de viste eksempelpriser er inkl. moms. Fragt og leveringsvilkår fastlægges inden salgsstart.",
      "Kan jeg få formalet kaffe? Vi tilbyder kun hele bønner lige nu.",
    ],
  },
  levering: {
    title: "Levering & retur",
    paragraphs: [
      "Leveringsområder, fragtpriser, transportør og forventet leveringstid offentliggøres inden salgsstart.",
      "Returadresse og vilkår for fortrydelse, reklamation og tilbagebetaling skal færdiggøres og godkendes, før webshoppen åbner. Denne side er en kladde.",
    ],
  },
  kontakt: {
    title: "Lad os tale om kaffe.",
    paragraphs: [
      "Ristet Aalborg · Uafhængigt mikroristeri i Aalborg.",
      "Har du spørgsmål til kaffen eller risteriet? Du er velkommen til at ringe.",
    ],
  },
  handelsbetingelser: {
    title: "Handelsbetingelser",
    paragraphs: [
      "Kladde — webshoppen er ikke åben for køb.",
      "Virksomhedsnavn, CVR, adresse og kontaktoplysninger skal bekræftes. Betingelser for betaling, levering, fortrydelse, reklamation og abonnement skal færdiggøres og juridisk gennemgås inden salgsstart.",
    ],
  },
  privatliv: {
    title: "Privatlivspolitik",
    paragraphs: [
      "Kladde — den endelige privatlivspolitik offentliggøres inden lancering.",
      "Kassen understøtter kontaktoplysninger, leveringsadresse og betaling hos Stripe, når forbindelsen er konfigureret. Ved et betalingsforsøg gemmes bestillingen og de nødvendige kontakt- og leveringsoplysninger. Testtilstand er tydeligt markeret. Indtast kun testoplysninger ved testkøb.",
      "Dataansvarlig, formål, retsgrundlag, databehandlere, opbevaringsperioder og dine rettigheder skal dokumenteres ud fra den faktiske produktionsopsætning.",
    ],
  },
  cookies: {
    title: "Cookieindstillinger",
    paragraphs: [
      "Webshoppen sætter ingen analyse- eller marketingcookies. Kurven gemmes lokalt i din browser. Kassen bruger en nødvendig cookie til at knytte din bestilling til din browser og beskytte adgangen til ordreoplysninger. Cookien udløber efter 30 dage. Administrationen bruger en separat login-cookie med op til otte timers levetid.",
      "Betaling foregår hos Stripe, når betalingsforbindelsen er konfigureret. Den endelige information om databehandlere og opbevaring færdiggøres før salgsstart.",
    ],
  },
};
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: pages[slug]?.title ?? "Side ikke fundet" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <section className="section reading-page">
      <p className="eyebrow">DET PRAKTISKE</p>
      <h1>{page.title}</h1>
      {page.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {slug === "kontakt" && <ContactDetails />}
    </section>
  );
}
