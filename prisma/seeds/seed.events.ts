/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * If you want the seeded times to display as local Asia/Jakarta times (UTC+7)
 * when your app formats with local timezone, set this to 7.
 * We subtract this many hours when building the UTC timestamp so that,
 * for example, 09:00 local becomes 02:00Z in DB, which displays as 09:00 local.
 */
const LOCAL_TZ_OFFSET_HOURS = 7; // set to 0 if you want pure UTC hours

// Small helper for randoms
const rand = <T>(arr: T[]): T => arr[(Math.random() * arr.length) | 0];
const randint = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

// Some light clinical “reasons/concerns” to flavor follow-ups
const CONCERNS = [
  "anxiety",
  "sleep issues",
  "work stress",
  "panic",
  "low mood",
  "grief support",
  "ADHD follow-up",
  "relationship stress",
  "post-crisis safety plan",
];

// Appointment patterns w/ realistic durations (minutes)
type Pattern =
  | { kind: "fixed"; label: (c: any) => string; dur: number }
  | { kind: "range"; label: (c: any) => string; dur: [number, number] }
  | { kind: "group"; label: (names: string[]) => string; dur: number; size: [number, number] };

const PATTERNS: Pattern[] = [
  { kind: "fixed", label: (c) => `Initial intake – ${c.name}`, dur: 90 },
  { kind: "fixed", label: (c) => `Comprehensive assessment – ${c.name}`, dur: 75 },
  { kind: "fixed", label: (c) => `Individual therapy session – ${c.name}`, dur: 50 },
  { kind: "fixed", label: (c) => `Telehealth therapy – ${c.name} (RingCentral)`, dur: 50 },
  { kind: "fixed", label: (c) => `Medication management – ${c.name}`, dur: 30 },
  { kind: "fixed", label: (c) => `Crisis check-in – ${c.name}`, dur: 30 },
  { kind: "fixed", label: (c) => `Family therapy – ${c.name} (+guardian)`, dur: 75 },
  { kind: "range", label: (c) => `Follow-up (${rand(CONCERNS)}) – ${c.name}`, dur: [30, 60] },
  { kind: "fixed", label: (c) => `Treatment planning – ${c.name}`, dur: 45 },
  { kind: "fixed", label: (c) => `Care coordination call – ${c.name} (SimplePractice notes)`, dur: 30 },
  { kind: "group", label: (names) => `Group therapy (${names.join(", ")})`, dur: 90, size: [3, 5] },
];

// Make a UTC Date corresponding to local clock time (hour:minute) on given day
const makeUTCFromLocal = (dayUTC: Date, hour: number, minute: number) => {
  const y = dayUTC.getUTCFullYear();
  const m = dayUTC.getUTCMonth();
  const d = dayUTC.getUTCDate();
  return new Date(Date.UTC(y, m, d, hour - LOCAL_TZ_OFFSET_HOURS, minute, 0, 0));
};

// Overlap check (in minutes from 00:00 local)
const overlaps = (slots: Array<{ s: number; e: number }>, s: number, e: number) => slots.some((x) => x.s < e && x.e > s);

// Build weekdays (Mon–Fri) between start/end in UTC
const getWeekdaysBetween = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getUTCDay();
    if (d !== 0 && d !== 6) dates.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
};

// Pick N unique random items
const sampleUnique = <T>(arr: T[], n: number): T[] => {
  const copy = arr.slice();
  const out: T[] = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
};

// Create a random title + duration from patterns
const makeTitleAndDuration = (clients: any[]) => {
  const p = rand(PATTERNS);
  if (p.kind === "group") {
    const size = randint(p.size[0], p.size[1]);
    const groupNames = Array.from({ length: size }, () => rand(clients).name as string);
    return { title: p.label(groupNames), durationMin: p.dur };
  }
  if (p.kind === "fixed") {
    const c = rand(clients);
    return { title: p.label(c), durationMin: p.dur };
  }
  const c = rand(clients);
  return { title: p.label(c), durationMin: randint(p.dur[0], p.dur[1]) };
};

// Business constraints
const minuteSteps = [0, 15, 30, 45];
const BUSINESS_START = 9 * 60; // 09:00
const BUSINESS_END = 18 * 60; // 18:00
const LUNCH_S = 12 * 60; // 12:00
const LUNCH_E = 13 * 60; // 13:00

// Generate a non-overlapping slot inside business hours (avoids lunch)
const tryMakeNonOverlapSlot = (durationMin: number, used: Array<{ s: number; e: number }>) => {
  let guard = 0;
  while (guard++ < 200) {
    const startHour = randint(9, 17); // latest 17:xx
    const startMin = rand(minuteSteps);
    const s = startHour * 60 + startMin;
    const e = Math.min(s + durationMin, BUSINESS_END);
    if (e - s < 30) continue; // too short after capping
    if (s < LUNCH_E && e > LUNCH_S) continue; // avoid lunch
    if (overlaps(used, s, e)) continue; // keep it clean
    return { s, e };
  }
  return null as { s: number; e: number } | null;
};

// Create an overlapping slot based on a base slot
const makeOverlapSlotNear = (base: { s: number; e: number }, durationMin: number) => {
  const jitter = randint(-15, 20); // minutes
  const s = Math.max(BUSINESS_START, base.s + jitter);
  const e = Math.min(BUSINESS_END, s + durationMin);
  if (e - s < 15) return null;
  if (s < LUNCH_E && e > LUNCH_S) return null; // keep lunch clean
  return { s, e };
};

// Force an overlap pair at 10:00 (fallback guarantee)
const forceOverlapPair = async (user: { id: number; name: string }, day: Date, clients: any[]) => {
  const mk = () => makeTitleAndDuration(clients).title;

  const baseStart = makeUTCFromLocal(day, 10, 0);
  const baseEnd = makeUTCFromLocal(day, 11, 0);
  const ovStart = makeUTCFromLocal(day, 10, 15);
  const ovEnd = makeUTCFromLocal(day, 11, 0);

  await prisma.events.create({
    data: { userId: user.id, title: mk(), startDateTime: baseStart, endDateTime: baseEnd, status: Math.random() < 0.65 },
  });
  await prisma.events.create({
    data: { userId: user.id, title: mk(), startDateTime: ovStart, endDateTime: ovEnd, status: Math.random() < 0.65 },
  });

  console.log(`⚠️ Fallback forced overlap for ${user.name} at 10:00`);
};

export const seedEvents = async () => {
  const users = await prisma.users.findMany({ select: { id: true, name: true } });
  const clients = await prisma.clients.findMany({
    select: { id: true, name: true, city: true, state: true, country: true },
  });

  if (users.length === 0) throw new Error("No users found. Seed users first.");
  if (clients.length === 0) throw new Error("No clients found. Seed clients first.");

  // Aug 1, 2025 → Dec 31, 2026
  const startDate = new Date(Date.UTC(2025, 7, 1));
  const endDate = new Date(Date.UTC(2026, 11, 31));
  const weekdays = getWeekdaysBetween(startDate, endDate);

  for (const day of weekdays) {
    // Target OVERLAP events for this date (example: 1..7 like your sample)
    const targetOverlapEventsForDay = randint(1, 7);
    let madeOverlapsForDay = 0;

    // Choose 1–3 users who will host the overlaps for this date
    const overlapUsers = sampleUnique(users, randint(1, Math.min(3, users.length)));

    // Distribute the target overlap count across those users
    let remaining = targetOverlapEventsForDay;
    const distribution = overlapUsers.map((_, i) => {
      if (i === overlapUsers.length - 1) return remaining;
      const share = randint(1, Math.max(1, remaining - (overlapUsers.length - 1 - i)));
      remaining -= share;
      return share;
    });

    // Prebuild a per-user state
    const perUserUsed: Record<number, Array<{ s: number; e: number }>> = {};
    for (const u of users) perUserUsed[u.id] = [];

    // Helper: create event
    const createEventAt = async (userId: number, s: number, e: number) => {
      const startDateTime = makeUTCFromLocal(day, Math.floor(s / 60), s % 60);
      const endDateTime = makeUTCFromLocal(day, Math.floor(e / 60), e % 60);
      const { title } = makeTitleAndDuration(clients);
      const status = Math.random() < 0.65;
      await prisma.events.create({ data: { userId, title, startDateTime, endDateTime, status } });
      return { startDateTime, endDateTime, title };
    };

    // 1) For each overlap user, make a base slot then inject overlaps
    for (let i = 0; i < overlapUsers.length; i++) {
      const user = overlapUsers[i];
      const used = perUserUsed[user.id];

      // Daily event quota for this user
      const perDay = randint(4, 9);
      let created = 0;
      let guard = 0;

      // Base clean event to overlap against
      const { durationMin: baseDur } = makeTitleAndDuration(clients);
      const baseSlot = tryMakeNonOverlapSlot(baseDur, used);
      if (baseSlot) {
        await createEventAt(user.id, baseSlot.s, baseSlot.e);
        used.push(baseSlot);
        created++;
      }

      // Inject overlaps equal to distribution[i]
      const want = Math.max(1, distribution[i]);
      for (let j = 0; j < want; j++) {
        const ref = used.length ? rand(used) : baseSlot;
        if (!ref) break;
        const { durationMin } = makeTitleAndDuration(clients);
        const ov = makeOverlapSlotNear(ref, durationMin) || makeOverlapSlotNear(ref, 45) || makeOverlapSlotNear(ref, 30);
        if (!ov) continue;

        await createEventAt(user.id, ov.s, ov.e);
        // We intentionally overlap, so count it
        madeOverlapsForDay++;
        used.push(ov);
        created++;
        if (created >= perDay) break;
      }

      // Fill remaining for this user with clean events
      while (created < perDay && guard++ < 120) {
        const { durationMin } = makeTitleAndDuration(clients);
        const slot = tryMakeNonOverlapSlot(durationMin, used);
        if (!slot) break;
        await createEventAt(user.id, slot.s, slot.e);
        used.push(slot);
        created++;
      }
    }

    // 2) Other users (non-overlap users) — fill clean schedules
    const nonOverlapUsers = users.filter((u) => !overlapUsers.some((ou) => ou.id === u.id));
    for (const user of nonOverlapUsers) {
      const used = perUserUsed[user.id];
      const perDay = randint(4, 9);
      let created = 0;
      let guard = 0;
      while (created < perDay && guard++ < 160) {
        const { durationMin } = makeTitleAndDuration(clients);
        const slot = tryMakeNonOverlapSlot(durationMin, used);
        if (!slot) continue;
        await createEventAt(user.id, slot.s, slot.e);
        used.push(slot);
        created++;
      }
    }

    // 3) Hard guarantee: if no overlaps were made for this date, force a pair
    if (madeOverlapsForDay < 1) {
      await forceOverlapPair(rand(users), day, clients);
      madeOverlapsForDay = 1;
    }

    console.log(`📅 ${day.toISOString().slice(0, 10)} → overlaps: ${madeOverlapsForDay} (target ${targetOverlapEventsForDay})`);
  }

  console.log("✅ Seeded events with guaranteed daily overlaps across all weekdays.");
};

// If you want to run directly: `ts-node prisma/seeds/seedEvents.ts`
if (require.main === module) {
  seedEvents()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      prisma.$disconnect();
    });
}
