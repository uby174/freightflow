"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion/tokens";

/** Rolls euros up from the previous value — reads as "live calculation". */
export function PriceTicker({
  cents,
  className = "",
}: {
  cents: number;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const render = (v: number) => {
      if (ref.current) {
        ref.current.textContent = (v / 100).toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        });
      }
    };
    if (reduce) {
      mv.set(cents);
      render(cents);
      return;
    }
    const unsub = mv.on("change", render);
    const controls = animate(mv, cents, {
      duration: 0.9,
      ease: ease.entrance,
    });
    return () => {
      unsub();
      controls.stop();
    };
  }, [cents, mv, reduce]);

  return (
    <span ref={ref} className={className}>
      {(cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
    </span>
  );
}

/** Odometer-style reveal for the parcel number — one character at a time. */
export function CodeReveal({
  code,
  className = "",
}: {
  code: string;
  className?: string;
}) {
  return (
    <span className={className} aria-label={code}>
      {code.split("").map((ch, i) => (
        <CodeChar key={`${i}-${ch}`} ch={ch} index={i} />
      ))}
    </span>
  );
}

function CodeChar({ ch, index }: { ch: string; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || !ref.current) return;
    const controls = animate(
      ref.current,
      { opacity: [0, 1], y: [-10, 0] },
      {
        delay: 0.25 + index * 0.045,
        type: "spring",
        stiffness: 400,
        damping: 32,
      }
    );
    return () => controls.stop();
  }, [index, reduce]);
  return (
    <span
      ref={ref}
      aria-hidden
      className="inline-block"
      style={{ opacity: reduce ? 1 : 0 }}
    >
      {ch}
    </span>
  );
}
