"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "md" | "lg" | "sm";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

const variants = {
  primary:
    "bg-lime text-bg hover:bg-lime-dim font-semibold tracking-wide uppercase",
  ghost: "bg-transparent text-ink hover:bg-white/[0.04] uppercase tracking-wide",
  danger:
    "bg-danger/10 text-danger border border-danger/50 hover:bg-danger/20 uppercase tracking-wide",
  outline:
    "bg-transparent text-ink border border-panel-border hover:border-lime hover:text-lime uppercase tracking-wide",
};

const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-sm",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  onClick,
}: Props) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { y: 1 }}
      className={`inline-flex items-center justify-center gap-2 clip-corner transition-colors disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
