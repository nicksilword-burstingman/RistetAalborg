import Link from "next/link";
export default function NotFound() {
  return (
    <section className="section reading-page">
      <p className="eyebrow">404 · SIDEN FINDES IKKE</p>
      <h1>
        En lille <em>kaffepause?</em>
      </h1>
      <p>Vi kunne ikke finde den side, du leder efter.</p>
      <Link href="/" className="button dark">
        Tilbage til forsiden →
      </Link>
    </section>
  );
}
