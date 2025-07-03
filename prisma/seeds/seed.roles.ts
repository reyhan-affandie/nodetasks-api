// prisma/seeds/settings.seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const seedRoles = async () => {
  const roles = [
    {
      name: "Super Admin",
      description: "A super user that can do everything",
      status: true,
    },
    {
      name: "Admin",
      description: "An admin user that can do everything except RBAC modules",
      status: true,
    },
    {
      name: "Operator",
      description: "An Operator that can`t access RBAC and Users modules",
      status: true,
    },
  ];

  for (const role of roles) {
    const found = await prisma.roles.findUnique({
      where: { name: role.name },
    });

    if (!found) {
      await prisma.roles.create({ data: role });
      console.log(`✅ Created: ${role.name}`);
    } else {
      console.log(`⏭️ Skipped (exists): ${role.name}`);
    }
  }
};
