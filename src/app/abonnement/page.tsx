import { SubscriptionConfigurator } from "@/components/subscription-configurator";
import { subscriptionSchema, subscriptionKey } from "@/lib/subscriptions";
export const metadata = {
  title: "Kaffeabonnement – friskristet kaffe i din rytme",
  description:
    "Sammensæt dit kaffeabonnement fra Ristet Aalborg. Vælg espresso, filter eller blandet, mængde og levering hver 2., 4. eller 6. uge. Friskristet på bestilling.",
  alternates: { canonical: "/abonnement" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ valg?: string }>;
}) {
  const query = await searchParams;
  let initial;
  try {
    initial = subscriptionSchema.safeParse(JSON.parse(query.valg || "null"));
  } catch {
    initial = undefined;
  }
  const selection = initial?.success ? initial.data : undefined;
  return (
    <section className="section">
      <div className="page-intro">
        <p className="eyebrow">ET GODT RITUAL, DER BLIVER VED</p>
        <h1>
          Kaffe i <em>din rytme.</em>
        </h1>
        <p>
          Morgenkaffe uden den store planlægning. Vælg dine bønner, din mængde
          og den rytme, der passer til dig. Friskristet på bestilling i Aalborg.
        </p>
      </div>
      <SubscriptionConfigurator
        initial={selection}
        editKey={selection ? subscriptionKey(selection) : undefined}
      />
      <p className="draft-note">
        Gem dit valg i kurven eller på din profil. Betaling og levering er ikke
        åbnet. Når salget åbner, skal du bekræfte priser og abonnementsvilkår,
        før noget sættes i gang.
      </p>
    </section>
  );
}
