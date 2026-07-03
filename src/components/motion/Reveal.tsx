"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ease } from "@/lib/motion/tokens";

/** Premium scroll reveal: subtle rise + fade, once, opacity-only under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduce ? 0.2 : 0.5,
        ease: ease.entrance,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Parent/children stagger for card grids and chip rows. */
export function StaggerGroup({
  children,
  className = "",
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 14, scale: reduce ? 1 : 0.97 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.45, ease: ease.entrance },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
