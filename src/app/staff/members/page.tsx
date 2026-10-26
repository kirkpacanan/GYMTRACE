"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PinGate } from "@/components/screens/PinGate";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import {
  captureDescriptor,
  loadFaceModels,
  startCamera,
  stopCamera,
} from "@/lib/face-engine";
import { formatMembershipEnd, type Member, type MemberStatus } from "@/lib/db";

export default function StaffMembersPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [monthsPaid, setMonthsPaid] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<Member | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.members();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function enroll(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const months = Math.max(1, Math.floor(Number(monthsPaid) || 1));
      const created = await api.createMember({
        name,
        contact,
        status: "active",
        monthsPaid: months,
      });
      setName("");
      setContact("");
      setMonthsPaid("1");
      await load();
      setEnrolling(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enroll failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeMember() {
    if (!deleting) return;
    setError(null);
    try {
      await api.deleteMember(deleting.id);
      if (editing?.id === deleting.id) setEditing(null);
      if (enrolling?.id === deleting.id) setEnrolling(null);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <PinGate role="staff">
      <h1 className="display text-4xl text-ink">Members</h1>
      <p className="mt-2 text-muted">
        Enroll opens the camera. Save the face before that member can check in.
      </p>

      <Panel className="mt-6 p-5 sm:p-6">
        <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-muted">
          Enroll member
        </h2>
        <form
          onSubmit={enroll}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]"
        >
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
          <Input
            label="Months"
            type="number"
            min={1}
            value={monthsPaid}
            onChange={(e) => setMonthsPaid(e.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              Enroll
            </Button>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>

      {enrolling ? (
        <FaceCaptureDialog
          member={enrolling}
          onClose={() => setEnrolling(null)}
          onSaved={() => {
            setEnrolling(null);
            void load();
          }}
        />
      ) : null}

      {editing ? (
        <EditMemberDialog
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Panel className="w-full max-w-md p-5 sm:p-6">
            <p className="eyebrow text-danger">Delete member</p>
            <h2 className="display mt-2 text-3xl text-ink">{deleting.name}</h2>
            <p className="mt-3 text-sm text-muted">
              This removes their profile, saved face, and attendance records.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="danger" onClick={() => void removeMember()}>
                Delete
              </Button>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
            </div>
          </Panel>
        </div>
      ) : null}

      <Panel className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-panel-border text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Face</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-panel-border/60">
                <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                <td className="px-4 py-3 text-muted">{m.contact}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      m.status === "active"
                        ? "bg-success/15 text-success"
                        : m.status === "expired"
                          ? "bg-danger/15 text-danger"
                          : "bg-white/10 text-muted"
                    }`}
                  >
                    {m.status}
                  </span>
                  <p className="mt-1 text-xs text-muted">{formatMembershipEnd(m)}</p>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setEnrolling(m)}
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                      m.faceEnrolled
                        ? "bg-success/15 text-success"
                        : "bg-lime text-bg font-semibold"
                    }`}
                  >
                    {m.faceEnrolled ? "Recapture face" : "Capture face"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(m)}
                      className="rounded-lg border border-panel-border px-2 py-1 text-[11px] uppercase tracking-wide text-muted hover:border-lime/40 hover:text-lime"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(m)}
                      className="rounded-lg border border-danger/40 px-2 py-1 text-[11px] uppercase tracking-wide text-danger hover:bg-danger/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="p-6 text-center text-muted">No members yet.</p>
        ) : null}
      </Panel>
    </PinGate>
  );
}

function EditMemberDialog({
  member,
  onClose,
  onSaved,
}: {
  member: Member;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(member.name);
  const [contact, setContact] = useState(member.contact);
  const [status, setStatus] = useState<MemberStatus>(member.status);
  const [monthsToAdd, setMonthsToAdd] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateMember(member.id, {
        name,
        contact,
        status,
        monthsToAdd: Math.max(0, Math.floor(Number(monthsToAdd) || 0)),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Panel className="w-full max-w-md p-5 sm:p-6">
        <p className="eyebrow text-lime">Edit details</p>
        <h2 className="display mt-2 text-3xl text-ink">{member.name}</h2>
        <p className="mt-2 text-sm text-muted">{formatMembershipEnd(member)}</p>
        <form onSubmit={save} className="mt-5 flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
          <Input
            label="Add months"
            type="number"
            min={0}
            value={monthsToAdd}
            onChange={(e) => setMonthsToAdd(e.target.value)}
          />
          <p className="text-xs normal-case tracking-normal text-muted">
            Extra months extend an active membership. If it already ended, the
            new months start today. One month is ₱1,500.
          </p>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-muted">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
              className="border border-panel-border bg-bg px-3 py-3 text-sm normal-case tracking-normal text-ink"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="frozen">Frozen</option>
            </select>
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save details"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function FaceCaptureDialog({
  member,
  onClose,
  onSaved,
}: {
  member: Member;
  onClose: () => void;
  onSaved: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const [status, setStatus] = useState("Opening camera…");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [faceSeen, setFaceSeen] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let timer = 0;

    void (async () => {
      try {
        const faceapi = await loadFaceModels();
        const stream = await startCamera(video);
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        streamRef.current = stream;
        setReady(true);
        setStatus("Center your face in the frame, then save.");

        const tick = async () => {
          if (cancelled) return;
          if (!busyRef.current && video.readyState >= 2 && video.videoWidth > 0) {
            try {
              const hit = await faceapi.detectSingleFace(
                video,
                new faceapi.TinyFaceDetectorOptions({
                  inputSize: 416,
                  scoreThreshold: 0.25,
                }),
              );
              if (!cancelled) setFaceSeen(Boolean(hit));
            } catch {
              // Preview misses are fine; save will report a real failure.
            }
          }
          if (!cancelled) timer = window.setTimeout(() => void tick(), 450);
        };
        timer = window.setTimeout(() => void tick(), 400);
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setError(
          name === "NotAllowedError"
            ? "Camera permission was blocked. Allow the camera for this site, then try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : name === "NotReadableError"
                ? "The camera is already in use. Close other tabs using it, then try again."
                : err instanceof Error
                  ? err.message
                  : "Camera failed",
        );
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  async function save() {
    const video = videoRef.current;
    if (!video || capturing) return;
    busyRef.current = true;
    setCapturing(true);
    setError(null);
    setStatus("Hold still…");
    try {
      const descriptor = await captureDescriptor(video, {
        samples: 2,
        timeoutMs: 8000,
      });
      await api.enrollFace(member.id, descriptor);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the face");
      setStatus("Keep your face in the frame and try again.");
    } finally {
      busyRef.current = false;
      setCapturing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Panel className="w-full max-w-lg p-5 sm:p-6">
        <p className="eyebrow text-lime">Capture face</p>
        <h2 className="display mt-2 text-3xl text-ink">{member.name}</h2>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="mt-4 aspect-video w-full bg-black object-cover [transform:scaleX(-1)]"
        />
        <p className={`mt-3 text-sm ${error ? "text-danger" : faceSeen ? "text-success" : "text-muted"}`}>
          {error ?? (faceSeen ? "Face in frame. You can save." : status)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void save()} disabled={!ready || capturing}>
            {capturing ? "Saving…" : "Save face"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={capturing}>
            Cancel
          </Button>
        </div>
      </Panel>
    </div>
  );
}
