import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const seedPhases = async () => {
  const phases = [
    {
      name: "to_do",
      name_en: "To Do",
      name_id: "Dikerjakan",
      name_ph: "Gagawin",
    },
    {
      name: "in_progress",
      name_en: "In Progress",
      name_id: "Sedang Berjalan",
      name_ph: "Isinasagawa",
    },
    {
      name: "in_review",
      name_en: "In Review",
      name_id: "Ditinjau",
      name_ph: "Sinusuri",
    },
    {
      name: "closed",
      name_en: "Closed",
      name_id: "Selesai",
      name_ph: "Sarado",
    },
    {
      name: "cancelled",
      name_en: "Cancelled",
      name_id: "Dibatalkan",
      name_ph: "Kanselado",
    },
  ];

  for (const phase of phases) {
    const found = await prisma.phases.findUnique({
      where: { name: phase.name },
    });

    if (!found) {
      await prisma.phases.create({ data: phase });
      console.log(`✅ Created phase: ${phase.name}`);
    } else {
      console.log(`⏭️ Skipped phase (exists): ${phase.name}`);
    }
  }
};
