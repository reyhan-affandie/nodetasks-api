import dotenv from "dotenv";
import prisma from "./src/utils/prisma";

dotenv.config({ path: ".env.test" });

// Mock nodemailer transport dynamically
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((mailOptions) => {
      return Promise.resolve({ accepted: [mailOptions.to], rejected: [] });
    }),
  })),
}));

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterEach(async () => {
  // Clear all tables after each test
  const tablenames = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = DATABASE();
  `;

  for (const { table_name } of tablenames) {
    if (table_name !== "_prisma_migrations") {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table_name};`);
    }
  }
});

afterAll(async () => {
  // Clean up after all tests
  await prisma.$disconnect();
});
