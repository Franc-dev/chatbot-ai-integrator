import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const file = new URL("../dist/embed.global.js", import.meta.url);
const buf = readFileSync(file);
const gz = gzipSync(buf).byteLength;
const limit = 40 * 1024;
console.log(`embed.js gzip: ${gz} bytes (limit ${limit})`);
if (gz > limit) {
  process.exit(1);
}
