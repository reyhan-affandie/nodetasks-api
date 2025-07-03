import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const seedPrivileges = async () => {
  const roles = await prisma.roles.findMany();
  const features = await prisma.features.findMany();

  for (const role of roles) {
    for (const feature of features) {
      const exists = await prisma.privileges.findFirst({
        where: {
          roleId: role.id,
          featureId: feature.id,
        },
      });

      if (!exists) {
        let privilegeCreate = false;
        let privilegeRead = false;
        let privilegeUpdate = false;
        let privilegeDelete = false;

        if (role.name === "Super Admin") {
          privilegeCreate = feature.featureCreate;
          privilegeRead = feature.featureRead;
          privilegeUpdate = feature.featureUpdate;
          privilegeDelete = feature.featureDelete;
        } else if (role.name === "Admin") {
          if (["roles", "features", "privileges"].includes(feature.name)) {
            privilegeCreate = false;
            privilegeRead = true;
            privilegeUpdate = false;
            privilegeDelete = false;
          } else {
            privilegeCreate = feature.featureCreate;
            privilegeRead = feature.featureRead;
            privilegeUpdate = feature.featureUpdate;
            privilegeDelete = feature.featureDelete;
          }
        } else if (role.name === "Operator") {
          if (feature.name === "sources" || ["roles", "features", "privileges", "users"].includes(feature.name)) {
            privilegeCreate = false;
            privilegeRead = false;
            privilegeUpdate = false;
            privilegeDelete = false;
          } else {
            privilegeCreate = feature.featureCreate;
            privilegeRead = feature.featureRead;
            privilegeUpdate = feature.featureUpdate;
            privilegeDelete = feature.featureDelete;
          }
        }

        await prisma.privileges.create({
          data: {
            name: uuidv4(),
            roleId: role.id,
            featureId: feature.id,
            privilegeCreate,
            privilegeRead,
            privilegeUpdate,
            privilegeDelete,
          },
        });

        console.log(`✅ Created privileges for ${role.name} → ${feature.name}`);
      } else {
        console.log(`⏭️ Skipped privileges for ${role.name} → ${feature.name}`);
      }
    }
  }
};
