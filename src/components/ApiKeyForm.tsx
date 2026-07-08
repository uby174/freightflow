"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  Check,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Trash2,
} from "lucide-react";

interface Status {
  configured: boolean;
  source: "env" | "file" | null;
  masked: string | null;
  editable: boolean;
  tokenRequired?: boolean;
}

// Secure client for the AI key. The key is sent to the server once and never
// stored in the browser; only a masked hint ever comes back.
export function ApiKeyForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [value, setValue] = useState("");
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function loadStatus() {
    try {
      const res = await fetch("/api/admin/settings");
      setStatus(await res.json());
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    loadStatus();
  }, []);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  function withToken() {
    return token ? { ...headers, "x-admin-token": token } : headers;
  }

  async function save() {
    if (!value.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: withToken(),
        body: JSON.stringify({ apiKey: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({
          ok: false,
          text:
            data.error === "invalid_key_format"
              ? "Format de clé invalide (elle doit commencer par sk-ant-…)."
              : data.error === "unauthorized"
                ? "Jeton administrateur requis ou incorrect."
                : "Échec de l'enregistrement.",
        });
      } else {
        setStatus(data);
        setValue("");
        setMsg({ ok: true, text: "Clé enregistrée en toute sécurité." });
      }
    } catch {
      setMsg({ ok: false, text: "Erreur réseau." });
    } finally {
      setBusy(false);
    }
  }

  async function clearKey() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: withToken(),
        body: JSON.stringify({ clear: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setMsg({ ok: true, text: "Clé supprimée." });
      }
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/test-ai", {
        method: "POST",
        headers: withToken(),
      });
      const data = await res.json();
      setMsg(
        data.ok
          ? { ok: true, text: `Connexion réussie (${data.model}).` }
          : {
              ok: false,
              text:
                data.error === "invalid_key"
                  ? "Clé refusée par Anthropic."
                  : data.error === "no_key"
                    ? "Aucune clé configurée."
                    : "Échec du test.",
            }
      );
    } finally {
      setTesting(false);
    }
  }

  const envManaged = status?.source === "env";

  return (
    <div className="rounded-2xl bg-white border border-border p-5">
      <p className="flex items-center gap-2 font-bold text-primary">
        <KeyRound className="w-4 h-4 text-accent" aria-hidden />
        Clé API Anthropic (assistant IA)
      </p>
      <p className="mt-1 text-xs text-muted">
        Active l&apos;assistant intelligent (devis conversationnels, réponses aux
        questions). Stockée côté serveur uniquement, jamais exposée au navigateur.
      </p>

      {/* Current status */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        {status?.configured ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-success px-3 py-1 font-semibold">
            <ShieldCheck className="w-4 h-4" aria-hidden />
            Configurée · <code className="font-mono">{status.masked}</code>
            <span className="text-muted font-normal">
              ({status.source === "env" ? "variable d'env" : "fichier sécurisé"})
            </span>
          </span>
        ) : (
          <span className="rounded-full bg-muted-bg text-muted px-3 py-1 font-semibold">
            Non configurée
          </span>
        )}
      </div>

      {envManaged ? (
        <p className="mt-3 text-xs text-muted">
          La clé est gérée via la variable d&apos;environnement{" "}
          <code>ANTHROPIC_API_KEY</code> et ne peut pas être modifiée ici.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="sk-ant-…"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-border px-3 py-2.5 pr-10 text-sm font-mono focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                aria-label={show ? "Masquer" : "Afficher"}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={save}
              disabled={busy || !value.trim()}
              className="rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-bold px-5 text-sm flex items-center gap-1.5 transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>

          {status?.tokenRequired && (
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Jeton administrateur (SN_ADMIN_TOKEN)"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary transition-colors"
            />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={test}
              disabled={testing || !status?.configured}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-primary disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
            >
              {testing && <Loader2 className="w-4 h-4 animate-spin" />}
              Tester la connexion
            </button>
            {status?.configured && (
              <button
                onClick={clearKey}
                disabled={busy}
                className="text-sm text-muted hover:text-destructive inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}

      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>
          {msg.text}
        </p>
      )}

      <p className="mt-4 text-[11px] text-muted border-t border-border pt-3">
        Obtenez une clé sur console.anthropic.com. Sans clé, l&apos;assistant
        fonctionne en mode local (réponses préprogrammées) — les prix restent
        toujours exacts et déterministes.
      </p>
    </div>
  );
}
