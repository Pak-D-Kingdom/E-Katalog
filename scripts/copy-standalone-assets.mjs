import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = resolve(projectRoot, ".next", "standalone");

mkdirSync(resolve(standaloneDir, ".next"), { recursive: true });
cpSync(resolve(projectRoot, "public"), resolve(standaloneDir, "public"), { recursive: true });
cpSync(
  resolve(projectRoot, ".next", "static"),
  resolve(standaloneDir, ".next", "static"),
  { recursive: true }
);
