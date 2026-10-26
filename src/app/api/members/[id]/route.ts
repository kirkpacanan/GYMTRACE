import { NextResponse } from "next/server";
import { dbError, mapMember, supabase, type MemberStatus } from "@/lib/db";

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
    const { data: existing, error: lookupError } = await supabase()
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();
    dbError(lookupError);
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    const name = body.name?.trim() ?? existing.name;
    const contact = body.contact?.trim() ?? existing.contact;
    const status = body.status ?? (existing.status as MemberStatus);
    if (!name || !contact) {
      return NextResponse.json(
        { error: "Name and contact are required" },
        { status: 400 },
      );
    }
    if (!["active", "expired", "frozen"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const { data, error } = await supabase()
      .from("members")
      .update({ name, contact, status })
      .eq("id", memberId)
      .select("*")
      .single();
    dbError(error);
    return NextResponse.json(mapMember(data));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const memberId = Number(id);
    const { data: existing, error: lookupError } = await supabase()
      .from("members")
      .select("id")
      .eq("id", memberId)
      .maybeSingle();
    dbError(lookupError);
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    const { error: attendanceError } = await supabase()
      .from("attendance")
      .delete()
      .eq("member_id", memberId);
    dbError(attendanceError);
    const { error } = await supabase().from("members").delete().eq("id", memberId);
    dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}
