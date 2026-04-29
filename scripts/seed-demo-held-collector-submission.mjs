#!/usr/bin/env node
/**
 * Thin wrapper — real logic lives in `apps/web/scripts/seed-held-collector-by-email.mjs`
 * (Prisma email lookup + storage seed). Run from repo root:
 *
 *   node scripts/seed-demo-held-collector-submission.mjs kimvisors@gmail.com
 *   pnpm seed:held-demo -- kimvisors@gmail.com
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2).filter((a) => a !== "--");
if (args.length === 0) {
  console.error(
    "Usage: node scripts/seed-demo-held-collector-submission.mjs <email|collectorUserId>\n" +
      "  Delegates to: pnpm --filter @opus/web exec node scripts/seed-held-collector-by-email.mjs …",
  );
  process.exit(1);
}

const r = spawnSync(
  "pnpm",
  ["--filter", "@opus/web", "exec", "node", "scripts/seed-held-collector-by-email.mjs", ...args],
  { cwd: root, stdio: "inherit", shell: true },
);
process.exit(r.status === 0 ? 0 : r.status ?? 1);
