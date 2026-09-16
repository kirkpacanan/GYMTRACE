"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { PageTransition } from "@/components/motion/PageTransition";
import { api } from "@/lib/api-client";

const staffLinks = [
  { href: "/staff", label: "Console" },
  { href: "/staff/members", label: "Members" },
  { href: "/staff/attendance", label: "Attendance" },
  { href: "/staff/day-passes", label: "Day Passes" },
];

const adminLinks = [
  { href: "/admin", label: "Home" },
  { href: "/admin/occupancy", label: "Occupancy" },
  { href: "/admin/revenue", label: "Revenue" },
];

export function PinGate({
  role,
  children,
}: {
  role: "staff" | "admin";
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const links = role === "staff" ? staffLinks : adminLinks;
  const storageKey = `gymtrace_${role}_ok`;

  useEffect(() => {
    setAuthed(sessionStorage.getItem(storageKey) === "1");
    setReady(true);
  }, [storageKey]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.verifyPin(role, pin);
      sessionStorage.setItem(storageKey, "1");
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid PIN");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  if (!authed) {
    return (
      <PageTransition>
        <BrandMark size="lg" />
        <Panel className="mx-auto mt-12 max-w-md p-7 sm:p-9">
          <p className="eyebrow text-lime">Restricted</p>
          <h1 className="display mt-3 text-4xl text-ink">
            {role === "staff" ? "Staff" : "Admin"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Demo PIN · {role === "staff" ? "1234" : "9999"}
          </p>
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <Input
              label="PIN"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="display tracking-[0.35em]"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" size="lg" disabled={loading}>
              Unlock Console
            </Button>
            <Link
              href="/"
              className="text-center text-sm text-muted transition hover:text-lime"
            >
              ← Role select
            </Link>
          </form>
        </Panel>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mb-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 border border-panel-border bg-panel p-5 lg:w-60">
          <BrandMark />
          <div className="hairline my-5" />
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2.5 text-sm uppercase tracking-wider transition ${
                    active
                      ? "bg-lime text-bg font-semibold"
                      : "text-muted hover:bg-white/[0.04] hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/"
              className="mt-2 px-3 py-2.5 text-sm text-muted transition hover:text-lime"
            >
              ← Exit
            </Link>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PageTransition>
  );
}
