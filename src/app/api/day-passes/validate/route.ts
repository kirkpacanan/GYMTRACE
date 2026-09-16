import { NextResponse } from "next/server";
import { getDb, mapDayPass } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Pass code required" }, { status: 400 });
    }
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM day_passes WHERE upper(code) = ?")
      .get(code) as Record<string, unknown> | undefined;
    if (!row) {
      return NextResponse.json({
        granted: false,
        reason: "Invalid pass code",
      });
    }
    if (row.used_at) {
      return NextResponse.json({
        granted: false,
        reason: "Pass already used",
        dayPass: mapDayPass(row),
      });
    }
    db.prepare(
      `UPDATE day_passes SET used_at = datetime('now') WHERE id = ?`,
    ).run(row.id);
    const att = db
      .prepare(
        `INSERT INTO attendance (member_id, day_pass_id, entry_at, source)
         VALUES (NULL, ?, datetime('now'), 'day_pass')`,
      )
      .run(row.id);
    const updated = db
      .prepare("SELECT * FROM day_passes WHERE id = ?")
      .get(row.id);
    return NextResponse.json({
      granted: true,
      reason: "Day pass validated — welcome",
      dayPass: mapDayPass(updated as Record<string, unknown>),
      attendanceId: Number(att.lastInsertRowid),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Validate failed" },
      { status: 500 },
    );
  }
}
