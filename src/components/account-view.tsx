"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Coffee,
  MapPin,
  Package,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useCart } from "./cart-provider";
import {
  customerProfileSchema,
  type CustomerProfile,
} from "@/lib/customer-profile";
import { formatPrice, formatWeight } from "@/lib/catalog";
import {
  subscriptionCoffees,
  subscriptionMethods,
  subscriptionKey,
} from "@/lib/subscriptions";

type Account = {
  user: { name: string; email: string; emailVerified: boolean };
  profile: CustomerProfile;
  orders: {
    number: string;
    mode: string;
    status: string;
    createdAt: number;
    totalOre: number;
    refundedOre: number;
    fulfillment: string;
  }[];
};
async function authRequest(endpoint: string, body: unknown) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 429)
      throw new Error("For mange forsøg. Vent lidt, og prøv igen.");
    if (endpoint === "sign-in/email")
      throw new Error("E-mail eller adgangskode kunne ikke genkendes.");
    if (endpoint === "sign-up/email")
      throw new Error(
        "Kontoen kunne ikke oprettes. Kontrollér oplysningerne, eller prøv at logge ind, hvis du allerede har en konto.",
      );
    throw new Error(
      "Ændringen kunne ikke gemmes. Kontrollér oplysningerne, og prøv igen.",
    );
  }
}
export function AccountView() {
  const cart = useCart();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overblik");
  async function load() {
    const response = await fetch("/api/konto", { cache: "no-store" });
    if (!response.ok)
      throw new Error(
        "Din profil kunne ikke hentes. Genindlæs siden for at prøve igen.",
      );
    const data = await response.json();
    setAccount(data.user ? data : null);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/konto", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (active) setAccount(data.user ? data : null);
      })
      .catch(() => {
        if (active)
          setError(
            "Din profil kunne ikke hentes. Genindlæs siden for at prøve igen.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function run(action: () => Promise<void>, success = "") {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prøv igen om lidt.");
    } finally {
      setBusy(false);
    }
  }
  async function saveProfile(profile: CustomerProfile) {
    const response = await fetch("/api/konto", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setAccount((a) => (a ? { ...a, profile: data.profile } : null));
  }
  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(
      async () => {
        await authRequest(register ? "sign-up/email" : "sign-in/email", {
          email: String(data.get("email")).trim(),
          password: data.get("password"),
          ...(register ? { name: String(data.get("name")).trim() } : {}),
        });
        await load();
      },
      register ? "Velkommen i dit kaffehjørne." : "Du er logget ind.",
    );
  }
  if (loading)
    return (
      <p className="account-loading" role="status">
        Vi finder dit kaffehjørne …
      </p>
    );
  return (
    <section className="section account-shell">
      <div className="page-intro">
        <p className="eyebrow">MIN KONTO · LIDT MERE DIG</p>
        <h1>
          Dit eget <em>kaffehjørne.</em>
        </h1>
        <p>
          {account
            ? `Hej ${account.user.name}. Her er der styr på dine kaffevalg og plads til næste gode kop.`
            : "Gem dine kaffevalg, hav adressen klar, og følg dine kommende bestillinger. Kaffen behøver du ikke have styr på endnu."}
        </p>
      </div>
      <div aria-live="polite">
        {error && (
          <p className="checkout-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="account-feedback" role="status">
            {message}
          </p>
        )}
      </div>
      {!account ? (
        <div className="account-entry">
          <div className="account-form-card">
            <div
              className="account-switch"
              role="group"
              aria-label="Vælg login eller oprettelse"
            >
              <button
                type="button"
                aria-pressed={!register}
                onClick={() => {
                  setRegister(false);
                  setError("");
                }}
              >
                Log ind
              </button>
              <button
                type="button"
                aria-pressed={register}
                onClick={() => {
                  setRegister(true);
                  setError("");
                }}
              >
                Opret konto
              </button>
            </div>
            <form key={String(register)} onSubmit={login}>
              <fieldset disabled={busy}>
                {register && (
                  <label>
                    Dit navn
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </label>
                )}
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                  />
                </label>
                <label>
                  Adgangskode
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    required
                    minLength={register ? 12 : 1}
                    maxLength={128}
                  />
                </label>
                {register && (
                  <>
                    <p>
                      Brug mindst 12 tegn. En lang sætning er nemmere at huske.
                    </p>
                    <p>
                      Læs, hvordan vi behandler dine oplysninger, i vores{" "}
                      <Link href="/information/privatliv" className="text-link">
                        privatlivspolitik
                      </Link>
                      .
                    </p>
                  </>
                )}
                <button className="button dark" type="submit">
                  {busy
                    ? "Et øjeblik …"
                    : register
                      ? "Opret dit kaffehjørne"
                      : "Log ind"}
                  <ArrowUpRight size={18} />
                </button>
              </fieldset>
            </form>
            <p className="account-mail-note">
              Kundeområdet er åbent til forberedelse. E-mailbekræftelse og
              gendannelse af en glemt adgangskode er endnu ikke tilsluttet. Gem
              derfor din adgangskode et sikkert sted.
            </p>
          </div>
          <aside className="account-intro-card">
            <Coffee size={35} strokeWidth={1.3} />
            <h2>
              God kaffe.
              <br />
              <em>På dine præmisser.</em>
            </h2>
            <p>
              Din egen lille plads hos et lille risteri. Ingen medlemspris og
              ingen krav om, at du kan smage 17 forskellige bær.
            </p>
            <ul>
              <li>Gem adressen til næste bestilling.</li>
              <li>Find din egen abonnementsrytme.</li>
              <li>Se ordrer, du lægger som indlogget kunde.</li>
            </ul>
            <Link className="text-link" href="/shop">
              Start med kaffen <ArrowUpRight size={17} />
            </Link>
          </aside>
        </div>
      ) : (
        <div className="account-layout">
          <nav className="account-nav" aria-label="Kundeområde">
            {[
              ["overblik", "Overblik", Package],
              ["adresse", "Leveringsadresse", MapPin],
              ["kaffe", "Mine kaffevalg", Coffee],
              ["sikkerhed", "Adgangskode", ShieldCheck],
            ].map(([id, label, Icon]) => {
              const Symbol = Icon as typeof Coffee;
              return (
                <button
                  key={String(id)}
                  type="button"
                  aria-current={tab === id ? "page" : undefined}
                  onClick={() => {
                    setTab(String(id));
                    setMessage("");
                    setError("");
                  }}
                >
                  <Symbol size={17} />
                  {String(label)}
                </button>
              );
            })}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await authRequest("sign-out", {});
                  setAccount(null);
                  setTab("overblik");
                }, "Du er logget ud.")
              }
            >
              <LogOut size={17} />
              Log ud
            </button>
          </nav>
          <div className="account-content">
            {tab === "overblik" && (
              <>
                <p className="eyebrow">{account.user.email}</p>
                <h2>Dine bestillinger</h2>
                <p>
                  Her vises bestillinger, du har lagt, mens du var logget ind.
                  Gæstekøb tilknyttes ikke automatisk via e-mail.
                </p>
                {!account.orders.length ? (
                  <div className="account-empty">
                    <Package size={28} />
                    <h3>Den første kop venter.</h3>
                    <p>
                      Der er ingen bestillinger på din konto endnu. Salget
                      åbner, når betaling og levering er klar.
                    </p>
                    <Link href="/shop" className="text-link">
                      Gå på opdagelse <ArrowUpRight size={17} />
                    </Link>
                  </div>
                ) : (
                  <ul className="account-orders">
                    {account.orders.map((order) => (
                      <li key={order.number}>
                        <div>
                          <strong>{order.number}</strong>
                          <p>
                            {new Date(order.createdAt).toLocaleDateString(
                              "da-DK",
                            )}{" "}
                            · {order.mode === "test" ? "Testkøb · " : ""}
                            {order.status === "paid"
                              ? order.fulfillment === "shipped"
                                ? "Sendt"
                                : "Betalt"
                              : order.status === "expired"
                                ? "Udløbet"
                                : "Afventer betaling"}
                          </p>
                          {order.refundedOre > 0 && (
                            <p>Refunderet: {formatPrice(order.refundedOre)}</p>
                          )}
                        </div>
                        <b>{formatPrice(order.totalOre)}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {tab === "adresse" && (
              <>
                <h2>Hvor skal kaffen hen?</h2>
                <p>
                  Gem en dansk leveringsadresse, så du kan hente den frem i
                  kassen.
                </p>
                <form
                  key={JSON.stringify(account.profile.address)}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const parsed = customerProfileSchema.safeParse({
                      ...account.profile,
                      address: { ...Object.fromEntries(data), country: "DK" },
                    });
                    if (!parsed.success) {
                      setError(
                        "Kontrollér navn, dansk postnummer, adresse og telefonnummer.",
                      );
                      return;
                    }
                    void run(
                      () => saveProfile(parsed.data),
                      "Din leveringsadresse er gemt.",
                    );
                  }}
                >
                  <fieldset disabled={busy}>
                    <div className="profile-fields">
                      {[
                        ["firstName", "Fornavn", "given-name", 80],
                        ["lastName", "Efternavn", "family-name", 80],
                        ["address", "Adresse", "street-address", 120],
                        [
                          "address2",
                          "Etage, dør eller c/o (valgfrit)",
                          "address-line2",
                          120,
                        ],
                        ["postalCode", "Postnummer", "postal-code", 4],
                        ["city", "By", "address-level2", 80],
                        ["phone", "Telefon (valgfrit)", "tel", 25],
                      ].map(([name, label, autoComplete, max]) => (
                        <label key={name}>
                          {label}
                          <input
                            name={String(name)}
                            autoComplete={String(autoComplete)}
                            defaultValue={
                              account.profile.address?.[
                                name as keyof NonNullable<
                                  CustomerProfile["address"]
                                >
                              ] ?? ""
                            }
                            required={name !== "address2" && name !== "phone"}
                            maxLength={Number(max)}
                            pattern={
                              name === "postalCode"
                                ? "[1-9][0-9]{3}"
                                : undefined
                            }
                            inputMode={
                              name === "postalCode" ? "numeric" : undefined
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <button type="submit" className="button dark">
                      {busy ? "Gemmer …" : "Gem leveringsadresse"}
                    </button>
                    {account.profile.address && (
                      <button
                        type="button"
                        className="text-link"
                        onClick={() =>
                          void run(
                            () =>
                              saveProfile({
                                ...account.profile,
                                address: null,
                              }),
                            "Din gemte adresse er slettet.",
                          )
                        }
                      >
                        Fjern gemt adresse
                      </button>
                    )}
                  </fieldset>
                </form>
              </>
            )}
            {tab === "kaffe" && (
              <>
                <h2>Din næste kafferytme.</h2>
                <p>
                  Gem de kaffevalg, du har i kurven, og hent dem frem, når det
                  passer dig. Det er ønsker til et kommende abonnement. Ingen
                  leveringer eller betalinger er startet.
                </p>
                <button
                  type="button"
                  className="button dark"
                  disabled={busy || !cart.ready || !cart.subscriptions.length}
                  onClick={() =>
                    void run(
                      () =>
                        saveProfile({
                          ...account.profile,
                          subscriptions: cart.subscriptions,
                        }),
                      "Kurvens kaffevalg er gemt på din profil.",
                    )
                  }
                >
                  Gem kurvens kaffevalg her
                </button>
                <p className="account-mail-note">
                  Dette erstatter dine tidligere gemte kaffevalg.
                </p>
                {!account.profile.subscriptions.length && (
                  <div className="account-empty">
                    <Coffee size={28} />
                    <p>Du har ikke gemt kaffevalg endnu.</p>
                    <Link href="/abonnement" className="text-link">
                      Sammensæt dit kaffeabonnement <ArrowUpRight size={17} />
                    </Link>
                  </div>
                )}
                {account.profile.subscriptions.map((item) => (
                  <article
                    className="profile-subscription"
                    key={subscriptionKey(item)}
                  >
                    <h3>{subscriptionCoffees[item.coffee]}</h3>
                    <p>
                      {item.quantity} × {formatWeight(item.grams)} ·{" "}
                      {subscriptionMethods[item.method]} · hver {item.weeks}.
                      uge
                    </p>
                    <p className="eyebrow">GEMT KAFFEVALG · IKKE AKTIVT</p>
                    <div className="subscription-item-actions">
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => {
                          try {
                            cart.saveSubscription(item);
                            setError("");
                            setMessage("Kaffevalget er lagt i kurven.");
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Kurven kunne ikke opdateres.",
                            );
                          }
                        }}
                      >
                        Læg i kurven <ArrowUpRight size={16} />
                      </button>
                      <button
                        type="button"
                        className="text-link"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () =>
                              saveProfile({
                                ...account.profile,
                                subscriptions:
                                  account.profile.subscriptions.filter(
                                    (s) =>
                                      subscriptionKey(s) !==
                                      subscriptionKey(item),
                                  ),
                              }),
                            "Kaffevalget er fjernet fra din profil.",
                          )
                        }
                      >
                        Fjern fra profil
                      </button>
                    </div>
                  </article>
                ))}
                <div className="notice">
                  Pause, genoptagelse og opsigelse af betalende abonnementer
                  åbner sammen med tilbagevendende betaling. Dine gemte ønsker
                  binder dig ikke.
                </div>
              </>
            )}
            {tab === "sikkerhed" && (
              <>
                <h2>En nøgle til dit kaffehjørne.</h2>
                <p>
                  Skift din adgangskode her. Andre indloggede enheder bliver
                  logget ud.
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = event.currentTarget;
                    const values = new FormData(form);
                    if (
                      values.get("newPassword") !==
                      values.get("confirmPassword")
                    ) {
                      setError("De to nye adgangskoder skal være ens.");
                      return;
                    }
                    void run(async () => {
                      await authRequest("change-password", {
                        currentPassword: values.get("currentPassword"),
                        newPassword: values.get("newPassword"),
                        revokeOtherSessions: true,
                      });
                      form.reset();
                    }, "Din adgangskode er ændret.");
                  }}
                >
                  <fieldset disabled={busy}>
                    <label>
                      Nuværende adgangskode
                      <input
                        type="password"
                        name="currentPassword"
                        autoComplete="current-password"
                        required
                        maxLength={128}
                      />
                    </label>
                    <label>
                      Ny adgangskode
                      <input
                        type="password"
                        name="newPassword"
                        autoComplete="new-password"
                        required
                        minLength={12}
                        maxLength={128}
                      />
                    </label>
                    <label>
                      Gentag ny adgangskode
                      <input
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        required
                        minLength={12}
                        maxLength={128}
                      />
                    </label>
                    <button type="submit" className="button dark">
                      Skift adgangskode
                    </button>
                  </fieldset>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
