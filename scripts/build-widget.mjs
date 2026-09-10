import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "widget", "src", "widget.js");
const outDir = path.join(root, "public");
const outFile = path.join(outDir, "widget.js");

await mkdir(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [entry],
  outfile: outFile,
  bundle: true,
  minify: true,
  target: ["es2018"],
  format: "iife",
});

const src = await readFile(outFile, "utf8");
await writeFile(
  outFile,
  `/* JokoHub widget — Joinware */\n${src}\n`,
  "utf8"
);

// Ensure placeholder mark exists
try {
  await copyFile(
    path.join(root, "public", "file.svg"),
    path.join(root, "public", "mark.svg")
  );
} catch {
  /* optional */
}

console.log("Built public/widget.js");
