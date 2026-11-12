import Link from "next/link";
export const metadata = { title: "Min konto" };
export default function Page() {
  return (
    <section className="section reading-page">
      <p className="eyebrow">MIN KONTO</p>
      <h1>
        Dit eget <em>kaffehjørne.</em>
      </h1>
      <p>
        Kundeområdet åbner sammen med webshoppen. Her bliver der plads til dine
        ordrer, adresser og abonnementer.
      </p>
      <div className="notice">
        Login og kontooprettelse er endnu ikke tilgængelige. Vi indsamler ingen
        kontooplysninger i denne forhåndsvisning.
      </div>
      <Link href="/shop" className="button dark">
        Udforsk kaffen →
      </Link>
    </section>
  );
}
