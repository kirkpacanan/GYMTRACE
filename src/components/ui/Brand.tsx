"use client";

import Link from "next/link";

export function BrandMark({
  href = "/",
  size = "md",
}: {
  href?: string;
  size?: "md" | "lg";
}) {
  const cls =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : "text-2xl sm:text-3xl";
  return (
    <Link href={href} className="group inline-flex items-end gap-0">
      <span className={`display tracking-wide text-ink ${cls}`}>GYM</span>
      <span className={`display tracking-wide text-lime ${cls}`}>TRACE</span>
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <header className="mb-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <BrandMark />
        {backHref ? (
          <Link
            href={backHref}
            className="eyebrow transition hover:text-lime"
          >
            ← Back
          </Link>
        ) : null}
      </div>
      <div className="hairline mb-5 max-w-sm" />
      <h1 className="display text-4xl text-ink sm:text-5xl">{title}</h1>
      {subtitle ? (
        <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">{subtitle}</p>
      ) : null}
    </header>
  );
}
