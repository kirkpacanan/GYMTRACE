"use client";

import Link from "next/link";
import { PinGate } from "@/components/screens/PinGate";
import { Stagger, StaggerItem } from "@/components/motion/PageTransition";

const cards = [
  {
    href: "/staff/members",
    num: "01",
    title: "Members",
    blurb: "Enroll / update status",
  },
  {
    href: "/staff/attendance",
    num: "02",
    title: "Attendance",
    blurb: "Review entry logs",
  },
  {
    href: "/staff/day-passes",
    num: "03",
    title: "Day Passes",
    blurb: "Sales & usage",
  },
];

export default function StaffHomePage() {
  return (
    <PinGate role="staff">
      <h1 className="display text-4xl text-ink sm:text-5xl">Staff Console</h1>
      <p className="mt-2 text-muted">Enrollment, logs, and guest pass ops.</p>
      <div className="hairline my-6 max-w-xs" />
      <Stagger className="grid gap-px overflow-hidden border border-panel-border bg-panel-border sm:grid-cols-3">
        {cards.map((c) => (
          <StaggerItem key={c.href}>
            <Link
              href={c.href}
              className="group flex min-h-[9rem] flex-col justify-between bg-panel p-5 transition hover:bg-bg-elevated"
            >
              <span className="font-mono text-xs text-steel group-hover:text-lime">
                {c.num}
              </span>
              <div>
                <h2 className="display text-2xl text-ink group-hover:text-lime">
                  {c.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{c.blurb}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </PinGate>
  );
}
