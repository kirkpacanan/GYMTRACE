import { NextResponse } from "next/server";
import { getDb, mapDayPass } from "@/lib/db";

export const runtime = "nodejs";

function nextCode(db: ReturnType<typeof getDb>) {
  const row = db
    .prepare(
      `SELECT code FROM day_passes WHERE code LIKE 'DP-%' ORDER BY id DESC LIMIT 1`,
    )
    .get() as { code?: string } | undefined;
  const n = row?.code ? Number(row.code.replace("DP-", "")) || 2200 : 2200;
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
    // Mock payment: fail ~8% for demo of failure path
    if (Math.random() < 0.08) {
      return NextResponse.json(
        { error: "Payment failed — try again" },
        { status: 402 },
      );
    }
    const db = getDb();
    const code = nextCode(db);
    const info = db
      .prepare(
        `INSERT INTO day_passes (code, name, contact, amount) VALUES (?, ?, ?, ?)`,
      )
      .run(code, body.name.trim(), body.contact.trim(), 250);
    const row = db
      .prepare("SELECT * FROM day_passes WHERE id = ?")
      .get(info.lastInsertRowid);
    return NextResponse.json(mapDayPass(row as Record<string, unknown>), {
      status: 201,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Purchase failed" },
      { status: 500 },
    );
  }
}
