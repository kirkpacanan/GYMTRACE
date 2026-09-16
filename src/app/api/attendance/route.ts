import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.*, m.name as member_name, d.code as day_pass_code
       FROM attendance a
       LEFT JOIN members m ON m.id = a.member_id
       LEFT JOIN day_passes d ON d.id = a.day_pass_id
       ORDER BY a.entry_at DESC
       LIMIT 100`,
    )
    .all() as Record<string, unknown>[];

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id as number,
      memberId: r.member_id as number | null,
      dayPassId: r.day_pass_id as number | null,
      entryAt: r.entry_at as string,
      source: r.source as "face" | "day_pass" | "manual",
      memberName: (r.member_name as string | null) ?? null,
      dayPassCode: (r.day_pass_code as string | null) ?? null,
    })),
  });
}
