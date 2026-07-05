"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A customs/passport-style ink seal that "presses" onto a landed milestone.
 * The stamp metaphor carries real weight for a diaspora audience for whom
 * customs and documents mean something — each real update lands like a stamp.
 */
export function PassportStamp({
  label,
  ink = "#16234d",
  rotate = -13,
  delay = 0,
}: {
  label: string;
  ink?: string;
  rotate?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -top-4 -right-1.5 w-14 sm:w-16"
      style={{ mixBlendMode: "multiply", color: ink }}
      initial={
        reduce
          ? { opacity: 0.85, scale: 1, rotate }
          : { opacity: 0, scale: 1.7, rotate: rotate - 10 }
      }
      animate={{ opacity: 0.85, scale: 1, rotate }}
      transition={
        reduce
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 520, damping: 15, delay: delay + 0.35 }
      }
    >
      <svg viewBox="0 0 100 100" className="w-full h-auto">
        <defs>
          <path id={`arc-top-${label}`} d="M 15 54 A 35 35 0 0 1 85 54" fill="none" />
          <path id={`arc-bot-${label}`} d="M 21 50 A 29 29 0 0 0 79 50" fill="none" />
        </defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle
          cx="50"
          cy="50"
          r="39"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />
        <text
          fontSize="10"
          fontWeight="800"
          letterSpacing="1.2"
          fill="currentColor"
          textAnchor="middle"
        >
          <textPath href={`#arc-top-${label}`} startOffset="50%">
            SN GROUPAGE
          </textPath>
        </text>
        <text
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="1.4"
          fill="currentColor"
          textAnchor="middle"
        >
          <textPath href={`#arc-bot-${label}`} startOffset="50%">
            {label}
          </textPath>
        </text>
        {/* center check + rule lines */}
        <line x1="30" y1="42" x2="70" y2="42" stroke="currentColor" strokeWidth="1.2" />
        <line x1="30" y1="60" x2="70" y2="60" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M 41 51 l 5 5 l 11 -12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
}
