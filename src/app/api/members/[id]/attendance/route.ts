import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const memberId = Number(id);
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.*, m.name as member_name
       FROM attendance a
       LEFT JOIN members m ON m.id = a.member_id
       WHERE a.member_id = ?
       ORDER BY a.entry_at DESC
       LIMIT 50`,
    )
    .all(memberId) as Record<string, unknown>[];

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id as number,
      memberId: r.member_id as number | null,
      dayPassId: r.day_pass_id as number | null,
      entryAt: r.entry_at as string,
      source: r.source as "face" | "day_pass" | "manual",
      memberName: (r.member_name as string | null) ?? null,
    })),
  });
}
