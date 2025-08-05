import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const seedSchedules = async () => {
  const title = "Lunch";
  const startTime = "12:00";
  const endTime = "13:00";
  const startDate = new Date(Date.UTC(2025, 7, 1)); // August 1, 2025
  const endDate = new Date(Date.UTC(2025, 9, 31)); // October 31, 2025

  const getWeekdaysBetween = (start: Date, end: Date): Date[] => {
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      const day = current.getUTCDay();
      if (day !== 0 && day !== 6) {
        dates.push(new Date(current));
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  };

  const weekdays = getWeekdaysBetween(startDate, endDate);

  for (const day of weekdays) {
    await prisma.schedules.create({
      data: {
        title,
        dataDate: day,
        startTime,
        endTime,
      },
    });

    console.log(`Created Schedule | "${title}" | ${day.toLocaleDateString()} ${startTime}–${endTime}`);
  }

  console.log(`✅ Seeded schedules for ${weekdays.length} days`);
};

// If you want to run directly:
// seedSchedules().then(() => prisma.$disconnect());
