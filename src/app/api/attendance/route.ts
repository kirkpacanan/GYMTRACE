import { NextResponse } from "next/server";
import { dbError, supabase } from "@/lib/db";

export const runtime = "nodejs";

type AttendanceRow = {
  id: number;
  member_id: number | null;
  day_pass_id: number | null;
  entry_at: string;
  source: "face" | "day_pass" | "manual";
  event: "check_in" | "check_out" | null;
  members: { name: string } | { name: string }[] | null;
  day_passes: { code: string } | { code: string }[] | null;
};

function relatedName(
  value: { name: string } | { name: string }[] | null,
): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0]?.name ?? null) : value.name;
}

function relatedCode(
  value: { code: string } | { code: string }[] | null,
): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0]?.code ?? null) : value.code;
}

export async function GET() {
  const { data, error } = await supabase()
    .from("attendance")
    .select(
      "id, member_id, day_pass_id, entry_at, source, event, members(name), day_passes(code)",
    )
    .order("entry_at", { ascending: false })
    .limit(100);
  dbError(error);

  return NextResponse.json({
    items: ((data ?? []) as AttendanceRow[]).map((row) => ({
      id: row.id,
      memberId: row.member_id,
      dayPassId: row.day_pass_id,
      entryAt: row.entry_at,
      source: row.source,
      event: row.event || "check_in",
      memberName: relatedName(row.members),
      dayPassCode: relatedCode(row.day_passes),
    })),
  });
}
