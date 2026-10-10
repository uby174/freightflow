"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Loader2 } from "lucide-react";
import { PARCEL_PREFIX } from "@/lib/config";

export function WeighInForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/weigh-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, actualWeightKg: Number(weight) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(`Erreur : ${data.error}`);
      } else {
        setResult(
          data.reconciled
            ? `Écart ${(data.deltaCents / 100).toFixed(2)} € → nouveau total ${(data.newTotalCents / 100).toFixed(2)} € (devis v2 créé, client à prévenir)`
            : `Écart ${(data.deltaCents / 100).toFixed(2)} € — dans la tolérance, pas de re-devis.`
        );
        router.refresh();
      }
    } catch {
      setResult("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white border border-border p-5 flex flex-wrap items-end gap-3"
    >
      <div className="flex items-center gap-2 font-bold text-sm w-full">
        <Scale className="w-4 h-4 text-primary" aria-hidden />
        Pesée à la réception
      </div>
      <label className="text-xs text-muted flex-1 min-w-40">
        Numéro de colis
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`${PARCEL_PREFIX}-2026-123456`}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-mono uppercase focus:border-primary transition-colors"
        />
      </label>
      <label className="text-xs text-muted w-32">
        Poids réel (kg)
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          type="number"
          step="0.1"
          min="0.1"
          className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:border-primary transition-colors"
        />
      </label>
      <button
        type="submit"
        disabled={busy || !code || !weight}
        className="rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-5 py-2.5 text-sm flex items-center gap-2 transition-colors"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
        Enregistrer
      </button>
      {result && <p className="w-full text-sm text-foreground">{result}</p>}
    </form>
  );
}
