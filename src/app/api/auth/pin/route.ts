import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
    const db = getDb();
    const row = db
      .prepare("SELECT pin FROM staff_pins WHERE role = ?")
      .get(body.role) as { pin: string } | undefined;
    if (!row || row.pin !== body.pin) {
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
