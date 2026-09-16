import { NextResponse } from "next/server";
import { getDb, mapMember, type MemberStatus } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const memberId = Number(id);
    const body = (await req.json()) as {
      name?: string;
      contact?: string;
      status?: MemberStatus;
    };
    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM members WHERE id = ?")
      .get(memberId) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    const name = body.name?.trim() ?? (existing.name as string);
    const contact = body.contact?.trim() ?? (existing.contact as string);
    const status = body.status ?? (existing.status as MemberStatus);
    db.prepare(
      `UPDATE members SET name = ?, contact = ?, status = ? WHERE id = ?`,
    ).run(name, contact, status, memberId);
    const row = db.prepare("SELECT * FROM members WHERE id = ?").get(memberId);
    return NextResponse.json(mapMember(row as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}
