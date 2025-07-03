import { execSync } from "child_process";

const timestamp = Date.now();
const cmd = `npx prisma migrate dev --name ${timestamp}`;
execSync(cmd, { stdio: "inherit" });