import { NextResponse } from "next/server";
import { dbError, supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      role?: "staff" | "admin";
      pin?: string;
    };
    if (!body.role || !body.pin) {
      return NextResponse.json(
        { error: "Role and pin required" },
        { status: 400 },
      );
    }
    const { data, error } = await supabase()
      .from("staff_pins")
      .select("pin")
      .eq("role", body.role)
      .maybeSingle();
    dbError(error);
    if (!data || data.pin !== body.pin) {
      return NextResponse.json({ ok: false, error: "Invalid PIN" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auth failed" },
      { status: 500 },
    );
  }
}
