"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MotionConfig, animate, motion, useInView } from "motion/react";
import { useRef } from "react";

// Global motion setup: respects OS reduced-motion, single place to tune feel.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Fade-and-rise on scroll into view. Wrap cards and sections with this.
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Animated counter for points and KPIs.
export function AnimatedNumber({
  value,
  format = (n: number) => Math.round(n).toString(),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const [display, setDisplay] = useState(format(0));
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [inView, value, format]);
  return <span ref={ref}>{display}</span>;
}

export { motion };
