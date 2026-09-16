import { NextResponse } from "next/server";
import { getDb, mapDayPass } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM day_passes ORDER BY paid_at DESC")
    .all();
  return NextResponse.json({
    items: rows.map((r) => mapDayPass(r as Record<string, unknown>)),
  });
}
