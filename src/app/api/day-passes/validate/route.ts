import { NextResponse } from "next/server";
import { dbError, mapDayPass, supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Pass code required" }, { status: 400 });
    }
    const { data: row, error } = await supabase()
      .from("day_passes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    dbError(error);
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
    const { data: updated, error: updateError } = await supabase()
      .from("day_passes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id)
      .select("*")
      .single();
    dbError(updateError);
    const { data: attendance, error: attendanceError } = await supabase()
      .from("attendance")
      .insert({
        member_id: null,
        day_pass_id: row.id,
        source: "day_pass",
        event: "check_in",
      })
      .select("id")
      .single();
    dbError(attendanceError);
    if (!attendance) throw new Error("Could not record attendance");
    return NextResponse.json({
      granted: true,
      reason: "Day pass validated — welcome",
      dayPass: mapDayPass(updated),
      attendanceId: Number(attendance.id),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Validate failed" },
      { status: 500 },
    );
  }
}
