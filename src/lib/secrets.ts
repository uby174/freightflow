// SERVER-ONLY secret store. Never import this from a client component.
// The Anthropic key lives here — read at request time so a newly-saved key
// works without a restart — sourced from either the environment (preferred for
// production) or a gitignored local file (the admin "paste a key" field).
//
// The key is NEVER sent to the browser: status endpoints return a masked hint
// only, and it is never logged.

import fs from "node:fs";
import path from "node:path";

const SECRETS_PATH = path.join(process.cwd(), ".secrets.json");

interface SecretsFile {
  anthropicApiKey?: string;
}

function readFile(): SecretsFile {
  try {
    return JSON.parse(fs.readFileSync(SECRETS_PATH, "utf8")) as SecretsFile;
  } catch {
    return {};
  }
}

function writeFile(data: SecretsFile) {
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(SECRETS_PATH, 0o600); // best-effort owner-only (POSIX)
  } catch {
    /* Windows ACLs — ignore */
  }
}

export type KeySource = "env" | "file" | null;

/** The effective key: environment wins, then the local file. */
export function getAnthropicKey(): string | undefined {
  const env = process.env.ANTHROPIC_API_KEY?.trim();
  if (env) return env;
  const file = readFile().anthropicApiKey?.trim();
  return file || undefined;
}

export function keySource(): KeySource {
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "env";
  if (readFile().anthropicApiKey?.trim()) return "file";
  return null;
}

// Kill-switch: SN_DISABLE_AI=1 forces the deterministic path everywhere
// (used by the test suite, and handy as an operational off-switch).
export const aiDisabled = (): boolean => process.env.SN_DISABLE_AI === "1";

export const hasAI = (): boolean => !aiDisabled() && Boolean(getAnthropicKey());

/** Anthropic keys look like `sk-ant-...`. Reject anything else. */
export function isValidKeyFormat(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/** Masked hint for display — e.g. `sk-ant-…a1b2`. Never the full key. */
export function maskKey(key: string): string {
  const k = key.trim();
  if (k.length < 12) return "••••";
  return `${k.slice(0, 7)}…${k.slice(-4)}`;
}

export interface KeyStatus {
  configured: boolean;
  source: KeySource;
  masked: string | null;
  editable: boolean; // false when managed by an env var
}

export function getKeyStatus(): KeyStatus {
  const src = keySource();
  const key = getAnthropicKey();
  return {
    configured: Boolean(key),
    source: src,
    masked: key ? maskKey(key) : null,
    editable: src !== "env", // env-managed keys can't be overwritten from the UI
  };
}

/** Save to the local file. Returns masked status. Throws on bad format. */
export function setAnthropicKey(key: string): KeyStatus {
  const trimmed = key.trim();
  if (!isValidKeyFormat(trimmed)) {
    throw new Error("invalid_key_format");
  }
  const data = readFile();
  data.anthropicApiKey = trimmed;
  writeFile(data);
  return getKeyStatus();
}

export function clearAnthropicKey(): KeyStatus {
  const data = readFile();
  delete data.anthropicApiKey;
  writeFile(data);
  return getKeyStatus();
}

/** Optional admin gate for the settings endpoints (set SN_ADMIN_TOKEN to enable). */
export function adminTokenRequired(): boolean {
  return Boolean(process.env.SN_ADMIN_TOKEN?.trim());
}
export function checkAdminToken(provided: string | null): boolean {
  const expected = process.env.SN_ADMIN_TOKEN?.trim();
  if (!expected) return true; // no token configured → allowed (local dev)
  return provided?.trim() === expected;
}
