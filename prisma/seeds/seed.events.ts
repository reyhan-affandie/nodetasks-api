import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const seedEvents = async () => {
  const users = await prisma.users.findMany();

  const sampleTitles = [
    "Team Standup Meeting",
    "Project Planning",
    "Code Review Session",
    "Client Demo",
    "Bug Bash",
    "Design Review",
    "Sprint Retrospective",
    "Database Optimization",
    "API Testing",
    "Deployment Review",
  ];

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

  for (const user of users) {
    const eventDates: Record<string, { startHour: number; endHour: number }[]> = {};

    for (const day of weekdays) {
      const eventsPerDay = Math.floor(Math.random() * 8) + 3; // 3–10 events daily
      const dateKey = day.toISOString().split("T")[0];
      if (!eventDates[dateKey]) eventDates[dateKey] = [];

      for (let i = 0; i < eventsPerDay; i++) {
        const startHour = 9 + Math.floor(Math.random() * 8); // Between 09:00–18:00
        const duration = Math.floor(Math.random() * 4) + 1; // 1 to 4 hours
        const endHour = Math.min(startHour + duration, 18); // Still max at 18:00

        // Skip if it overlaps 12:00–13:00
        if (startHour < 13 && endHour > 12) continue;

        const startTime = `${startHour.toString().padStart(2, "0")}:00`;
        const endTime = `${endHour.toString().padStart(2, "0")}:00`;

        eventDates[dateKey].push({ startHour, endHour });

        const title = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
        const status = Math.random() < 0.5; // Random true/false

        await prisma.events.create({
          data: {
            userId: user.id,
            title,
            dataDate: day,
            startTime,
            endTime,
            status,
          },
        });

        console.log(`Created Event for ${user.name} | "${title}" | ${day.toLocaleDateString()} ${startTime}–${endTime}`);
      }
    }
  }

  console.log(`✅ Seeded events for ${users.length} users`);
};
