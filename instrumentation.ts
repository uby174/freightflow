// Next.js instrumentation hook — starts the mock-carrier timeline player.
// With a real partner this becomes webhook ingestion + a polling fallback.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const g = globalThis as typeof globalThis & { __camfretTicker?: boolean };
  if (g.__camfretTicker) return;
  g.__camfretTicker = true;

  const { tickMockCarrier } = await import("./src/lib/tracking");
  setInterval(() => {
    tickMockCarrier().catch((e) =>
      console.error("[camfret ticker] tick failed:", e)
    );
  }, 15_000);
  console.log("[camfret] mock carrier timeline player started");
}
