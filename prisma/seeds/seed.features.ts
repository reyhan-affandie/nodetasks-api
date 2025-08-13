import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const seedFeatures = async () => {
  const features = [
    // Not a model, but keep Dashboard first
    {
      name: "dashboard",
      description: "Overview panel only. No action needed.",
      featureCreate: false,
      featureRead: true,
      featureUpdate: false,
      featureDelete: false,
    },

    // ----- Core (order per prisma) -----
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
      name: "roles",
      description: "Manage access roles",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "users",
      description: "Manage system users",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },

    // ----- TRANSACTIONS block (as in prisma section order) -----
    {
      name: "clients",
      description: "Manage clients/organizations",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "currencies",
      description: "Manage currencies and symbols",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "stages",
      description: "Transaction stages / pipeline columns",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "transactions",
      description: "Transactions pipeline and records",
      featureCreate: true,
      featureRead: true,
      featureUpdate: true,
      featureDelete: true,
    },
    {
      name: "transactionhistories",
      description: "History for Transaction stage/client/currency changes",
      featureCreate: true,
      featureRead: true,
      featureUpdate: false,
      featureDelete: true,
    },

    // ----- EVENTS -----
    {
      name: "events",
      description: "Events Management",
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

    // ----- TASKS block -----
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
  ] as const;

  for (const feature of features) {
    const found = await prisma.features.findUnique({ where: { name: feature.name } });
    if (!found) {
      await prisma.features.create({ data: { ...feature } });
      console.log(`✅ Created feature: ${feature.name}`);
    } else {
      console.log(`⏭️ Skipped feature (exists): ${feature.name}`);
    }
  }
};
