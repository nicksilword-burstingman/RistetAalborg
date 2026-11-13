"use client";
import { useState } from "react";
import Link from "next/link";
import { supportCampaign, supportPrice } from "@/lib/support";
import { Product, formatPrice } from "@/lib/catalog";
import { CoffeeLabel } from "./product-card";
export function ProductDetail({
  product: p,
  support = false,
}: {
  product: Product;
  support?: boolean;
}) {
  const [grams, setGrams] = useState(250);
  const variant = p.variants.find((v) => v.grams === grams)!;
  return (
    <div className="product-detail">
      <div>
        <div className={`detail-image ${p.color}`}>
          <CoffeeLabel product={p} large />
        </div>
        <p className="draft-note">
          <a href={p.label.src} target="_blank" rel="noreferrer">
            Se etiketten i fuld størrelse ↗
          </a>
        </p>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">
          {p.country} / {p.methods.join(" & ")}
        </p>
        <h1>{p.name}</h1>
        <p>{p.description}</p>
        <p className="detail-price" aria-live="polite">
          {formatPrice(
            support ? supportPrice(variant.priceOre) : variant.priceOre,
          )}{" "}
          <small>inkl. moms · eksempelpris</small>
        </p>
        {support ? (
          <div className="support-breakdown" aria-live="polite">
            <p className="eyebrow">KAFFE MED OMTANKE</p>
            <dl className="product-facts">
              <div>
                <dt>Kaffens normale pris</dt>
                <dd>{formatPrice(variant.priceOre)}</dd>
              </div>
              <div>
                <dt>Ekstra støtte pr. pose</dt>
                <dd>{formatPrice(supportCampaign.contributionOre)}</dd>
              </div>
              <div>
                <dt>Samlet eksempelpris</dt>
                <dd>{formatPrice(supportPrice(variant.priceOre))}</dd>
              </div>
            </dl>
            <p>
              De ekstra 20 kr. er tiltænkt et støtteformål. Modtager og vilkår
              er endnu ikke fastlagt. Der indsamles ingen penge nu.
            </p>
            <Link className="text-link" href={"/shop/" + p.slug}>
              Se kaffen uden støtte →
            </Link>
          </div>
        ) : (
          <Link className="text-link" href={"/stoet/" + p.slug}>
            Vælg samme kaffe med 20 kr. i støtte →
          </Link>
        )}
        <fieldset>
          <legend>Vælg posestørrelse</legend>
          <div className="choice-row">
            {p.variants.map((v) => (
              <button
                key={v.sku}
                aria-pressed={grams === v.grams}
                onClick={() => setGrams(v.grams)}
              >
                {v.grams === 1000 ? "1 kg" : `${v.grams} g`}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field-label">
          Bønner eller formalet
          <select>
            <option>Hele bønner</option>
            <option>Formalet til filter</option>
            <option>Formalet til stempelkande</option>
            <option>Formalet til espresso</option>
          </select>
        </label>
        <div className="notice">
          Produktkladde · Ikke til salg endnu. Pris og formalingsmuligheder er
          eksempler.
        </div>
        <dl className="product-facts">
          {[
            ["Oprindelse", p.country],
            ["Region", p.region],
            ["Væksthøjde", p.altitude],
            ["Proces", p.process],
            ["Ristning", p.roast],
            ["Smagsnoter", "Offentliggøres inden salgsstart"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v ?? "Afventer bekræftelse"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
