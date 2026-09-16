"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageTransition, Stagger, StaggerItem } from "@/components/motion/PageTransition";

const roles = [
  {
    href: "/member/check-in",
    num: "01",
    title: "Member",
    blurb: "Face check-in · occupancy · history",
  },
  {
    href: "/day-pass/purchase",
    num: "02",
    title: "Day-Pass",
    blurb: "Buy access · enter with code",
  },
  {
    href: "/staff",
    num: "03",
    title: "Staff",
    blurb: "Enroll · logs · sales",
  },
  {
    href: "/admin",
    num: "04",
    title: "Admin",
    blurb: "Live load · forecasts · reports",
  },
];

export default function HomePage() {
  return (
    <PageTransition>
      <div className="relative flex min-h-[88dvh] flex-col justify-between gap-12 py-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute -right-6 top-8 hidden select-none lg:block"
        >
          <p className="display text-[11rem] leading-none text-white/[0.03]">
            TRACE
          </p>
        </motion.div>

        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="eyebrow text-lime"
          >
            Campus gym system
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="display mt-4 text-[clamp(4.5rem,18vw,11rem)] text-ink"
          >
            GYM
            <span className="text-lime">TRACE</span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            className="hairline mt-5 max-w-xl origin-left"
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 max-w-md text-base text-muted sm:text-lg"
          >
            Face auth at the door. Crowd intel on the floor.
          </motion.p>
        </div>

        <div>
          <p className="eyebrow mb-4">Select access</p>
          <Stagger className="grid gap-px overflow-hidden border border-panel-border bg-panel-border sm:grid-cols-2">
            {roles.map((role) => (
              <StaggerItem key={role.href}>
                <Link
                  href={role.href}
                  className="group relative flex min-h-[7.5rem] flex-col justify-between bg-panel p-5 transition duration-300 hover:bg-bg-elevated sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs text-steel transition group-hover:text-lime">
                      {role.num}
                    </span>
                    <span className="text-lime opacity-0 transition duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                      →
                    </span>
                  </div>
                  <div>
                    <h2 className="display text-3xl text-ink transition group-hover:text-lime sm:text-4xl">
                      {role.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{role.blurb}</p>
                  </div>
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] scale-y-0 bg-lime transition duration-300 group-hover:scale-y-100" />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </PageTransition>
  );
}
