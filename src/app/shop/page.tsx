import { Catalog } from "@/components/catalog";
export const metadata = {
  title: "Shop specialkaffe – espresso og filter, ristet i Aalborg",
  description:
    "Find din næste kaffe hos Ristet Aalborg. Friskristede hele bønner fra Guatemala, Etiopien og Brasilien til espresso og filter. Specialkaffe til en fair pris.",
  alternates: { canonical: "/shop" },
};
export default function Shop() {
  return (
    <section className="section catalog-page">
      <div className="page-intro">
        <p className="eyebrow">FRISKRISTET SPECIALKAFFE FRA AALBORG</p>
        <h1>
          Din kaffe.
          <br />
          <em>Din gode stund.</em>
        </h1>
        <p>
          Til den første kop, den næste pause og alt det indimellem.
          <br />
          Gå på opdagelse i vores kommende sortiment.
        </p>
      </div>
      <div className="notice">
        Forhåndsvisning: Alle produkter er kladder med eksempelpriser inkl.
        moms. Køb åbner senere.
      </div>
      <Catalog />
    </section>
  );
}
