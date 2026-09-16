import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export type MemberStatus = "active" | "expired" | "frozen";

export type Member = {
  id: number;
  name: string;
  contact: string;
  status: MemberStatus;
  faceTag: string;
  feeAmount: number;
  createdAt: string;
};

/** Default monthly membership fee in PHP */
export const MEMBER_MONTHLY_FEE = 1500;

export type Attendance = {
  id: number;
  memberId: number | null;
  dayPassId: number | null;
  entryAt: string;
  source: "face" | "day_pass" | "manual";
  memberName?: string | null;
  dayPassCode?: string | null;
};

export type DayPass = {
  id: number;
  code: string;
  name: string;
  contact: string;
  amount: number;
  paidAt: string;
  usedAt: string | null;
};

const globalForDb = globalThis as unknown as {
  gymtraceDb?: Database.Database;
};

function dbPath() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "gymtrace.db");
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active','expired','frozen')),
      face_tag TEXT NOT NULL UNIQUE,
      fee_amount INTEGER NOT NULL DEFAULT 1500,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS day_passes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      amount INTEGER NOT NULL,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER REFERENCES members(id),
      day_pass_id INTEGER REFERENCES day_passes(id),
      entry_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL CHECK(source IN ('face','day_pass','manual'))
    );

    CREATE TABLE IF NOT EXISTS staff_pins (
      role TEXT PRIMARY KEY CHECK(role IN ('staff','admin')),
      pin TEXT NOT NULL
    );
  `);

  // Existing DBs created before fee_amount
  const cols = db.prepare(`PRAGMA table_info(members)`).all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === "fee_amount")) {
    db.exec(
      `ALTER TABLE members ADD COLUMN fee_amount INTEGER NOT NULL DEFAULT 1500`,
    );
  }

  const memberCount = db.prepare("SELECT COUNT(*) as c FROM members").get() as {
    c: number;
  };

  if (memberCount.c === 0) {
    const insertMember = db.prepare(
      `INSERT INTO members (name, contact, status, face_tag, fee_amount, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    );
    const seedMembers: [string, string, MemberStatus, string, number][] = [
      ["Alex Rivera", "09171234501", "active", "face-alex", MEMBER_MONTHLY_FEE],
      ["Jordan Cruz", "09171234502", "active", "face-jordan", MEMBER_MONTHLY_FEE],
      ["Sam Reyes", "09171234503", "active", "face-sam", MEMBER_MONTHLY_FEE],
      ["Casey Lim", "09171234504", "active", "face-casey", MEMBER_MONTHLY_FEE],
      ["Morgan Tan", "09171234505", "expired", "face-morgan", MEMBER_MONTHLY_FEE],
      ["Riley Ong", "09171234506", "frozen", "face-riley", MEMBER_MONTHLY_FEE],
      ["Taylor Uy", "09171234507", "active", "face-taylor", MEMBER_MONTHLY_FEE],
      ["Jamie Go", "09171234508", "active", "face-jamie", MEMBER_MONTHLY_FEE],
    ];
    for (const m of seedMembers) insertMember.run(...m);

    const insertPass = db.prepare(
      `INSERT INTO day_passes (code, name, contact, amount, paid_at, used_at) VALUES (?, ?, ?, ?, datetime('now'), ?)`,
    );
    insertPass.run("DP-2201", "Guest One", "09180000001", 250, null);
    insertPass.run("DP-2202", "Guest Two", "09180000002", 250, null);
    insertPass.run(
      "DP-USED1",
      "Used Guest",
      "09180000003",
      250,
      new Date(Date.now() - 86400000).toISOString(),
    );

    const insertAtt = db.prepare(
      `INSERT INTO attendance (member_id, day_pass_id, entry_at, source) VALUES (?, ?, ?, ?)`,
    );
    const now = Date.now();
    const hoursAgo = (h: number) =>
      new Date(now - h * 3600000).toISOString();
    insertAtt.run(1, null, hoursAgo(2), "face");
    insertAtt.run(2, null, hoursAgo(3), "face");
    insertAtt.run(3, null, hoursAgo(5), "face");
    insertAtt.run(4, null, hoursAgo(26), "face");
    insertAtt.run(7, null, hoursAgo(28), "face");
    insertAtt.run(1, null, hoursAgo(50), "face");
    insertAtt.run(null, 3, hoursAgo(30), "day_pass");

    db.prepare(`INSERT INTO staff_pins (role, pin) VALUES (?, ?)`).run(
      "staff",
      "1234",
    );
    db.prepare(`INSERT INTO staff_pins (role, pin) VALUES (?, ?)`).run(
      "admin",
      "9999",
    );
  }
}

export function getDb() {
  if (!globalForDb.gymtraceDb) {
    const db = new Database(dbPath());
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    globalForDb.gymtraceDb = db;
  }
  migrate(globalForDb.gymtraceDb);
  return globalForDb.gymtraceDb;
}

export function mapMember(row: Record<string, unknown>): Member {
  return {
    id: row.id as number,
    name: row.name as string,
    contact: row.contact as string,
    status: row.status as MemberStatus,
    faceTag: row.face_tag as string,
    feeAmount: Number(row.fee_amount ?? MEMBER_MONTHLY_FEE),
    createdAt: row.created_at as string,
  };
}

export function mapDayPass(row: Record<string, unknown>): DayPass {
  return {
    id: row.id as number,
    code: row.code as string,
    name: row.name as string,
    contact: row.contact as string,
    amount: row.amount as number,
    paidAt: row.paid_at as string,
    usedAt: (row.used_at as string | null) ?? null,
  };
}
