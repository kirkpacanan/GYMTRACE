import { NextResponse } from "next/server";
import {
  getDb,
  mapMember,
  MEMBER_MONTHLY_FEE,
  type MemberStatus,
} from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM members ORDER BY id DESC").all();
  return NextResponse.json({
    items: rows.map((r) => mapMember(r as Record<string, unknown>)),
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
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO members (name, contact, status, face_tag, fee_amount)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(body.name.trim(), body.contact.trim(), status, faceTag, feeAmount);
    const row = db
      .prepare("SELECT * FROM members WHERE id = ?")
      .get(info.lastInsertRowid);
    return NextResponse.json(mapMember(row as Record<string, unknown>), {
      status: 201,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
