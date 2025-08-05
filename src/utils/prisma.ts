import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
//type PrismaModels = keyof Omit<PrismaClient, "$connect" | "$disconnect" | "$executeRaw" | "$queryRaw" | "$transaction" | "$use">;
export type PrismaModels = keyof Pick<
  PrismaClient,
  "blacklists" | "events" | "features" | "phases" | "priorities" | "privileges" | "roles" | "schedules" | "tasks" | "taskhistories" | "users"
>;

//export const getPrismaModel = <T extends PrismaModels>(modelName: T) => prisma[modelName];
export const getPrismaModel = <T extends PrismaModels>(modelName: T): PrismaClient[T] => {
  return prisma[modelName];
};
export default prisma;
