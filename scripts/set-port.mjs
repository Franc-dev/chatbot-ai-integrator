import { readFileSync, writeFileSync } from "node:fs";

for (const file of [".env", "packages/db/.env", "apps/web/.env.local"]) {
  writeFileSync(
    file,
    readFileSync(file, "utf8")
      .replaceAll("http://localhost:3000", "http://localhost:3001"),
  );
}
console.log("ports -> 3001");
