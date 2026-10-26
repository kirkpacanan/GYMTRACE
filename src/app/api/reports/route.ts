import { NextResponse } from "next/server";
import { getReportsSummary } from "@/lib/occupancy";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getReportsSummary());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
