import { NextResponse } from "next/server";
import { mockFaceScan } from "@/lib/face-mock";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { faceTag?: string };
    const result = mockFaceScan(body.faceTag);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Scan failed" },
      { status: 500 },
    );
  }
}
