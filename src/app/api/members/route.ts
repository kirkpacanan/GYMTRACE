import { NextResponse } from "next/server";
import {
  dbError,
  mapMember,
  MEMBER_MONTHLY_FEE,
  supabase,
  type MemberStatus,
} from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabase()
    .from("members")
    .select("*")
    .order("id", { ascending: false });
  dbError(error);
  return NextResponse.json({
    items: (data ?? []).map((row) => mapMember(row)),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      contact?: string;
      status?: MemberStatus;
      faceTag?: string;
      feeAmount?: number;
    };
    if (!body.name?.trim() || !body.contact?.trim()) {
      return NextResponse.json(
        { error: "Name and contact are required" },
        { status: 400 },
      );
    }
    const status = body.status || "active";
    const feeAmount =
      typeof body.feeAmount === "number" && body.feeAmount > 0
        ? body.feeAmount
        : MEMBER_MONTHLY_FEE;
    const faceTag =
      body.faceTag?.trim() ||
      `face-${body.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
    const { data, error } = await supabase()
      .from("members")
      .insert({
        name: body.name.trim(),
        contact: body.contact.trim(),
        status,
        face_tag: faceTag,
        fee_amount: feeAmount,
      })
      .select("*")
      .single();
    dbError(error);
    return NextResponse.json(mapMember(data), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
