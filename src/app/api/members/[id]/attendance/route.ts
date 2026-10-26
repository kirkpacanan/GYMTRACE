import { NextResponse } from "next/server";
import { dbError, supabase } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

type AttendanceRow = {
  id: number;
  member_id: number | null;
  day_pass_id: number | null;
  entry_at: string;
  source: "face" | "day_pass" | "manual";
  event: "check_in" | "check_out" | null;
  members: { name: string } | { name: string }[] | null;
};

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const memberId = Number(id);
  const { data, error } = await supabase()
    .from("attendance")
    .select(
      "id, member_id, day_pass_id, entry_at, source, event, members(name)",
    )
    .eq("member_id", memberId)
    .order("entry_at", { ascending: false })
    .limit(50);
  dbError(error);

  return NextResponse.json({
    items: ((data ?? []) as AttendanceRow[]).map((row) => {
      const member = Array.isArray(row.members) ? row.members[0] : row.members;
      return {
        id: row.id,
        memberId: row.member_id,
        dayPassId: row.day_pass_id,
        entryAt: row.entry_at,
        source: row.source,
        event: row.event || "check_in",
        memberName: member?.name ?? null,
      };
    }),
  });
}
