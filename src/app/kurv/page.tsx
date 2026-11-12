import Link from "next/link";
export const metadata = { title: "Din kurv" };
export default function Page() {
  return (
    <section className="section reading-page">
      <p className="eyebrow">DIN KURV</p>
      <h1>
        Der er plads til
        <br />
        <em>god kaffe.</em>
      </h1>
      <p>
        Din kurv er tom. Sortimentet er i forhåndsvisning, og køb bliver
        tilgængeligt, når webshoppen åbner.
      </p>
      <Link href="/shop" className="button dark">
        Se vores kommende kaffe →
      </Link>
    </section>
  );
}
