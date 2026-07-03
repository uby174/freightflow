"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function TrackLookup() {
  const t = useT();
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Search className="w-10 h-10 text-primary mx-auto" aria-hidden />
      <h1 className="mt-4 text-3xl font-black text-primary-dark">
        {t("track_title")}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) router.push(`/track/${code.trim().toUpperCase()}`);
        }}
        className="mt-8 flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("track_placeholder")}
          className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm font-mono uppercase tracking-wider focus:border-primary transition-colors"
          aria-label={t("track_title")}
        />
        <button
          type="submit"
          className="rounded-xl bg-primary hover:bg-primary-dark text-white font-bold px-6 transition-colors"
        >
          {t("track_button")}
        </button>
      </form>
    </div>
  );
}
