"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className = "", id, ...rest }: Props) {
  const inputId = id || rest.name;
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="eyebrow">{label}</span> : null}
      <input
        id={inputId}
        className={`w-full border border-panel-border bg-bg-elevated px-4 py-3.5 text-base text-ink outline-none transition placeholder:text-muted/50 focus:border-lime ${className}`}
        {...rest}
      />
    </label>
  );
}
