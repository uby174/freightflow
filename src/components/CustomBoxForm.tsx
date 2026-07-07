"use client";

import { useState } from "react";
import { Ruler, Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

export interface CustomBox {
  quantity: number;
  custom: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
  };
}

/** Customer-measured box → exact, deterministic quote (no AI needed). */
export function CustomBoxForm({ onAdd }: { onAdd: (box: CustomBox) => void }) {
  const t = useT();
  const [l, setL] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [kg, setKg] = useState("");
  const [qty, setQty] = useState("1");

  const valid =
    Number(l) > 0 && Number(w) > 0 && Number(h) > 0 && Number(kg) > 0;

  function add() {
    if (!valid) return;
    onAdd({
      quantity: Math.max(1, Math.floor(Number(qty) || 1)),
      custom: {
        lengthCm: Number(l),
        widthCm: Number(w),
        heightCm: Number(h),
        weightKg: Number(kg),
      },
    });
    setL(""); setW(""); setH(""); setKg(""); setQty("1");
  }

  const field =
    "w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary transition-colors";

  return (
    <div className="rounded-xl bg-white border border-border p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Ruler className="w-4 h-4 text-accent" aria-hidden />
        {t("dim_title")}
      </p>
      <p className="mt-1 text-xs text-muted">{t("dim_hint")}</p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="text-xs text-muted">
          {t("dim_length")}
          <input value={l} onChange={(e) => setL(e.target.value)} type="number" inputMode="numeric" min="1" className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs text-muted">
          {t("dim_width")}
          <input value={w} onChange={(e) => setW(e.target.value)} type="number" inputMode="numeric" min="1" className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs text-muted">
          {t("dim_height")}
          <input value={h} onChange={(e) => setH(e.target.value)} type="number" inputMode="numeric" min="1" className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs text-muted">
          {t("dim_weight")}
          <input value={kg} onChange={(e) => setKg(e.target.value)} type="number" inputMode="decimal" min="0.1" step="0.1" className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs text-muted">
          {t("dim_qty")}
          <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" inputMode="numeric" min="1" className={`mt-1 ${field}`} />
        </label>
        <button
          onClick={add}
          disabled={!valid}
          className="self-end rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-bold text-sm py-2 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden />
          {t("dim_add")}
        </button>
      </div>
    </div>
  );
}
