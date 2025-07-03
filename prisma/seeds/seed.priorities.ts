import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const seedPriorities = async () => {
  const priorities = [
    {
      name: "low",
      name_en: "Low",
      name_id: "Rendah",
      name_ph: "Mababa",
    },
    {
      name: "medium",
      name_en: "Medium",
      name_id: "Sedang",
      name_ph: "Katamtaman",
    },
    {
      name: "high",
      name_en: "High",
      name_id: "Tinggi",
      name_ph: "Mataas",
    },
  ];

  for (const priority of priorities) {
    const found = await prisma.priorities.findUnique({
      where: { name: priority.name },
    });

    if (!found) {
      await prisma.priorities.create({ data: priority });
      console.log(`✅ Created priority: ${priority.name}`);
    } else {
      console.log(`⏭️ Skipped priority (exists): ${priority.name}`);
    }
  }
};
