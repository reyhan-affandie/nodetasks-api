// prisma/seeds/seedCurrencies.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CURRENCIES = [
  { name: "USD", symbol: "$" }, // United States
  { name: "IDR", symbol: "Rp" }, // Indonesia
  { name: "PHP", symbol: "₱" }, // Philippines
  { name: "EUR", symbol: "€" }, // Germany, Netherlands
  { name: "AUD", symbol: "$" }, // Australia
  { name: "CAD", symbol: "$" }, // Canada
  { name: "GBP", symbol: "£" }, // United Kingdom
];

export const seedCurrencies = async () => {
  for (const c of CURRENCIES) {
    const existing = await prisma.currencies.findFirst({ where: { name: c.name } });
    if (existing) {
      await prisma.currencies.update({ where: { id: existing.id }, data: c });
    } else {
      await prisma.currencies.create({ data: c });
    }
  }
  console.log("✅ Currencies seeded:", CURRENCIES.map((c) => `${c.name} ${c.symbol}`).join(", "));
};

// run standalone
if (require.main === module) {
  seedCurrencies()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      prisma.$disconnect();
    });
}
