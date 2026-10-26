import { dbError, mapMember, supabase, type Member } from "./db";

export const FACE_DESCRIPTOR_LENGTH = 128;
/** Euclidean distance cutoff used by FaceAPI-style embeddings. */
export const FACE_MATCH_THRESHOLD = 0.55;

export type FaceScanResult = {
  granted: boolean;
  member: Member | null;
  reason: string;
  attendanceId?: number;
  distance?: number;
  event?: "check_in" | "check_out";
};

const OPEN_VISIT_MS = 12 * 60 * 60 * 1000;

function parseWhen(value: string): number {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const time = Date.parse(normalized);
  return Number.isFinite(time) ? time : 0;
}

async function latestVisit(
  memberId: number,
): Promise<{ event: string; entryAt: string } | null> {
  const { data, error } = await supabase()
    .from("attendance")
    .select("event, entry_at")
    .eq("member_id", memberId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  dbError(error);
  if (!data) return null;
  return { event: data.event || "check_in", entryAt: data.entry_at };
}

async function isInside(memberId: number): Promise<boolean> {
  const latest = await latestVisit(memberId);
  if (!latest || latest.event !== "check_in") return false;
  return Date.now() - parseWhen(latest.entryAt) <= OPEN_VISIT_MS;
}

export function normalizeDescriptor(values: number[]): number[] {
  if (
    !Array.isArray(values) ||
    values.length !== FACE_DESCRIPTOR_LENGTH ||
    values.some((n) => typeof n !== "number" || !Number.isFinite(n))
  ) {
    throw new Error("Face descriptor must be 128 numbers");
  }
  let norm = 0;
  for (const v of values) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return values.map((v) => v / norm);
}

function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

type Enrolled = {
  member: Member;
  descriptor: number[];
};

async function enrolledMembers(): Promise<Enrolled[]> {
  const { data, error } = await supabase()
    .from("members")
    .select("*")
    .not("face_descriptor", "is", null);
  dbError(error);

  const out: Enrolled[] = [];
  for (const row of data ?? []) {
    if (!row.face_descriptor) continue;
    try {
      const parsed = JSON.parse(String(row.face_descriptor)) as number[];
      out.push({
        member: mapMember(row),
        descriptor: normalizeDescriptor(parsed),
      });
    } catch {
      // Skip a corrupt embedding instead of failing the whole scan.
    }
  }
  return out;
}

async function logFaceEvent(memberId: number, event: "check_in" | "check_out") {
  const { data, error } = await supabase()
    .from("attendance")
    .insert({
      member_id: memberId,
      day_pass_id: null,
      source: "face",
      event,
    })
    .select("id")
    .single();
  dbError(error);
  if (!data) throw new Error("Could not record attendance");
  return Number(data.id);
}

export async function saveFaceDescriptor(
  memberId: number,
  raw: number[],
): Promise<Member> {
  const descriptor = normalizeDescriptor(raw);
  const { data: existing, error: lookupError } = await supabase()
    .from("members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  dbError(lookupError);
  if (!existing) throw new Error("Member not found");

  const { data, error } = await supabase()
    .from("members")
    .update({ face_descriptor: JSON.stringify(descriptor) })
    .eq("id", memberId)
    .select("*")
    .single();
  dbError(error);
  return mapMember(data);
}

export async function matchFaceDescriptor(
  raw: number[],
  action: "check_in" | "check_out" = "check_in",
): Promise<FaceScanResult> {
  const probe = normalizeDescriptor(raw);
  const gallery = await enrolledMembers();
  if (gallery.length === 0) {
    return {
      granted: false,
      member: null,
      reason: "No faces enrolled yet. Staff must capture a face first.",
    };
  }

  let best: Enrolled | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of gallery) {
    const distance = euclidean(probe, entry.descriptor);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }

  if (!best || bestDistance > FACE_MATCH_THRESHOLD) {
    return {
      granted: false,
      member: null,
      reason: "Unknown face — try again or see staff",
      distance: Number(bestDistance.toFixed(3)),
    };
  }

  if (action === "check_out") {
    if (!(await isInside(best.member.id))) {
      return {
        granted: false,
        member: best.member,
        reason: "Not checked in",
        event: "check_out",
        distance: Number(bestDistance.toFixed(3)),
      };
    }
    const attendanceId = await logFaceEvent(best.member.id, "check_out");
    return {
      granted: true,
      member: best.member,
      reason: "Checked out. Occupancy updated.",
      attendanceId,
      distance: Number(bestDistance.toFixed(3)),
      event: "check_out",
    };
  }

  if (best.member.status !== "active") {
    return {
      granted: false,
      member: best.member,
      reason:
        best.member.status === "expired"
          ? "Membership expired"
          : "Membership frozen — see staff",
      distance: Number(bestDistance.toFixed(3)),
    };
  }

  if (await isInside(best.member.id)) {
    return {
      granted: false,
      member: best.member,
      reason: "Already checked in. Scan again to check out when you leave.",
      event: "check_in",
      distance: Number(bestDistance.toFixed(3)),
    };
  }

  const attendanceId = await logFaceEvent(best.member.id, "check_in");

  return {
    granted: true,
    member: best.member,
    reason: "Checked in",
    attendanceId,
    distance: Number(bestDistance.toFixed(3)),
    event: "check_in",
  };
}
