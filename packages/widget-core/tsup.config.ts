import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { embed: "src/embed.ts" },
    format: ["iife"],
    globalName: "SignalEmbed",
    minify: true,
    sourcemap: false,
    dts: false,
    clean: true,
    outDir: "dist",
    platform: "browser",
    esbuildOptions(options) {
      options.jsx = "automatic";
      options.jsxImportSource = "preact";
    },
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: false,
    outDir: "dist",
    platform: "browser",
    esbuildOptions(options) {
      options.jsx = "automatic";
      options.jsxImportSource = "preact";
    },
  },
]);
