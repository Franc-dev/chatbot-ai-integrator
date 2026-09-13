import { readFileSync, writeFileSync } from "node:fs";

const url =
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&pgbouncer=true&connection_limit=1&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0";

for (const file of [".env", "packages/db/.env"]) {
  const next = readFileSync(file, "utf8")
    .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${url}"`)
    .replace(/^DIRECT_URL=.*$/m, `DIRECT_URL="${url}"`);
  writeFileSync(file, next);
  console.log("updated", file);
}
