import { NextResponse } from "next/server";
import { dbError, mapDayPass, supabase } from "@/lib/db";

export const runtime = "nodejs";

const OPEN_VISIT_MS = 12 * 60 * 60 * 1000;

async function latestVisit(dayPassId: number) {
  const { data, error } = await supabase()
    .from("attendance")
    .select("event, entry_at")
    .eq("day_pass_id", dayPassId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  dbError(error);
  return data;
}

function isOpenVisit(visit: { event: string; entry_at: string } | null) {
  if (!visit || visit.event !== "check_in") return false;
  const time = Date.parse(visit.entry_at);
  return Number.isFinite(time) && Date.now() - time <= OPEN_VISIT_MS;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      code?: string;
      action?: "check_in" | "check_out";
    };
    const code = body.code?.trim().toUpperCase();
    const action = body.action === "check_out" ? "check_out" : "check_in";
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
        event: action,
      });
    }

    const visit = await latestVisit(Number(row.id));
    const inside = isOpenVisit(visit);
    const finished = Boolean(row.used_at) && !inside;

    if (action === "check_out") {
      if (!inside) {
        return NextResponse.json({
          granted: false,
          reason: "Not checked in",
          event: "check_out",
          dayPass: mapDayPass(row),
        });
      }
      const { data: attendance, error: attendanceError } = await supabase()
        .from("attendance")
        .insert({
          member_id: null,
          day_pass_id: row.id,
          source: "day_pass",
          event: "check_out",
        })
        .select("id")
        .single();
      dbError(attendanceError);
      if (!attendance) throw new Error("Could not record attendance");
      return NextResponse.json({
        granted: true,
        reason: "Checked out. Occupancy updated.",
        event: "check_out",
        dayPass: mapDayPass(row),
        attendanceId: Number(attendance.id),
      });
    }

    if (inside) {
      return NextResponse.json({
        granted: false,
        reason: "Already checked in. Scan again to check out when you leave.",
        event: "check_in",
        dayPass: mapDayPass(row),
      });
    }
    if (finished) {
      return NextResponse.json({
        granted: false,
        reason: "Pass already used",
        event: "check_in",
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
      event: "check_in",
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
