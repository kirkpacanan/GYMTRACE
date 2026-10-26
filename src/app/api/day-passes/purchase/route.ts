import { NextResponse } from "next/server";
import { dbError, mapDayPass, supabase } from "@/lib/db";

export const runtime = "nodejs";

async function nextCode() {
  const { data, error } = await supabase()
    .from("day_passes")
    .select("code")
    .like("code", "DP-%")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  dbError(error);
  const n = data?.code ? Number(data.code.replace("DP-", "")) || 2200 : 2200;
  return `DP-${n + 1}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      contact?: string;
      method?: string;
    };
    if (!body.name?.trim() || !body.contact?.trim()) {
      return NextResponse.json(
        { error: "Name and contact are required" },
        { status: 400 },
      );
    }
    if (Math.random() < 0.08) {
      return NextResponse.json(
        { error: "Payment failed — try again" },
        { status: 402 },
      );
    }
    const code = await nextCode();
    const { data, error } = await supabase()
      .from("day_passes")
      .insert({
        code,
        name: body.name.trim(),
        contact: body.contact.trim(),
        amount: 250,
      })
      .select("*")
      .single();
    dbError(error);
    return NextResponse.json(mapDayPass(data), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Purchase failed" },
      { status: 500 },
    );
  }
}
