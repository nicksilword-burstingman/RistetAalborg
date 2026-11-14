"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_BAGS } from "@/lib/catalog";

export function QuantitySelector({
  value,
  onChange,
  label = "Antal poser",
}: {
  value: number;
  onChange: (quantity: number) => void;
  label?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const parsed = Number(draft ?? value);
    const next = Number.isFinite(parsed)
      ? Math.max(1, Math.min(MAX_BAGS, Math.trunc(parsed)))
      : value;
    onChange(next);
    setDraft(null);
  };
  return (
    <div className="quantity-control">
      <label htmlFor={id}>{label}</label>
      <div className="quantity-stepper">
        <button
          type="button"
          aria-label={`Færre: ${label.toLowerCase()}`}
          disabled={value <= 1}
          onClick={() => {
            setDraft(null);
            onChange(value - 1);
          }}
        >
          <Minus size={15} />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_BAGS}
          step={1}
          value={draft ?? value}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const parsed = Number(text);
            if (
              text &&
              Number.isInteger(parsed) &&
              parsed >= 1 &&
              parsed <= MAX_BAGS
            )
              onChange(parsed);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
        />
        <button
          type="button"
          aria-label={`Flere: ${label.toLowerCase()}`}
          disabled={value >= MAX_BAGS}
          onClick={() => {
            setDraft(null);
            onChange(value + 1);
          }}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
