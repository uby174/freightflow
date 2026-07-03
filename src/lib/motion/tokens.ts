// SN Groupage motion system — reliable, warm, never toy-like.
// Springs only for badge/checkmark pops; reveals use entrance bezier.

export const duration = {
  instant: 0.12,
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
} as const;

export const spring = {
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
  bouncy: { type: "spring", stiffness: 260, damping: 18, mass: 0.9 },
  stiff: { type: "spring", stiffness: 400, damping: 32, mass: 0.8 },
} as const;

type Bezier = [number, number, number, number];

export const ease: Record<"standard" | "entrance" | "exit" | "linear", Bezier> = {
  standard: [0.4, 0, 0.2, 1],
  entrance: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
  linear: [0, 0, 1, 1],
};
