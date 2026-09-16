"use client";

import Link from "next/link";
import { PinGate } from "@/components/screens/PinGate";
import { Stagger, StaggerItem } from "@/components/motion/PageTransition";

const sections = [
  {
    href: "/admin/occupancy",
    num: "01",
    title: "Occupancy & ML",
    blurb: "Live load, 12h forecast, actual vs predicted, model metrics",
  },
  {
    href: "/admin/revenue",
    num: "02",
    title: "Revenue",
    blurb: "Total members, membership fees, day-pass sales this month",
  },
];

export default function AdminHomePage() {
  return (
    <PinGate role="admin">
      <h1 className="display text-4xl text-ink sm:text-5xl">Admin</h1>
      <p className="mt-2 max-w-lg text-muted">
        Pick a workspace — occupancy predictions stay separate from money so
        each view stays clear.
      </p>
      <div className="hairline my-6 max-w-xs" />
      <Stagger className="grid gap-px overflow-hidden border border-panel-border bg-panel-border sm:grid-cols-2">
        {sections.map((s) => (
          <StaggerItem key={s.href}>
            <Link
              href={s.href}
              className="group flex min-h-[11rem] flex-col justify-between bg-panel p-6 transition hover:bg-bg-elevated"
            >
              <span className="font-mono text-xs text-steel transition group-hover:text-lime">
                {s.num}
              </span>
              <div>
                <h2 className="display text-3xl text-ink transition group-hover:text-lime">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm text-muted">{s.blurb}</p>
                <span className="mt-4 inline-block text-sm text-lime opacity-0 transition group-hover:opacity-100">
                  Open →
                </span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </PinGate>
  );
}
