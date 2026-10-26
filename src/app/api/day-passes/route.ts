import { NextResponse } from "next/server";
import { dbError, mapDayPass, supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabase()
    .from("day_passes")
    .select("*")
    .order("paid_at", { ascending: false });
  dbError(error);
  return NextResponse.json({
    items: (data ?? []).map((row) => mapDayPass(row)),
  });
}
