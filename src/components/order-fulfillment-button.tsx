"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function OrderFulfillmentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="button dark"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/admin/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, action: "ship" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Kunne ikke opdatere.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Gemmer …" : "Markér som afsendt"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
