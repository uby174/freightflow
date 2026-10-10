"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  stagger,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  motion,
} from "motion/react";
import { useT, useLocale } from "@/lib/i18n";
import { getTenant, tenantVars } from "@/tenant";

// ── Scene geometry (viewBox 900×500) ─────────────────────────────────────
const ROUTE_D = "M 140 160 C 300 230, 560 330, 770 385";
const CONSOLIDATE = { x: 430, y: 205 };
const SHIP_START = { x: 140, y: 160 };
const DOUALA = { x: 770, y: 385 };

// Deterministic scatter (no Math.random — SSR/hydration safety)
const CRATES: Array<{
  x: number;
  y: number;
  s: number;
  c: "carton" | "blue" | "red";
  jx: number;
  jy: number;
}> = [
  { x: 265, y: 105, s: 1.0, c: "carton", jx: -16, jy: -6 },
  { x: 360, y: 82, s: 0.8, c: "blue", jx: 8, jy: -14 },
  { x: 468, y: 96, s: 1.1, c: "red", jx: 0, jy: -2 },
  { x: 575, y: 88, s: 0.85, c: "carton", jx: 14, jy: -10 },
  { x: 645, y: 130, s: 1.0, c: "blue", jx: 18, jy: 2 },
  { x: 300, y: 175, s: 0.9, c: "red", jx: -10, jy: 6 },
  { x: 410, y: 150, s: 1.15, c: "carton", jx: -2, jy: -12 },
  { x: 520, y: 168, s: 0.95, c: "blue", jx: 10, jy: 8 },
  { x: 620, y: 205, s: 0.8, c: "carton", jx: 20, jy: 12 },
  { x: 330, y: 250, s: 1.0, c: "carton", jx: -14, jy: 12 },
  { x: 455, y: 268, s: 0.85, c: "red", jx: 4, jy: 16 },
  { x: 560, y: 255, s: 1.05, c: "carton", jx: 12, jy: 18 },
];

const CRATE_FACES = {
  carton: { top: "#e8a765", left: "#d18f4b", right: "#b97a3c" },
  blue: { top: "#63b3ed", left: "#4299d6", right: "#2f7fb8" },
  red: { top: "#f08a8a", left: "#e06666", right: "#c94f4f" },
} as const;

function IsoCrate({ faces, s }: { faces: keyof typeof CRATE_FACES; s: number }) {
  const f = CRATE_FACES[faces];
  const w = 17 * s; // half width
  const h = 10 * s; // half top height
  const d = 16 * s; // depth
  return (
    <g>
      <polygon points={`0,${-h} ${w},0 0,${h} ${-w},0`} fill={f.top} />
      <polygon points={`${-w},0 0,${h} 0,${h + d} ${-w},${d}`} fill={f.left} />
      <polygon points={`${w},0 0,${h} 0,${h + d} ${w},${d}`} fill={f.right} />
    </g>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function HeroScene() {
  const t = useT();
  const { locale } = useLocale();
  const C = getTenant().colors;
  const V = tenantVars(locale);
  const reduce = useReducedMotion();
  const [scope, animateScope] = useAnimate();
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue(0);
  const shipX = useMotionValue(SHIP_START.x);
  const shipY = useMotionValue(SHIP_START.y);
  const shipR = useMotionValue(0);

  // Ship follows the route path; heading derived from local tangent.
  useEffect(() => {
    if (reduce) return;
    const unsub = progress.on("change", (v) => {
      const path = pathRef.current;
      if (!path) return;
      const len = path.getTotalLength();
      const p = path.getPointAtLength(v * len);
      const p2 = path.getPointAtLength(Math.min(v + 0.012, 1) * len);
      const angle =
        Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI) * 0.5;
      shipX.set(p.x);
      shipY.set(p.y);
      shipR.set(Math.max(-12, Math.min(12, angle)));
    });
    return unsub;
  }, [reduce, progress, shipX, shipY, shipR]);

  // Static final frame for reduced motion: route drawn, ship mid-route.
  useEffect(() => {
    if (!reduce) return;
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const p = path.getPointAtLength(0.55 * len);
    shipX.set(p.x);
    shipY.set(p.y);
  }, [reduce, shipX, shipY]);

  useEffect(() => {
    if (reduce) return;
    let active = true;

    async function run() {
      try {
        // Route draws once; pins rise. (Stays drawn across loops.)
        await animateScope(
          "#route",
          { pathLength: 1 },
          { duration: 1.6, ease: "linear" }
        );
        if (!active) return;
        await animateScope(
          ".pin",
          { opacity: 1, y: 0 },
          { duration: 0.4, delay: stagger(0.15) }
        );

        while (active) {
          // ── Reset loop state instantly ──
          await Promise.all(
            CRATES.map((c, i) =>
              animateScope(
                `#crate-${i}`,
                { x: c.x, y: c.y, opacity: 0, scale: c.s },
                { duration: 0 }
              )
            )
          );
          await animateScope(
            "#container",
            { x: CONSOLIDATE.x, y: CONSOLIDATE.y, opacity: 0, scale: 0.4 },
            { duration: 0 }
          );
          await animateScope("#stamp", { opacity: 0 }, { duration: 0 });
          await Promise.all(
            ["#ship-group", "#shipbox", "#delivered", "#caption", "#wake"].map(
              (sel) => animateScope(sel, { opacity: 0 }, { duration: 0 })
            )
          );
          await animateScope("#delivered", { y: -26 }, { duration: 0 });
          progress.set(0);
          if (!active) return;

          // 1. Boxes appear, idling scattered
          await animateScope(
            ".crate",
            { opacity: 1 },
            { duration: 0.45, delay: stagger(0.05) }
          );
          await wait(350);
          if (!active) return;

          // 2. Consolidation — everything glides into one spot
          await Promise.all(
            CRATES.map((c, i) =>
              animateScope(
                `#crate-${i}`,
                {
                  x: CONSOLIDATE.x + c.jx,
                  y: CONSOLIDATE.y + c.jy,
                  scale: c.s * 0.8,
                },
                {
                  duration: 1.1,
                  delay: i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }
              )
            )
          );
          if (!active) return;

          // 3. Container materializes, boxes absorbed, SN stamp
          animateScope(".crate", { opacity: 0 }, { duration: 0.35, delay: 0.1 });
          await animateScope(
            "#container",
            { opacity: 1, scale: 1 },
            { type: "spring", stiffness: 120, damping: 20 }
          );
          await animateScope(
            "#stamp",
            { opacity: [0, 1], scale: [1.7, 1] },
            { duration: 0.35 }
          );
          await wait(250);
          if (!active) return;

          // 4. Container heads to the ship at Le Havre
          await animateScope(
            "#container",
            { x: SHIP_START.x, y: SHIP_START.y - 30, scale: 0.62 },
            { duration: 0.9, ease: [0.4, 0, 0.2, 1] }
          );
          animateScope("#container", { opacity: 0 }, { duration: 0.25 });
          animateScope("#shipbox", { opacity: 1 }, { duration: 0.25 });
          await animateScope("#ship-group", { opacity: 1 }, { duration: 0.3 });
          animateScope("#wake", { opacity: 0.6 }, { duration: 0.6 });
          if (!active) return;

          // 5. The crossing — Le Havre → Douala
          await animate(progress, 1, { duration: 6, ease: "easeInOut" });
          if (!active) return;

          // 6. Arrival in Douala — container settles with a bounce
          animateScope("#wake", { opacity: 0 }, { duration: 0.3 });
          animateScope("#ship-group", { opacity: 0 }, { duration: 0.45, delay: 0.15 });
          await animateScope(
            "#delivered",
            { opacity: 1, y: 0 },
            { type: "spring", stiffness: 260, damping: 18 }
          );
          animateScope(
            "#arrive-ring",
            { scale: [0.5, 2], opacity: [0.5, 0] },
            { duration: 1.1 }
          );
          await animateScope(
            "#caption",
            { opacity: 1, y: 0 },
            { duration: 0.5 }
          );
          await wait(1700);
          if (!active) return;

          // 7. Graceful crossfade back to the scattered state
          await Promise.all([
            animateScope("#delivered", { opacity: 0 }, { duration: 0.5 }),
            animateScope("#caption", { opacity: 0 }, { duration: 0.5 }),
          ]);
        }
      } catch {
        // Animations reject when cancelled on unmount — expected.
      }
    }

    run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <svg
      ref={scope}
      viewBox="0 0 900 500"
      className="w-full h-auto"
      role="img"
      aria-label={t("journey_aria")}
    >
      {/* Sea hints */}
      <g stroke="#bcd4ee" strokeWidth="3" strokeLinecap="round" opacity="0.7">
        <path d="M 200 300 q 12 -6 24 0 q 12 6 24 0" fill="none" />
        <path d="M 420 380 q 12 -6 24 0 q 12 6 24 0" fill="none" />
        <path d="M 610 300 q 12 -6 24 0 q 12 6 24 0" fill="none" />
        <path d="M 700 440 q 12 -6 24 0 q 12 6 24 0" fill="none" />
        <path d="M 120 420 q 12 -6 24 0 q 12 6 24 0" fill="none" />
      </g>

      {/* Route */}
      <motion.path
        id="route"
        ref={pathRef}
        d={ROUTE_D}
        fill="none"
        stroke={C.gold}
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        opacity="0.75"
      />

      {/* Le Havre pin */}
      <motion.g className="pin" initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : -8 }}>
        <circle cx={SHIP_START.x} cy={SHIP_START.y} r="7" fill={C.primary} />
        <circle cx={SHIP_START.x} cy={SHIP_START.y} r="3" fill={C.gold} />
        <g transform={`translate(${SHIP_START.x - 58}, ${SHIP_START.y - 46})`}>
          <rect width="8" height="12" fill="#1e3a8a" />
          <rect x="8" width="8" height="12" fill="#ffffff" stroke="#d7deea" strokeWidth="0.5" />
          <rect x="16" width="8" height="12" fill={C.accent} />
          <text x="30" y="10" fontSize="14" fontWeight="700" fill={C.primary}>
            {V.port}
          </text>
        </g>
      </motion.g>

      {/* Douala pin */}
      <motion.g className="pin" initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : -8 }}>
        <circle cx={DOUALA.x} cy={DOUALA.y} r="7" fill={C.primary} />
        <circle cx={DOUALA.x} cy={DOUALA.y} r="3" fill={C.gold} />
        <g transform={`translate(${DOUALA.x - 20}, ${DOUALA.y + 18})`}>
          <rect width="8" height="12" fill="#0f7a37" />
          <rect x="8" width="8" height="12" fill={C.accent} />
          <rect x="16" width="8" height="12" fill={C.gold} />
          <circle cx="12" cy="6" r="2" fill={C.gold} />
          <text x="30" y="10" fontSize="14" fontWeight="700" fill={C.primary}>
            {V.primaryCity}
          </text>
        </g>
        <circle
          id="arrive-ring"
          cx={DOUALA.x}
          cy={DOUALA.y}
          r="16"
          fill="none"
          stroke={C.gold}
          strokeWidth="3"
          opacity="0"
        />
      </motion.g>

      {/* Scattered crates */}
      {CRATES.map((c, i) => (
        <motion.g
          key={i}
          id={`crate-${i}`}
          className="crate"
          initial={{ x: c.x, y: c.y, scale: c.s, opacity: 0 }}
        >
          <IsoCrate faces={c.c} s={1} />
        </motion.g>
      ))}

      {/* Container (consolidation result) */}
      <motion.g
        id="container"
        initial={{
          x: CONSOLIDATE.x,
          y: CONSOLIDATE.y,
          opacity: reduce ? 0 : 0,
          scale: 0.4,
        }}
      >
        <polygon points="-46,-14 46,-14 56,-26 -36,-26" fill={C.secondary} />
        <polygon points="46,-14 56,-26 56,10 46,22" fill={C.primaryDark} />
        <rect x="-46" y="-14" width="92" height="36" rx="2" fill={C.primary} />
        {[-32, -18, -4, 10, 24].map((x) => (
          <line key={x} x1={x} y1="-12" x2={x} y2="20" stroke={C.secondary} strokeWidth="2" />
        ))}
        <g id="stamp" opacity="0">
          <rect x="-28" y="-6" width="56" height="16" rx="3" fill={C.gold} />
          <text x="0" y="6" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primary}>
            {V.short} GROUPAGE
          </text>
        </g>
      </motion.g>

      {/* Ship */}
      <motion.g
        id="ship-group"
        style={{ x: shipX, y: shipY, rotate: shipR }}
        initial={{ opacity: reduce ? 1 : 0 }}
      >
        <g id="wake" opacity={reduce ? 0.6 : 0}>
          <line x1="-72" y1="16" x2="-52" y2="16" stroke="#bcd4ee" strokeWidth="3" strokeLinecap="round" />
          <line x1="-64" y1="22" x2="-48" y2="22" stroke="#bcd4ee" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <path d="M -46 6 L 46 6 L 34 24 L -38 24 Z" fill={C.primary} />
        <rect x="-46" y="2" width="92" height="5" fill={C.accent} />
        <rect x="20" y="-16" width="16" height="18" rx="1.5" fill="#e9eef6" />
        <rect x="23" y="-12" width="4" height="4" fill={C.primary} />
        <rect x="29" y="-12" width="4" height="4" fill={C.primary} />
        <g id="shipbox" opacity={reduce ? 1 : 0}>
          <rect x="-34" y="-12" width="44" height="15" rx="1.5" fill={C.accent} />
          <text x="-12" y="-1" textAnchor="middle" fontSize="9" fontWeight="900" fill={C.gold}>
            {V.short}
          </text>
        </g>
      </motion.g>

      {/* Delivered container at Douala */}
      <motion.g
        id="delivered"
        initial={{ x: DOUALA.x - 60, y: DOUALA.y - 40 + (reduce ? 0 : -26), opacity: 0 }}
      >
        <rect x="-28" y="-11" width="56" height="24" rx="2" fill={C.primary} />
        {[-18, -6, 6, 18].map((x) => (
          <line key={x} x1={x} y1="-9" x2={x} y2="11" stroke={C.secondary} strokeWidth="1.5" />
        ))}
        <rect x="-18" y="-5" width="36" height="11" rx="2" fill={C.gold} />
        <text x="0" y="3.5" textAnchor="middle" fontSize="7.5" fontWeight="900" fill={C.primary}>
          {V.short} GROUPAGE
        </text>
      </motion.g>

      {/* Closing caption */}
      <motion.g id="caption" initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 }}>
        <text x="450" y="470" textAnchor="middle" fontSize="17" fontWeight="700" fill={C.primary}>
          {t("journey_caption")}
        </text>
      </motion.g>
    </svg>
  );
}
