// prisma/seeds/seedTransactions.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const START = new Date("2025-08-01T00:00:00Z");
const END = new Date("2026-12-31T23:59:59Z");

// 200..300 transactions
const COUNT = 200 + Math.floor(Math.random() * 101);

const MH_NOTES = [
  "Intake evaluation",
  "CBT session package",
  "Medication management consult",
  "Telehealth follow-up",
  "Family therapy session",
  "Couples counseling",
  "Psychological assessment",
  "Group therapy program",
  "Crisis intervention session",
  "Trauma-focused therapy",
];

const COUNTRY_TO_CCY: Record<string, string> = {
  "United States": "USD",
  Indonesia: "IDR",
  Philippines: "PHP",
  Germany: "EUR",
  Netherlands: "EUR",
  Australia: "AUD",
  Canada: "CAD",
  "United Kingdom": "GBP",
};

function rand<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randDate(start: Date, end: Date) {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t);
}
function toMinor(major: number) {
  return BigInt(Math.round(major * 100));
}

// currency-specific realistic ranges (major units)
function randomAmountMajor(ccy: string): number {
  switch (ccy) {
    case "USD":
      return randInt(80, 250);
    case "GBP":
      return randInt(60, 200);
    case "EUR":
      return randInt(60, 220);
    case "AUD":
      return randInt(90, 250);
    case "CAD":
      return randInt(90, 220);
    case "PHP":
      return randInt(800, 4000);
    case "IDR":
      return randInt(150_000, 3_000_000);
    default:
      return randInt(80, 250);
  }
}

type StageWeight = { id: number; name: string; weight: number };

const WEIGHTS: Record<string, number> = {
  registration: 12,
  eligibility_check: 10,
  appointment_scheduled: 9,
  checked_in: 8,
  assessment_billed: 7,
  plan_consented: 6,
  active_billing: 6,
  invoiced: 8,
  paid: 7,
  cancelled: 2,
  no_show: 3,
  bad_debt: 2,
};

function buildStageWeights(stages: { id: number; name: string }[]): StageWeight[] {
  return stages.map((s) => ({
    ...s,
    weight: WEIGHTS[s.name] ?? 1, // default to 1 if not found
  }));
}

function pickWeighted(weights: StageWeight[]): StageWeight {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    if ((r -= w.weight) <= 0) return w;
  }
  return weights[weights.length - 1];
}

export const seedTransactions = async () => {
  const users = await prisma.users.findMany({ select: { id: true } });
  if (users.length === 0) throw new Error("No users found. Seed users first.");

  const clients = await prisma.clients.findMany({
    select: { id: true, country: true, city: true },
  });
  if (clients.length === 0) throw new Error("No clients found. Seed clients first.");

  const stages = await prisma.stages.findMany({
    select: { id: true, name: true },
  });
  if (stages.length === 0) throw new Error("No stages found. Run seedStages first.");

  const weights = buildStageWeights(stages);

  const currencies = await prisma.currencies.findMany({ select: { id: true, name: true } });
  if (currencies.length === 0) throw new Error("No currencies found. Seed currencies first.");
  const ccyByISO = new Map(currencies.map((c) => [c.name, c.id]));

  const shouldHaveAmount = (stageName: string | undefined) => stageName === "invoiced" || stageName === "paid" || stageName === "bad_debt";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = [];
  for (let i = 0; i < COUNT; i++) {
    const userId = rand(users).id;
    const client = rand(clients);

    const iso = COUNTRY_TO_CCY[client.country] || "USD";
    const currencyId = ccyByISO.get(iso) ?? rand(currencies).id;
    const chosen = pickWeighted(weights);
    const stageId = chosen.id;
    const stageName = chosen.name;

    const transactionDate = randDate(START, END);
    const notes = `${rand(MH_NOTES)} - ${client.city}`;
    const amount = shouldHaveAmount(stageName) ? toMinor(randomAmountMajor(iso)) : null;
    data.push({
      userId,
      clientId: client.id,
      stageId,
      currencyId,
      transactionDate,
      amount,
      notes,
      sheet: null,
      tab: null,
      tabname: null,
      sheetrow: null,
    });
  }

  await prisma.transactions.createMany({ data, skipDuplicates: true });
  console.log(`✅ Transactions seeded: ${data.length} (from ${START.toISOString().slice(0, 10)} to ${END.toISOString().slice(0, 10)})`);
};

// run standalone
if (require.main === module) {
  seedTransactions()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
