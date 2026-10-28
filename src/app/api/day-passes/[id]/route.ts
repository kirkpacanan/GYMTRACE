import { NextResponse } from "next/server";
import { dbError, supabase } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const dayPassId = Number(id);
    if (!Number.isFinite(dayPassId) || dayPassId < 1) {
      return NextResponse.json({ error: "Invalid day pass id" }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await supabase()
      .from("day_passes")
      .select("id")
      .eq("id", dayPassId)
      .maybeSingle();
    dbError(lookupError);
    if (!existing) {
      return NextResponse.json({ error: "Day pass not found" }, { status: 404 });
    }

    const { error: attendanceError } = await supabase()
      .from("attendance")
      .delete()
      .eq("day_pass_id", dayPassId);
    dbError(attendanceError);

    const { error } = await supabase()
      .from("day_passes")
      .delete()
      .eq("id", dayPassId);
    dbError(error);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}
