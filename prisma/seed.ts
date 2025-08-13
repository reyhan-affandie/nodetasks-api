import { seedFeatures } from "./seeds/seed.features";
import { seedRoles } from "./seeds/seed.roles";
import { seedPrivileges } from "./seeds/seed.privileges";
import { seedUsers } from "./seeds/seed.users";

import { seedClients } from "./seeds/seed.clients";

import { seedPriorities } from "./seeds/seed.priorities";
import { seedPhases } from "./seeds/seed.phases";
import { seedTasks } from "./seeds/seed.tasks";
import { seedEvents } from "./seeds/seed.events";
import { seedSchedules } from "./seeds/seed.schedules";
import { seedCurrencies } from "./seeds/seed.currencies";
import { seedStages } from "./seeds/seed.stages";
import { seedTransactions } from "./seeds/seed.transactions";

async function main() {
  await seedFeatures();
  await seedRoles();
  await seedPrivileges();
  await seedUsers();

  await seedClients();

  await seedPriorities();
  await seedPhases();
  await seedTasks();
  await seedEvents();
  await seedSchedules();
  await seedCurrencies();
  await seedStages();
  await seedTransactions();
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("🌱 All seeds complete.");
  });
