"use client";
import { useState, type FormEvent } from "react";
import type { SubscriptionSettings } from "@/lib/subscriptions";
export function SubscriptionSettingsEditor({
  initial,
}: {
  initial: SubscriptionSettings;
}) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSettings(data.settings);
      setMessage("Abonnementspriserne er gemt.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunne ikke gemme.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-commerce-settings" onSubmit={save}>
      <h2>Abonnementernes priser</h2>
      <p>
        Foreløbige priser pr. levering inkl. moms, uden fragt. De gælder alle
        bryggemetoder og kaffevalg. Abonnementer kan gemmes i kurven;
        tilbagevendende betaling er lukket.
      </p>
      <fieldset disabled={busy}>
        <div className="profile-fields">
          {(["250", "500", "1000"] as const).map((grams) => (
            <label key={grams}>
              {grams === "1000" ? "1 kg" : `${grams} g`} · kroner
              <input
                type="number"
                min="1"
                max="10000"
                step="0.01"
                required
                value={settings.prices[grams] / 100}
                onChange={(e) =>
                  setSettings((s) => ({
                    prices: {
                      ...s.prices,
                      [grams]: Math.round(Number(e.target.value) * 100),
                    },
                  }))
                }
              />
            </label>
          ))}
        </div>
        <button className="button dark" type="submit">
          {busy ? "Gemmer …" : "Gem abonnementspriser"}
        </button>
      </fieldset>
      <p role="status">{message}</p>
    </form>
  );
}
