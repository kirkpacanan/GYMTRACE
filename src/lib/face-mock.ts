import { getDb, mapMember, type Member } from "./db";

export type FaceScanResult = {
  granted: boolean;
  member: Member | null;
  reason: string;
  attendanceId?: number;
};

/**
 * Demo face matcher: randomly picks an enrolled faceTag most of the time,
 * or fails / hits inactive membership for demo variety.
 * Replace with a real face API later.
 */
export function mockFaceScan(forcedTag?: string): FaceScanResult {
  const db = getDb();
  const members = db
    .prepare("SELECT * FROM members ORDER BY id")
    .all()
    .map((r) => mapMember(r as Record<string, unknown>));

  if (members.length === 0) {
    return { granted: false, member: null, reason: "No enrolled members" };
  }

  let target: Member;
  if (forcedTag) {
    const found = members.find((m) => m.faceTag === forcedTag);
    if (!found) {
      return { granted: false, member: null, reason: "Unknown face" };
    }
    target = found;
  } else {
    const roll = Math.random();
    if (roll < 0.12) {
      return { granted: false, member: null, reason: "Unknown face — try again or see staff" };
    }
    // Bias toward active members for happier demos
    const active = members.filter((m) => m.status === "active");
    const pool = roll < 0.85 && active.length ? active : members;
    target = pool[Math.floor(Math.random() * pool.length)];
  }

  if (target.status !== "active") {
    return {
      granted: false,
      member: target,
      reason:
        target.status === "expired"
          ? "Membership expired"
          : "Membership frozen — see staff",
    };
  }

  const info = db
    .prepare(
      `INSERT INTO attendance (member_id, day_pass_id, entry_at, source)
       VALUES (?, NULL, datetime('now'), 'face')`,
    )
    .run(target.id);

  return {
    granted: true,
    member: target,
    reason: "Membership verified",
    attendanceId: Number(info.lastInsertRowid),
  };
}
