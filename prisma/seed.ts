import { seedFeatures } from "./seeds/seed.features";
import { seedRoles } from "./seeds/seed.roles";
import { seedPrivileges } from "./seeds/seed.privileges";
import { seedUsers } from "./seeds/seed.users";

import { seedPriorities } from "./seeds/seed.priorities";
import { seedPhases } from "./seeds/seed.phases";
import { seedTasks } from "./seeds/seed.tasks";

async function main() {
  await seedFeatures();
  await seedRoles();
  await seedPrivileges();
  const { admin: author, user: assignee } = await seedUsers(); 

  await seedPriorities();
  await seedPhases();
  await seedTasks({ author, assignee });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("🌱 All seeds complete.");
  });
