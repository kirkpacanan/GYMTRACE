import { NextResponse } from "next/server";
import { matchFaceDescriptor } from "@/lib/face-match";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      descriptor?: number[];
      action?: "check_in" | "check_out";
    };
    if (!body.descriptor) {
      return NextResponse.json(
        { error: "A face descriptor is required" },
        { status: 400 },
      );
    }
    const action = body.action === "check_out" ? "check_out" : "check_in";
    const result = await matchFaceDescriptor(body.descriptor, action);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Scan failed" },
      { status: 400 },
    );
  }
}
