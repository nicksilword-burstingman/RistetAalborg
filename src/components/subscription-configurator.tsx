"use client";
import { useState } from "react";
export function SubscriptionConfigurator() {
  const [method, setMethod] = useState("Blandet");
  const [weight, setWeight] = useState("1 kg");
  const [weeks, setWeeks] = useState("4");
  const [coffee, setCoffee] = useState("Risterens valg");
  return (
    <div className="configurator">
      <div>
        {[
          [
            "Din bryggemetode",
            method,
            setMethod,
            ["Espresso", "Filter", "Blandet"],
          ],
          ["Din mængde", weight, setWeight, ["250 g", "500 g", "1 kg"]],
          ["Levering hver", weeks, setWeeks, ["2", "4", "6"]],
        ].map(([title, value, setter, options]) => (
          <fieldset key={title as string}>
            <legend>{title as string}</legend>
            <div className="choice-row">
              {(options as string[]).map((option) => (
                <button
                  key={option}
                  aria-pressed={value === option}
                  onClick={() => (setter as (v: string) => void)(option)}
                >
                  {option}
                  {title === "Levering hver" ? " uger" : ""}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="field-label">
          Din kaffe
          <select value={coffee} onChange={(e) => setCoffee(e.target.value)}>
            {[
              "Risterens valg",
              "Guatemala Antigua",
              "Ethiopia Guji Shakisso",
              "Brazil Selection",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <aside className="subscription-summary" aria-live="polite">
        <p className="eyebrow">DIN KAFFERYTME</p>
        <h2>
          {weight}
          <br />
          <em>hver {weeks}. uge.</em>
        </h2>
        <p>
          {method} · {coffee}
        </p>
        <strong>
          {weight === "1 kg"
            ? "279 kr. pr. levering"
            : "Pris offentliggøres senere"}
        </strong>
        <p>Eksempelpris inkl. moms. Fragt er ikke fastlagt.</p>
        <div className="notice">
          Dette er en forhåndsvisning. Der oprettes ikke et abonnement, og du
          bliver ikke opkrævet betaling.
        </div>
      </aside>
    </div>
  );
}
