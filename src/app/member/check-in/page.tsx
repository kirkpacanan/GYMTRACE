"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanRing } from "@/components/motion/ScanRing";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import {
  captureDescriptor,
  loadFaceModels,
  startCamera,
  stopCamera,
} from "@/lib/face-engine";

export default function MemberCheckInPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "granted" | "denied">(
    "idle",
  );
  const [mode, setMode] = useState<"check_in" | "check_out">("check_in");
  const [statusText, setStatusText] = useState("Starting camera…");

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;

    loadFaceModels()
      .then(() => {
        if (!cancelled) setModelsReady(true);
      })
      .catch(() => {
        if (!cancelled) setStatusText("Could not load face models");
      });

    if (!video) return;
    startCamera(video)
      .then((stream) => {
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        streamRef.current = stream;
        setCameraReady(true);
        setStatusText("Ready to scan");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const denied =
          err instanceof DOMException &&
          (err.name === "NotAllowedError" || err.name === "NotFoundError");
        setStatus("denied");
        setStatusText(
          denied
            ? "Camera blocked. Allow camera access and reload."
            : err instanceof Error
              ? err.message
              : "Camera failed",
        );
      });

    return () => {
      cancelled = true;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  async function startScan(action: "check_in" | "check_out") {
    const video = videoRef.current;
    if (scanning || !video || !cameraReady || !modelsReady) return;
    setMode(action);
    setScanning(true);
    setStatus("scanning");
    setStatusText(action === "check_out" ? "Checking out…" : "Looking for a face…");
    try {
      const descriptor = await captureDescriptor(video, {
        samples: 2,
        timeoutMs: 6000,
      });
      setStatusText("Matching membership…");
      const result = await api.scanFace(descriptor, action);
      sessionStorage.setItem("gymtrace_last_scan", JSON.stringify(result));
      if (result.member) {
        sessionStorage.setItem("gymtrace_member_id", String(result.member.id));
      }
      setStatus(result.granted ? "granted" : "denied");
      setStatusText(
        result.granted
          ? action === "check_out"
            ? `Goodbye, ${result.member?.name}`
            : `Welcome, ${result.member?.name}`
          : result.reason,
      );
      setTimeout(() => {
        router.push("/member/result");
      }, 700);
    } catch (e) {
      setStatus("denied");
      setStatusText(e instanceof Error ? e.message : "Scan failed — try again");
    } finally {
      setScanning(false);
    }
  }

  const ready = cameraReady && modelsReady;

  return (
    <PageTransition>
      <PageHeader
        title="Face Check-In / Out"
        subtitle="Scan to enter or leave. Occupancy follows who is still inside."
        backHref="/"
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <Panel className="p-5 sm:p-8">
          <ScanRing
            scanning={scanning || status === "scanning"}
            status={status}
            videoRef={videoRef}
          />
        </Panel>
        <div className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">Scanner status</p>
            <motion.p
              key={statusText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="display mt-2 text-3xl text-ink sm:text-4xl"
            >
              {statusText}
            </motion.p>
            <p className="mt-3 text-sm text-muted">
              {modelsReady ? "Face model loaded." : "Loading face model…"}{" "}
              Staff must capture a face before a member can check in.
            </p>
          </div>
          <div className="hairline" />
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => void startScan("check_in")}
              disabled={scanning || !ready}
            >
              {scanning && mode === "check_in" ? "Scanning…" : "Check in"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => void startScan("check_out")}
              disabled={scanning || !ready}
            >
              {scanning && mode === "check_out" ? "Scanning…" : "Check out"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/member/occupancy")}
            >
              View Occupancy
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => router.push("/member/history")}
            >
              My Attendance
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
