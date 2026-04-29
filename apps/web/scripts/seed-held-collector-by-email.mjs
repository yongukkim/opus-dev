#!/usr/bin/env node
/**
 * Seeds one approved submission + collector ownership for vault collection testing.
 *
 * Pass a **collector email** (looks up `User.id` via Prisma) or a **raw Prisma user id**:
 *
 *   pnpm --filter @opus/web exec node scripts/seed-held-collector-by-email.mjs kimvisors@gmail.com
 *
 * Loads `DATABASE_URL` from `apps/web/.env` / `.env.local` (first wins for unset vars).
 * Writes under `apps/web/storage/` (same as local `pnpm dev` / standalone `apps/web` cwd).
 *
 * ISO 27001 A.14.2.1 (§1)
 *   KO: 이메일·DB 조회는 시드 목적만으로 사용하며, 스토리지 경로는 고정 패턴 하위로만 씁니다.
 *   JA: メール・DB参照はシード目的のみとし、ストレージパスは固定パターン配下のみに限定する。
 *   EN: Email/DB lookup is for seeding only; storage paths stay under fixed collector work dirs.
 */

import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const STORAGE = path.join(WEB_ROOT, "storage");
const SUBMISSIONS = path.join(STORAGE, "submissions.jsonl");
const OWNERSHIP = path.join(STORAGE, "ownership-events.jsonl");
const SOURCE_PNG = path.join(WEB_ROOT, "public/design-spec/vault-transfer-register-preview.png");
const PREVIEW_NAME = "opus-test-preview.png";
const ARTIST_ID = "artist-seed-demo-001";

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(WEB_ROOT, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function usage() {
  console.error(
    "Usage: pnpm --filter @opus/web exec node scripts/seed-held-collector-by-email.mjs <email|userId>\n" +
      "  email     — looks up users.email (case-insensitive) via Prisma (needs DATABASE_URL).\n" +
      "  userId    — Prisma User.id (cuid); DATABASE_URL optional if you only want JSONL + files.",
  );
  process.exit(1);
}

const arg = process.argv.slice(2).find((a) => a && a !== "--")?.trim();
if (!arg) usage();

loadDotEnv();

let collectorId = arg;

if (arg.includes("@")) {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to apps/web/.env or export it before running.");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: arg, mode: "insensitive" } },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      console.error(`No User row with email matching: ${arg}`);
      console.error("Hint: DATABASE_URL must point at the same DB Auth.js uses (e.g. apps/web/.env).");
      console.error("Or pass the Prisma User.id directly: node scripts/seed-held-collector-by-email.mjs <cuid>");
      process.exit(1);
    }
    collectorId = user.id;
    console.log(`Resolved ${user.email ?? arg} → user id ${collectorId} (role ${user.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

const SUBMISSION_ID = `opus-seed-held-${collectorId}`;

if (!existsSync(SOURCE_PNG)) {
  console.error("Missing source image:", SOURCE_PNG);
  process.exit(1);
}

const relDir = path.join("private", "collectors", collectorId, "works", SUBMISSION_ID);
const workDir = path.join(STORAGE, relDir);
const destPng = path.join(workDir, PREVIEW_NAME);

mkdirSync(workDir, { recursive: true });
copyFileSync(SOURCE_PNG, destPng);
const bytes = statSync(destPng).size;
const relativePath = path.join(relDir, PREVIEW_NAME).split(path.sep).join("/");

const now = new Date().toISOString();

if (existsSync(SUBMISSIONS)) {
  const existing = readFileSync(SUBMISSIONS, "utf8");
  if (existing.includes(`"id":"${SUBMISSION_ID}"`)) {
    console.log(`Submission ${SUBMISSION_ID} already in submissions.jsonl — skip append.`);
    console.log("Open /vault/collection as this collector to verify.");
    process.exit(0);
  }
}

const submission = {
  id: SUBMISSION_ID,
  createdAt: now,
  artistId: ARTIST_ID,
  artistName: "OPUS Seed Artist",
  artistNameVisibility: "public",
  nickname: "OPUS Test Artist",
  artworkTitle: "OPUS Collector Demo · 소장 테스트",
  genre: "generative",
  audienceCategory: "none",
  year: 2026,
  description: "Seeded work for collection and provenance transfer testing.",
  tags: ["demo", "seed"],
  reviewStatus: "approved",
  contentRating: "general",
  reviewedAt: now,
  reviewedBy: "seed-held-collector-by-email",
  editionMode: "limited",
  editionTotal: 10,
  initialMint: 1,
  numberingPolicy: "auto",
  lockEdition: false,
  priceJpy: 5000,
  storedFile: {
    relativePath,
    filename: PREVIEW_NAME,
    mime: "image/png",
    bytes,
  },
};

const ownership = {
  submissionId: SUBMISSION_ID,
  ownerType: "collector",
  ownerId: collectorId,
  updatedAt: now,
};

mkdirSync(STORAGE, { recursive: true });
appendFileSync(SUBMISSIONS, `${JSON.stringify(submission)}\n`, { encoding: "utf8" });
appendFileSync(OWNERSHIP, `${JSON.stringify(ownership)}\n`, { encoding: "utf8" });

console.log("Wrote:");
console.log(" ", SUBMISSIONS);
console.log(" ", OWNERSHIP);
console.log(" ", destPng);
console.log(`\nSubmission id: ${SUBMISSION_ID}`);
console.log("Next: log in as that collector → /ko/vault/collection → transfer register if needed.");
