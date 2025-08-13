import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * If you want seeded times to DISPLAY as local Asia/Jakarta times (UTC+7)
 * in your UI, set this to 7. We subtract this from the local "HH:mm" clock
 * when building the UTC timestamp (so 12:00 local -> 05:00Z stored).
 */
const LOCAL_TZ_OFFSET_HOURS = 7;

/** Build a UTC Date so that it shows up as hh:mm LOCAL for the given UTC day */
function combineLocalToUTCForUTCDay(dayUTC: Date, hhmm: string, offsetHours = 0): Date {
  const [hh, mm] = hhmm.split(":").map((n) => parseInt(n, 10));
  const y = dayUTC.getUTCFullYear();
  const m = dayUTC.getUTCMonth(); // 0-based
  const d = dayUTC.getUTCDate();
  return new Date(Date.UTC(y, m, d, (hh || 0) - offsetHours, mm || 0, 0, 0));
}

function getWeekdaysBetweenUTC(startUTC: Date, endUTC: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startUTC);
  while (current.getTime() <= endUTC.getTime()) {
    const day = current.getUTCDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export const seedSchedules = async () => {
  const title = "Lunch";
  const startClock = "12:00";
  const endClock = "13:00";

  // Use UTC anchors for the date range
  const startDateUTC = new Date(Date.UTC(2025, 7, 1)); // Aug 1, 2025 (UTC midnight)
  const endDateUTC = new Date(Date.UTC(2025, 9, 31)); // Oct 31, 2025 (UTC midnight)

  const weekdays = getWeekdaysBetweenUTC(startDateUTC, endDateUTC);

  const rows = weekdays.map((day) => {
    const startDateTime = combineLocalToUTCForUTCDay(day, startClock, LOCAL_TZ_OFFSET_HOURS);
    const endDateTime = combineLocalToUTCForUTCDay(day, endClock, LOCAL_TZ_OFFSET_HOURS);
    return { title, startDateTime, endDateTime };
  });

  // Prefer createMany for speed
  await prisma.schedules.createMany({
    data: rows,
  });

  // Optional: log a few examples
  if (rows.length) {
    const ex = rows[0];
    console.log(`Example row -> "${ex.title}" | start: ${ex.startDateTime.toISOString()} | end: ${ex.endDateTime.toISOString()}`);
  }

  console.log(`✅ Seeded ${rows.length} schedules from 2025-08-01 to 2025-10-31 (weekdays only).`);
};

// If you want to run directly:
// seedSchedules().finally(() => prisma.$disconnect());
