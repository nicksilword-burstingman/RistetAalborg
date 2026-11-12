import Link from "next/link";
import { ContactDetails } from "./contact-details";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Link href="/" className="footer-brand">
            RISTET AALBORG<span>KAFFE MED KÆRLIGHED.</span>
          </Link>
          <p>
            Et lille risteri. En stor kærlighed til kaffe.
            <br />
            Friskristet specialkaffe. Til en fair pris.
          </p>
          <ContactDetails />
        </div>
        <div>
          <h3>Gå på opdagelse</h3>
          <Link href="/shop">Vores kaffe</Link>
          <Link href="/stoet">Kaffe med omtanke</Link>
          <Link href="/abonnement">Kaffeabonnement</Link>
          <Link href="/om-os">Historien bag</Link>
          <Link href="/bryggeguide">Bryg en bedre kop</Link>
        </div>
        <div>
          <h3>Det praktiske</h3>
          <Link href="/information/faq">Spørgsmål & svar</Link>
          <Link href="/information/levering">Levering & retur</Link>
          <Link href="/information/kontakt">Kontakt</Link>
          <Link href="/information/handelsbetingelser">Handelsbetingelser</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Ristet Aalborg</span>
        <span>RISTET I AALBORG. NYDT OVERALT.</span>
        <div>
          <Link href="/information/privatliv">Privatliv</Link>
          <Link href="/information/cookies">Cookieindstillinger</Link>
        </div>
      </div>
      <p className="demo-footer">
        Forhåndsvisning · Produkter og priser er eksempler. Webshoppen modtager
        endnu ikke bestillinger.
      </p>
    </footer>
  );
}
