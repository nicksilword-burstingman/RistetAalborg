import { SubscriptionConfigurator } from "@/components/subscription-configurator";
export const metadata = { title: "Kaffeabonnement" };
export default function Page() {
  return (
    <section className="section">
      <div className="page-intro">
        <p className="eyebrow">ET GODT RITUAL, DER BLIVER VED</p>
        <h1>
          Kaffe i <em>din rytme.</em>
        </h1>
        <p>
          Prøv den kommende abonnementsvælger. Vælg din kaffe, mængde og
          leveringsrytme.
        </p>
      </div>
      <SubscriptionConfigurator />
      <p className="draft-note">
        Abonnement er under udvikling. Pause, ændring og opsigelse fra din konto
        implementeres inden åbning.
      </p>
    </section>
  );
}
