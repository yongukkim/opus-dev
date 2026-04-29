#!/usr/bin/env node
/**
 * Seeds one approved submission + ownership row so a collector sees it under
 * My Page → Collection (`/vault/collection`) and can open transfer registration.
 *
 * Run from the **repository root**:
 *   node scripts/seed-demo-held-collector-submission.mjs <collectorPrismaUserId>
 *
 * Example (replace with your Auth.js / Prisma `User.id` after login):
 *   node scripts/seed-demo-held-collector-submission.mjs clxxxxxxxxxxxxxxxxxx
 *
 * Storage layout matches `apps/web` at dev time (`process.cwd()/storage` when
 * `pnpm dev` runs from `apps/web`). For Docker/EC2 standalone, copy the same
 * tree under `/app/apps/web/storage` (see `ledgerStores.STORAGE_ROOT`) and run
 * `scripts/ec2-chown-web-storage.sh` if files were created as root.
 *
 * ISO 27001 A.14.2.1 (§1)
 *   KO: 인자로 받은 내부 사용자 ID만 소유권 이벤트에 기록하며, 경로는 고정 하위 디렉터리만 사용합니다.
 *   JA: 引数の内部ユーザーIDのみを所有イベントに記録し、パスは固定サブディレクトリのみを使います。
 *   EN: Only the passed internal user id is written to ownership; paths stay under fixed subdirs.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WEB_STORAGE = path.join(REPO_ROOT, "apps/web", "storage");
const SUBMISSIONS = path.join(WEB_STORAGE, "submissions.jsonl");
const OWNERSHIP = path.join(WEB_STORAGE, "ownership-events.jsonl");
const SUBMISSION_ID = "opus-demo-held-2026-001";
const ARTIST_ID = "artist-seed-demo-001";
const PREVIEW_NAME = "opus-test-preview.png";
const SOURCE_PNG = path.join(
  REPO_ROOT,
  "apps/web/public/design-spec/vault-transfer-register-preview.png",
);

function usage() {
  console.error(
    "Usage: node scripts/seed-demo-held-collector-submission.mjs <collectorPrismaUserId>\n" +
      "  collectorPrismaUserId = Auth.js session user id (Prisma User.id) for the logged-in collector.",
  );
  process.exit(1);
}

const collectorId = process.argv[2]?.trim();
if (!collectorId || collectorId.length < 8) usage();

if (!existsSync(SOURCE_PNG)) {
  console.error("Missing source image:", SOURCE_PNG);
  process.exit(1);
}

const relDir = path.join("private", "collectors", collectorId, "works", SUBMISSION_ID);
const workDir = path.join(WEB_STORAGE, relDir);
const destPng = path.join(workDir, PREVIEW_NAME);

mkdirSync(workDir, { recursive: true });
copyFileSync(SOURCE_PNG, destPng);
const bytes = statSync(destPng).size;
const relativePath = path.join(relDir, PREVIEW_NAME).split(path.sep).join("/");

const now = new Date().toISOString();

if (existsSync(SUBMISSIONS)) {
  const existing = readFileSync(SUBMISSIONS, "utf8");
  if (existing.includes(`"id":"${SUBMISSION_ID}"`) || existing.includes(`"id": "${SUBMISSION_ID}"`)) {
    console.log(`Submission ${SUBMISSION_ID} already present in submissions.jsonl — skipping append.`);
    console.log("If collection still empty, verify ownership-events.jsonl has a collector row for this id.");
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
  reviewedBy: "seed-demo-held-collector-submission",
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

mkdirSync(WEB_STORAGE, { recursive: true });
appendFileSync(SUBMISSIONS, `${JSON.stringify(submission)}\n`, { encoding: "utf8" });
appendFileSync(OWNERSHIP, `${JSON.stringify(ownership)}\n`, { encoding: "utf8" });

console.log("Wrote:");
console.log(" ", SUBMISSIONS);
console.log(" ", OWNERSHIP);
console.log(" ", destPng);
console.log("\nNext: log in as that collector, open /ko/vault/collection (or your locale), then transfer register for this work.");
console.log(`  submissionId=${SUBMISSION_ID}`);
