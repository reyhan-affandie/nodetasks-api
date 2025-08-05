import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const seedFeatures = async () => {
  const features = [
    {
      name: "dashboard",
      description: "Overview panel only. No action needed.",
      featureCreate: false,
      featureRead: true,
      featureUpdate: false,
      featureDelete: false,
    },
    {
      name: "users",
      description: "Manage system users",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "roles",
      description: "Manage access roles",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "events",
      description: "Events Management",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "features",
      description: "Manage features",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "privileges",
      description: "Set feature access per role",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "phases",
      description: "Task Phases",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "priorities",
      description: "Task Priorities (Low, Medium, High)",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "schedules",
      description: "Schedules",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "tasks",
      description: "Tasks Management",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "taskhistories",
      description: "History for Task phase/activity changes",
      featureCreate: true,
      featureRead: true,
      featureUpdate: false,
      featureDelete: true,
    },
  ];

  for (const feature of features) {
    const found = await prisma.features.findUnique({
      where: { name: feature.name },
    });

    if (!found) {
      await prisma.features.create({ data: feature });
      console.log(`✅ Created feature: ${feature.name}`);
    } else {
      console.log(`⏭️ Skipped feature (exists): ${feature.name}`);
    }
  }
};
