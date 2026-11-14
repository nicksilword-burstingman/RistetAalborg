"use client";
import { useState, type FormEvent } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { CheckoutSettings } from "@/lib/checkout";

export function CheckoutSettingsEditor({
  initialSettings,
}: {
  initialSettings: CheckoutSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data);
      setMessage("Fragtindstillingerne er gemt. Kassen bruger de nye priser.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Kunne ikke gemme.");
    } finally {
      setBusy(false);
    }
  }
  const change = (
    index: number,
    patch: Partial<CheckoutSettings["shippingMethods"][number]>,
  ) =>
    setSettings((s) => ({
      ...s,
      shippingMethods: s.shippingMethods.map((m, i) =>
        i === index ? { ...m, ...patch } : m,
      ),
    }));
  return (
    <form onSubmit={save} className="admin-commerce-settings">
      <h2>Levering og fragt</h2>
      <p>
        Tilføj dine egne aftaler og priser inkl. moms. Levering til Danmark.
        Beløb indtastes i kroner.
      </p>
      <p>
        Fragtvalget dækker leveringsform og pris. Booking af labels og valg af
        konkrete pakkeshops kræver en senere transportørintegration. Brug kun
        leveringsvalg, du kan ekspedere med den angivne adresse.
      </p>
      <fieldset disabled={busy}>
        {settings.shippingMethods.map((method, index) => (
          <div key={method.id} className="admin-shipping-row">
            <label>
              Navn
              <input
                required
                maxLength={80}
                value={method.name}
                onChange={(e) => change(index, { name: e.target.value })}
                placeholder="Fx levering til din adresse"
              />
            </label>
            <label>
              Beskrivelse og leveringstid
              <input
                required
                maxLength={240}
                value={method.description}
                onChange={(e) => change(index, { description: e.target.value })}
                placeholder="Udfyld din faktiske leveringsaftale"
              />
            </label>
            <div className="admin-shipping-amounts">
              <label>
                Fragt inkl. moms (kr.)
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.01"
                  required
                  value={method.amountOre / 100}
                  onChange={(e) =>
                    change(index, {
                      amountOre: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </label>
              <label>
                Gratis fra (kr., valgfrit)
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="0.01"
                  value={
                    method.freeAboveOre === null
                      ? ""
                      : method.freeAboveOre / 100
                  }
                  onChange={(e) =>
                    change(index, {
                      freeAboveOre:
                        e.target.value === ""
                          ? null
                          : Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="admin-quiet"
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  shippingMethods: s.shippingMethods.filter(
                    (_, i) => i !== index,
                  ),
                }))
              }
            >
              <Trash2 size={15} /> Fjern leveringsform
            </button>
          </div>
        ))}
        <button
          type="button"
          className="admin-quiet"
          disabled={settings.shippingMethods.length >= 6}
          onClick={() =>
            setSettings((s) => ({
              ...s,
              shippingMethods: [
                ...s.shippingMethods,
                {
                  id: `fragt-${crypto.randomUUID().slice(0, 8)}`,
                  name: "",
                  description: "",
                  amountOre: 0,
                  freeAboveOre: null,
                },
              ],
            }))
          }
        >
          <Plus size={17} /> Tilføj leveringsform
        </button>
        <label className="admin-legal-check">
          <input
            type="checkbox"
            checked={settings.termsReady}
            onChange={(e) =>
              setSettings((s) => ({ ...s, termsReady: e.target.checked }))
            }
          />{" "}
          Handelsbetingelser, privatliv, virksomhedsoplysninger og
          leveringsvilkår er færdiggjort og godkendt.
        </label>
        <p>
          Afkrydsningen åbner ikke for betaling. Stripe-forbindelse,
          driftstilstand og offentliggjorte produkter kontrolleres også af
          serveren.
        </p>
        <button className="button dark" type="submit">
          <Save size={16} /> {busy ? "Gemmer …" : "Gem fragtindstillinger"}
        </button>
      </fieldset>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
