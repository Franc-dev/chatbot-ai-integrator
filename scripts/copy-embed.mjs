import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "packages/widget-core/dist");
const destDir = join(process.cwd(), "apps/web/public");
mkdirSync(destDir, { recursive: true });
if (!existsSync(dist)) process.exit(0);
const file = readdirSync(dist).find((f) => f.startsWith("embed") && f.endsWith(".js") && !f.includes("d.ts"));
if (!file) process.exit(0);
copyFileSync(join(dist, file), join(destDir, "embed.js"));
console.log("copied", file, "-> public/embed.js");
