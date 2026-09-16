"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative border border-panel-border bg-panel/95 ${className}`}
    >
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-lime/70" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-lime/70" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-lime/70" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-lime/70" />
      {children}
    </motion.div>
  );
}
