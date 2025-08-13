/* eslint-disable @typescript-eslint/no-unused-vars */
// prisma/seeds/seedTasks.ts
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";

const prisma = new PrismaClient();

// Mirror your multer destinations for module "tasks"
const IMG_DIR = path.join(process.cwd(), "public", "images", "tasks");
const FILE_DIR = path.join(process.cwd(), "public", "files", "tasks");
const REL_IMG_BASE = "public/images/tasks";
const REL_FILE_BASE = "public/files/tasks";

const IMAGE_POOL_SIZE = 20; // how many base pics to cache
const PICSUM_SIZE = { w: 640, h: 360 }; // placeholder image size

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// --------- Images (cache from picsum, then CLONE on use) ----------
async function downloadPicsumJpg(destDir: string): Promise<string> {
  const filename = `${uuidv4()}.${Date.now()}.jpg`; // matches multer pattern
  const full = path.join(destDir, filename);
  const seed = uuidv4();
  const url = `https://picsum.photos/seed/${seed}/${PICSUM_SIZE.w}/${PICSUM_SIZE.h}`;

  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Failed to download image ${url}: ${res.status} ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(full, Buffer.from(arrayBuffer));
  return filename; // returns base image file name
}

async function buildImagePool(): Promise<string[]> {
  await ensureDir(IMG_DIR);
  const images: string[] = [];
  for (let i = 0; i < IMAGE_POOL_SIZE; i++) {
    try {
      images.push(await downloadPicsumJpg(IMG_DIR));
    } catch (e) {
      console.warn("Image download failed:", (e as Error).message);
    }
  }
  return images;
}

/** Clone a cached image to a NEW filename so each task has its own file */
async function cloneImageFromPool(baseName: string): Promise<string> {
  const ext = path.extname(baseName) || ".jpg";
  const newName = `${uuidv4()}.${Date.now()}${ext}`;
  await fs.copyFile(path.join(IMG_DIR, baseName), path.join(IMG_DIR, newName));
  return newName; // filename only
}

// --------- PDFs (fresh per task, unique text) ---------------------
function buildMinimalPdf(text: string): string {
  const content = `BT /F1 18 Tf 20 180 Td (${text.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj ET\n`;
  const length = Buffer.byteLength(content, "utf8");
  return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${length}>>stream
${content}endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000062 00000 n 
0000000113 00000 n 
0000000000 00000 n 
0000000000 00000 n 
trailer<</Root 1 0 R/Size 6>>
startxref
0
%%EOF`;
}

async function createPdfPerUse(): Promise<string> {
  await ensureDir(FILE_DIR);
  const filename = `${uuidv4()}.${Date.now()}.pdf`; // matches multer pattern
  const full = path.join(FILE_DIR, filename);
  const pdf = buildMinimalPdf(`seed pdf ${uuidv4()}`);
  await fs.writeFile(full, pdf, "utf8");
  return filename; // filename only
}

// Iterate months from Aug 2025 to Dec 2026 inclusive
function* monthRange(startYear: number, startMonth0: number, endYear: number, endMonth0: number) {
  let y = startYear,
    m = startMonth0;
  while (y < endYear || (y === endYear && m <= endMonth0)) {
    yield { year: y, month0: m };
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
}

export const seedTasks = async () => {
  const users = await prisma.users.findMany({ select: { id: true, name: true } });
  const priorities = await prisma.priorities.findMany({
    where: { name: { in: ["Low", "Medium", "High"] } },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });
  const phases = await prisma.phases.findMany({ select: { id: true, name: true } });
  const clients = await prisma.clients.findMany({ select: { id: true, name: true } });

  if (!users.length) throw new Error("Seed users first.");
  if (!priorities.length || !phases.length) throw new Error("Seed priorities and phases first.");
  if (!clients.length) throw new Error("Seed clients first.");

  // cache some base images; we will CLONE them on each use
  const imagePool = await buildImagePool();

  const rand = <T>(arr: T[]): T => arr[(Math.random() * arr.length) | 0];

  // Healthcare staff actions focused on mental-health patient flow
  const ACTIONS = [
    { makeName: (p: string) => `Verify insurance for ${p}`, makeDesc: (p: string) => `confirm payer eligibility and benefits for ${p} before the intake.` },
    { makeName: (p: string) => `Schedule intake for ${p}`, makeDesc: (p: string) => `book initial assessment and send prep instructions to ${p}.` },
    { makeName: (p: string) => `Front-desk check-in: ${p}`, makeDesc: (p: string) => `collect consent, ID, and questionnaires at arrival.` },
    { makeName: (p: string) => `Administer PHQ-9/GAD-7: ${p}`, makeDesc: (p: string) => `record baseline scores and attach screening results to chart.` },
    { makeName: (p: string) => `Prepare treatment plan for ${p}`, makeDesc: (p: string) => `draft care goals and session cadence for clinician sign-off.` },
    { makeName: (p: string) => `Therapy session notes: ${p}`, makeDesc: (p: string) => `document progress notes and interventions after session.` },
    { makeName: (p: string) => `Coordinate psychiatry consult: ${p}`, makeDesc: (p: string) => `schedule med evaluation and share assessment summary.` },
    { makeName: (p: string) => `Medication refill follow-up: ${p}`, makeDesc: (p: string) => `confirm adherence, side effects, and next appointment.` },
    { makeName: (p: string) => `Safety check-in: ${p}`, makeDesc: (p: string) => `call to assess risk level and reinforce safety plan steps.` },
    { makeName: (p: string) => `Family counseling coordination: ${p}`, makeDesc: (p: string) => `invite caregivers, share consent forms, align on goals.` },
    { makeName: (p: string) => `Submit claim/invoice: ${p}`, makeDesc: (p: string) => `compile billable items and submit claim or self-pay invoice.` },
    { makeName: (p: string) => `Payment follow-up: ${p}`, makeDesc: (p: string) => `remind about outstanding balance and offer payment options.` },
    { makeName: (p: string) => `Discharge planning: ${p}`, makeDesc: (p: string) => `prepare after-care plan and community resources for ${p}.` },
    { makeName: (p: string) => `Post-discharge check: ${p}`, makeDesc: (p: string) => `confirm stability, medication supply, and support contacts.` },
  ];

  // Aug 2025 -> Dec 2026
  for (const user of users) {
    for (const { year, month0 } of monthRange(2025, 7, 2026, 11)) {
      const taskCount = Math.floor(Math.random() * 8) + 3; // 3..10 per month
      for (let i = 0; i < taskCount; i++) {
        const client = rand(clients);
        const action = rand(ACTIONS);
        const priority = rand(priorities);
        const phase = rand(phases);

        const day = Math.floor(Math.random() * 28) + 1;
        const start = new Date(year, month0, day);
        const deadline = new Date(start);
        deadline.setDate(start.getDate() + Math.floor(Math.random() * 5) + 1);

        const name = action.makeName(client.name);
        const description = action.makeDesc(client.name);

        // Decide whether to attach image/file
        const useImg = Math.random() < 0.5 && imagePool.length > 0;
        const useFile = Math.random() < 0.5;

        // IMAGE: clone a random base image to a new name (avoid shared filename)
        const image = useImg ? `${REL_IMG_BASE}/${await cloneImageFromPool(rand(imagePool))}` : null;

        // FILE: create a fresh PDF per task (unique filename + content)
        const file = useFile ? `${REL_FILE_BASE}/${await createPdfPerUse()}` : null;

        const created = await prisma.tasks.create({
          data: {
            name,
            description,
            priorityId: priority.id,
            phaseId: phase.id,
            authorId: user.id,
            assigneeId: user.id,
            start,
            deadline,
            image,
            file,
          },
        });

        await prisma.taskhistories.create({
          data: {
            taskId: created.id,
            fromPhaseId: null,
            toPhaseId: phase.id,
            changedById: user.id,
            name: uuidv4(),
          },
        });

        console.log(
          `✅ ${user.name} | ${name} | ${start.toDateString()} → ${deadline.toDateString()} | Priority: ${priority.name} | Phase: ${phase.name} | img:${!!image} file:${!!file}`,
        );
      }
    }
  }

  console.log("✅ Tasks seeded (Aug 2025 → Dec 2026) with cloned images (unique filenames) and per-task PDFs.");
};

// run standalone
if (require.main === module) {
  seedTasks()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      prisma.$disconnect();
    });
}
