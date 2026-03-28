import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "public", "sample-artworks");
const ATTR = path.join(ROOT, "ATTRIBUTION.md");

const IDS = [
  "HzI3vf8wUwE",
  "H2Z8A4af4Zo",
  "4MksxMVbRrA",
  "h7EvXCadies",
  "HI0GShPQegc",
  "a5RK_uk5Ej0",
  "RBqC7kQoMIg",
  "_sZ7R0C_xKY",
  "QVRHf8Gc9Pk",
  "zl8hQxXZCeI",
  "aVFTleL-L0g",
  "dPn-PAuwYss",
  "dKB6EJFLUaA",
  "UG2Vqz5Q000",
  "nuRF1oaw-Pg",
  "GB1sPyY2YpQ",
  "Bqrr9yrKD1o",
  "KC5btjnw0_s",
  "DQpHtE5WY-U",
  "4hYSTQkZMNQ",
];

function pickMeta(html, property) {
  const re = new RegExp(
    `<meta\\s+property=\\"${property}\\"\\s+content=\\"([^\\"]+)\\"\\s*/?>`,
    "i",
  );
  const m = html.match(re);
  return m?.[1] ?? null;
}

function pickAuthorFromLdJson(html) {
  const m = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]);
    const author = Array.isArray(data?.author) ? data.author[0] : data?.author;
    if (author && typeof author === "object") {
      return { name: author.name ?? null, url: author.url ?? null };
    }
  } catch {
    // ignore
  }
  return null;
}

function normalizeImageUrl(url) {
  // Keep Unsplash CDN URL but constrain size/quality for repo.
  try {
    const u = new URL(url);
    if (!u.hostname.includes("images.unsplash.com")) return url;
    u.searchParams.set("w", "1800");
    u.searchParams.set("q", "80");
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("fm", "jpg");
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "OPUS sample downloader (dev)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "OPUS sample downloader (dev)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function toRow({ file, source, author, license, downloaded_at }) {
  return `| ${file} | ${source} | ${author} | ${license} | ${downloaded_at} |`;
}

async function main() {
  await mkdir(ROOT, { recursive: true });

  const downloadedAt = new Date().toISOString().slice(0, 10);
  const entries = [];

  for (let i = 0; i < IDS.length; i++) {
    const id = IDS[i];
    const pageUrl = `https://unsplash.com/photos/${id}`;
    process.stdout.write(`[${i + 1}/${IDS.length}] ${pageUrl}\n`);

    const html = await fetchText(pageUrl);
    const ogImage = pickMeta(html, "og:image");
    if (!ogImage) throw new Error(`No og:image found for ${pageUrl}`);

    const author = pickAuthorFromLdJson(html);
    const authorName = author?.name ?? "Unknown";
    const authorUrl = author?.url ? author.url : "";

    const imgUrl = normalizeImageUrl(ogImage);
    const buf = await fetchBuffer(imgUrl);

    const file = `unsplash_${String(i + 1).padStart(2, "0")}_${id}.jpg`;
    await writeFile(path.join(ROOT, file), buf);

    entries.push({
      file,
      source: `[unsplash](${pageUrl})`,
      author: authorUrl ? `[${authorName}](${authorUrl})` : authorName,
      license: "Unsplash License",
      downloaded_at: downloadedAt,
    });
  }

  const existing = await readFile(ATTR, "utf8").catch(() => "");
  const header =
    existing.trim().length > 0
      ? existing.split("\n").slice(0, existing.split("\n").findIndex((l) => l.startsWith("| file |")) + 2).join("\n")
      : `# Sample artworks attribution (OPUS)\n\n| file | source | author | license | downloaded_at |\n|---|---|---|---|---|`;

  const lines = [header, "", ...entries.map(toRow), ""].join("\n");
  await writeFile(ATTR, lines);

  process.stdout.write(`\nSaved ${entries.length} images to ${ROOT}\nUpdated ${ATTR}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

