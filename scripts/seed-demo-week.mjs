#!/usr/bin/env node
/**
 * Seed ~1 week of realistic GYMTRACE demo data (Filipino names / PH mobiles).
 * Usage: node scripts/seed-demo-week.mjs
 * Clears members, day_passes, and attendance first (keeps pins + rates).
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const raw = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function unitDescriptor(rng) {
  const v = Array.from({ length: 128 }, () => rng() * 2 - 1);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function iso(d) {
  return d.toISOString();
}

function atLocal(base, hour, minute = 0) {
  const d = new Date(base);
  d.setHours(hour, minute, Math.floor(Math.random() * 50), 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function phone(rng) {
  // Philippine mobile: 09XXXXXXXXX
  const prefixes = ["0917", "0918", "0919", "0927", "0939", "0945", "0956", "0967", "0977", "0995"];
  const p = prefixes[Math.floor(rng() * prefixes.length)];
  let rest = "";
  for (let i = 0; i < 7; i++) rest += Math.floor(rng() * 10);
  return p + rest;
}

const FIRST = [
  "Juan", "Maria", "Jose", "Ana", "Carlo", "Sofia", "Miguel", "Isabel",
  "Andres", "Camille", "Paolo", "Bianca", "Rafael", "Katrina", "Diego",
  "Angela", "Luis", "Patricia", "Gabriel", "Nicole", "Marco", "Jasmine",
  "Francis", "Andrea", "Christian", "Michelle", "Joshua", "Samantha",
  "Emmanuel", "Angelica", "Daniel", "Christine", "Patrick", "Monica",
];

const LAST = [
  "Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Mendoza", "Torres",
  "Flores", "Gonzales", "Ramos", "Lopez", "Diaz", "Castillo", "Villanueva",
  "Aquino", "Navarro", "Domingo", "Pascual", "Salazar", "Dela Cruz",
  "Fernandez", "Rivera", "Gutierrez", "Morales", "Cabrera", "Santiago",
];

const PEAK_SLOTS = [
  [6, 45],
  [7, 15],
  [7, 40],
  [12, 10],
  [17, 20],
  [18, 5],
  [18, 35],
  [19, 10],
  [19, 40],
];

async function main() {
  const env = loadEnv();
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rng = mulberry32(20261029);

  console.log("Clearing attendance, day_passes, members…");
  // Order: attendance first (FKs), then children tables
  for (const table of ["attendance", "day_passes", "members"]) {
    const { error } = await sb.from(table).delete().gte("id", 0);
    if (error) throw new Error(`${table}: ${error.message}`);
  }

  const ratesRes = await sb
    .from("membership_rates")
    .select("monthly_price, day_pass_price")
    .eq("id", 1)
    .maybeSingle();
  const monthly = Number(ratesRes.data?.monthly_price || 1500);
  const dayPassPrice = Number(ratesRes.data?.day_pass_price || 250);

  // Build member roster
  let nameIdx = 0;
  const takeName = () => {
    // Pair first/last on different cycles so surnames don't all stick on Santos
    const first = FIRST[nameIdx % FIRST.length];
    const last = LAST[(nameIdx * 7 + 3) % LAST.length];
    nameIdx += 1;
    return `${first} ${last}`;
  };

  const specs = [
    // active regulars (enrolled faces)
    ...Array.from({ length: 18 }, () => ({ status: "active", months: 1 })),
    ...Array.from({ length: 4 }, () => ({ status: "active", months: 6 })),
    ...Array.from({ length: 2 }, () => ({ status: "active", months: 12 })),
    // frozen
    ...Array.from({ length: 3 }, () => ({ status: "frozen", months: 3 })),
    // expired
    ...Array.from({ length: 4 }, () => ({ status: "expired", months: 1 })),
  ];

  const now = new Date();
  const memberRows = specs.map((spec, i) => {
    const name = takeName();
    const createdOffset = 3 + Math.floor(rng() * 40); // joined days ago
    const created = daysAgo(createdOffset);
    created.setHours(10 + Math.floor(rng() * 6), Math.floor(rng() * 60), 0, 0);

    let expires;
    if (spec.status === "expired") {
      expires = daysAgo(2 + Math.floor(rng() * 20));
    } else if (spec.status === "frozen") {
      expires = new Date(now);
      expires.setMonth(expires.getMonth() + 1 + Math.floor(rng() * 2));
    } else {
      expires = new Date(created);
      expires.setMonth(expires.getMonth() + spec.months);
      if (expires <= now) {
        expires = new Date(now);
        expires.setMonth(expires.getMonth() + spec.months);
      }
    }

    const tag = `demo_face_${String(i + 1).padStart(3, "0")}`;
    return {
      name,
      contact: phone(rng),
      status: spec.status,
      face_tag: tag,
      face_descriptor: JSON.stringify(unitDescriptor(rng)),
      fee_amount: monthly * spec.months,
      months_paid: spec.months,
      expires_at: iso(expires),
      created_at: iso(created),
    };
  });

  // A couple brand-new active members (joined this week)
  for (let i = 0; i < 3; i++) {
    const created = daysAgo(i);
    created.setHours(9 + i, 20, 0, 0);
    const expires = new Date(created);
    expires.setMonth(expires.getMonth() + 1);
    memberRows.push({
      name: takeName(),
      contact: phone(rng),
      status: "active",
      face_tag: `demo_face_new_${i + 1}`,
      face_descriptor: JSON.stringify(unitDescriptor(rng)),
      fee_amount: monthly,
      months_paid: 1,
      expires_at: iso(expires),
      created_at: iso(created),
    });
  }

  console.log(`Inserting ${memberRows.length} members…`);
  const { data: members, error: memErr } = await sb
    .from("members")
    .insert(memberRows)
    .select("id, name, status, face_tag");
  if (memErr) throw new Error(memErr.message);

  const active = members.filter((m) => m.status === "active");
  const frozen = members.filter((m) => m.status === "frozen");
  const expired = members.filter((m) => m.status === "expired");

  // Day-pass guests over the week
  const guestNames = [
    "Ryan Villamor", "Lara Escobar", "Benjie Padilla", "Nina Cortez",
    "Kevin Alonzo", "Tricia Belmonte", "Omar Jimenez", "Hera Quinto",
    "Vince Marquez", "Chloe Sandoval", "Jeric Tan", "Mika Rocha",
  ];
  const dayPassRows = [];
  let codeN = 2301;
  for (let day = 6; day >= 0; day--) {
    const count = day === 0 ? 3 : 1 + Math.floor(rng() * 2);
    for (let g = 0; g < count; g++) {
      const paid = atLocal(daysAgo(day), 7 + Math.floor(rng() * 12), Math.floor(rng() * 50));
      const name = guestNames[(codeN + g) % guestNames.length];
      const used = rng() > 0.15; // most used
      const usedAt = used
        ? atLocal(daysAgo(day), paid.getHours() + 1, Math.floor(rng() * 40))
        : null;
      dayPassRows.push({
        code: `DP-${codeN++}`,
        name,
        contact: phone(rng),
        amount: dayPassPrice,
        paid_at: iso(paid),
        used_at: usedAt ? iso(usedAt) : null,
      });
    }
  }

  console.log(`Inserting ${dayPassRows.length} day passes…`);
  const { data: passes, error: passErr } = await sb
    .from("day_passes")
    .insert(dayPassRows)
    .select("id, code, used_at, paid_at");
  if (passErr) throw new Error(passErr.message);

  const attendance = [];

  // Week of member visits (active + a few frozen/expired historical before status change)
  for (let day = 6; day >= 0; day--) {
    const dayBase = daysAgo(day);
    const weekend = dayBase.getDay() === 0 || dayBase.getDay() === 6;
    const visitCount = weekend
      ? 8 + Math.floor(rng() * 5)
      : 12 + Math.floor(rng() * 8);

    const pool = [...active];
    // occasional frozen/expired who visited earlier in week narrative — skip today for expired/frozen
    if (day >= 3) {
      pool.push(...frozen.slice(0, 1), ...expired.slice(0, 1));
    }

    const shuffled = pool.sort(() => rng() - 0.5).slice(0, Math.min(visitCount, pool.length));
    for (const m of shuffled) {
      const slot = PEAK_SLOTS[Math.floor(rng() * PEAK_SLOTS.length)];
      const cin = atLocal(dayBase, slot[0], slot[1] + Math.floor(rng() * 15));
      const durationMin = 45 + Math.floor(rng() * 90);
      const cout = new Date(cin.getTime() + durationMin * 60 * 1000);

      // Don't check out people we want still inside today during evening peaks
      const leaveOpen =
        day === 0 &&
        cin.getHours() >= 17 &&
        rng() > 0.35 &&
        m.status === "active";

      attendance.push({
        member_id: m.id,
        day_pass_id: null,
        entry_at: iso(cin),
        source: "face",
        event: "check_in",
      });
      if (!leaveOpen && cout < now) {
        attendance.push({
          member_id: m.id,
          day_pass_id: null,
          entry_at: iso(cout),
          source: "face",
          event: "check_out",
        });
      }
    }
  }

  // Morning wave today still inside (for live occupancy)
  const morningInside = active.sort(() => rng() - 0.5).slice(0, 6);
  for (const m of morningInside) {
    const cin = atLocal(daysAgo(0), now.getHours() <= 10 ? 6 : Math.max(6, now.getHours() - 2), Math.floor(rng() * 40));
    // avoid duplicate open visits — only add if we didn't already leave them open
    const already = attendance.some(
      (a) =>
        a.member_id === m.id &&
        a.event === "check_in" &&
        !attendance.some(
          (b) =>
            b.member_id === m.id &&
            b.event === "check_out" &&
            b.entry_at > a.entry_at,
        ) &&
        new Date(a.entry_at).toDateString() === now.toDateString(),
    );
    if (already) continue;
    attendance.push({
      member_id: m.id,
      day_pass_id: null,
      entry_at: iso(cin),
      source: "face",
      event: "check_in",
    });
  }

  // Day-pass attendance when used
  for (const p of passes) {
    if (!p.used_at) continue;
    const cin = new Date(p.used_at);
    const cout = new Date(cin.getTime() + (50 + Math.floor(rng() * 80)) * 60 * 1000);
    attendance.push({
      member_id: null,
      day_pass_id: p.id,
      entry_at: iso(cin),
      source: "day_pass",
      event: "check_in",
    });
    const leaveOpen =
      localSameDay(cin, now) &&
      cin.getHours() >= Math.max(0, now.getHours() - 3) &&
      rng() > 0.5;
    if (!leaveOpen && cout < now) {
      attendance.push({
        member_id: null,
        day_pass_id: p.id,
        entry_at: iso(cout),
        source: "day_pass",
        event: "check_out",
      });
    }
  }

  // Sort by time for nicer IDs chronology
  attendance.sort((a, b) => Date.parse(a.entry_at) - Date.parse(b.entry_at));

  console.log(`Inserting ${attendance.length} attendance events…`);
  // batch insert
  const chunk = 80;
  for (let i = 0; i < attendance.length; i += chunk) {
    const slice = attendance.slice(i, i + chunk);
    const { error } = await sb.from("attendance").insert(slice);
    if (error) throw new Error(error.message);
  }

  // Count currently inside (open check-ins within 12h)
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  const { data: recent } = await sb
    .from("attendance")
    .select("member_id, day_pass_id, event, entry_at")
    .order("id", { ascending: false });
  const seen = new Set();
  let inside = 0;
  for (const row of recent ?? []) {
    const key =
      row.member_id != null ? `m:${row.member_id}` : `d:${row.day_pass_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (row.event !== "check_in") continue;
    if (Date.parse(row.entry_at) >= cutoff) inside += 1;
  }

  console.log("Done.");
  console.log(
    JSON.stringify(
      {
        members: members.length,
        active: active.length,
        frozen: frozen.length,
        expired: expired.length,
        dayPasses: passes.length,
        attendance: attendance.length,
        peopleInsideNow: inside,
      },
      null,
      2,
    ),
  );
}

function localSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
