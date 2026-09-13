import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";

const enc = randomBytes(32).toString("base64");
const auth = randomBytes(24).toString("hex");
const job = randomBytes(24).toString("hex");
const text = [
  "DATABASE_URL=prisma+postgres://localhost:51213/?api_key=dev",
  "DIRECT_URL=prisma+postgres://localhost:51213/?api_key=dev",
  `BETTER_AUTH_SECRET=${auth}`,
  "BETTER_AUTH_URL=http://localhost:3000",
  "NEXT_PUBLIC_APP_URL=http://localhost:3000",
  `ENCRYPTION_KEY=${enc}`,
  `JOB_DRAIN_SECRET=${job}`,
  "",
].join("\n");

writeFileSync(".env", text);
writeFileSync("packages/db/.env", text);
console.log("wrote .env");
