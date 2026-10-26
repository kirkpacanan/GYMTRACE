import { NextResponse } from "next/server";
import { saveFaceDescriptor } from "@/lib/face-match";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const memberId = Number(id);
    if (!Number.isFinite(memberId)) {
      return NextResponse.json({ error: "Invalid member" }, { status: 400 });
    }
    const body = (await req.json()) as { descriptor?: number[] };
    const member = await saveFaceDescriptor(memberId, body.descriptor ?? []);
    return NextResponse.json({ ok: true, member });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Face enroll failed";
    const status = message === "Member not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
