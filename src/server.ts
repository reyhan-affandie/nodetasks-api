import http from "http";
import app from "./app";
import { APP_ORIGIN, PORT } from "@/constants/env";
import prisma from "@/utils/prisma";

prisma
  .$connect()
  .then(() => {
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 HTTP Server running at ${APP_ORIGIN}`);
    });
  })
  .catch((error) => {
    console.error("❌ Prisma connection failed:", error);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  console.log("🧹 SIGINT: Disconnecting Prisma...");
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("Error during disconnect:", err);
  } finally {
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  console.log("🧹 SIGTERM: Disconnecting Prisma...");
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("Error during disconnect:", err);
  } finally {
    process.exit(0);
  }
});