"use client";

import { motion } from "framer-motion";

export function ScanRing({
  scanning,
  status,
}: {
  scanning: boolean;
  status: "idle" | "scanning" | "granted" | "denied";
}) {
  const accent =
    status === "granted"
      ? "border-success text-success"
      : status === "denied"
        ? "border-danger text-danger"
        : "border-lime text-lime";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* HUD frame */}
      <div className={`absolute inset-0 border ${accent.split(" ")[0]} opacity-30`} />
      <div className="absolute inset-4 border border-dashed border-white/10" />

      {/* Corner brackets */}
      {(
        [
          "left-2 top-2 border-l-2 border-t-2",
          "right-2 top-2 border-r-2 border-t-2",
          "bottom-2 left-2 border-b-2 border-l-2",
          "bottom-2 right-2 border-b-2 border-r-2",
        ] as const
      ).map((pos) => (
        <div
          key={pos}
          className={`absolute h-8 w-8 ${pos} ${accent.split(" ")[0]}`}
        />
      ))}

      <div className="absolute inset-8 overflow-hidden bg-gradient-to-b from-[#151922] to-[#0a0c10]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,255,58,0.12),transparent_60%)]" />

        {/* Face guide */}
        <div className="absolute inset-[18%] rounded-[40%] border border-white/15" />

        {scanning ? (
          <>
            <motion.div
              className="absolute inset-x-0 h-[2px] bg-lime"
              animate={{ top: ["8%", "92%", "8%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-lime/10 via-transparent to-transparent"
              animate={{ opacity: [0.2, 0.55, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </>
        ) : null}

        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            CAM-01
          </span>
          <motion.span
            animate={scanning ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 0.8, repeat: scanning ? Infinity : 0 }}
            className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
              scanning ? "text-lime" : "text-muted"
            }`}
          >
            {scanning ? "LIVE" : "STANDBY"}
          </motion.span>
        </div>
      </div>

      {(status === "granted" || status === "denied") && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/45"
        >
          <p className={`display text-4xl sm:text-5xl ${accent.split(" ")[1]}`}>
            {status === "granted" ? "MATCHED" : "DENIED"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
