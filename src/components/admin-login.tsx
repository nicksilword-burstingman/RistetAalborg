"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="admin-login">
      <LockKeyhole size={28} strokeWidth={1.3} aria-hidden="true" />
      <p className="eyebrow">RISTET AALBORG / ADMINISTRATION</p>
      <h1>
        Et lille kig
        <br />
        <em>bag kulissen.</em>
      </h1>
      {configured ? (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const password = new FormData(event.currentTarget).get("password");
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);
              router.refresh();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Kunne ikke logge ind. Prøv igen.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="admin-password">Din adgangskode</label>
          <input
            autoComplete="current-password"
            id="admin-password"
            name="password"
            type="password"
            required
            maxLength={256}
          />
          <button className="button dark" disabled={busy}>
            {busy ? "Logger ind …" : "Log ind"}
            <ArrowUpRight size={18} />
          </button>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
        </form>
      ) : (
        <p>
          Administratoradgangen er endnu ikke oprettet på denne installation.
          Den ansvarlige for hjemmesiden skal oprette din personlige kode, før
          du kan logge ind.
        </p>
      )}
      <small>
        Adgangen giver mulighed for at redigere historien på “Om os”.
      </small>
    </div>
  );
}
