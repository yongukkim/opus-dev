import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AUX_LEDGER_FILES } from "@/lib/ledgerStores";

export type UserPaymentMethodRecord = {
  userId: string;
  updatedAt: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

const MAX_NAME = 120;
const MAX_BRAND = 32;

const ALLOWED_BRANDS = new Set([
  "visa",
  "mastercard",
  "amex",
  "jcb",
  "diners",
  "unionpay",
  "other",
]);

function normalizeCardholder(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_NAME);
}

function normalizeBrand(input: unknown): string {
  if (typeof input !== "string") return "";
  const b = input.trim().toLowerCase().slice(0, MAX_BRAND);
  return ALLOWED_BRANDS.has(b) ? b : "";
}

function normalizeLast4(input: unknown): string {
  if (typeof input !== "string") return "";
  const d = input.replace(/\D/g, "");
  return d.length === 4 ? d : "";
}

function parseLine(line: string): UserPaymentMethodRecord | null {
  try {
    const parsed = JSON.parse(line) as Partial<UserPaymentMethodRecord>;
    const userId = typeof parsed.userId === "string" ? parsed.userId.trim() : "";
    if (!userId) return null;
    const last4 = normalizeLast4(parsed.last4);
    const brand = normalizeBrand(parsed.brand);
    const expMonth = typeof parsed.expMonth === "number" ? parsed.expMonth : Number.NaN;
    const expYear = typeof parsed.expYear === "number" ? parsed.expYear : Number.NaN;
    if (!last4 || !brand || !Number.isFinite(expMonth) || expMonth < 1 || expMonth > 12) return null;
    if (!Number.isFinite(expYear) || expYear < 2000 || expYear > 2100) return null;
    return {
      userId,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt
          : new Date().toISOString(),
      cardholderName: normalizeCardholder(parsed.cardholderName),
      brand,
      last4,
      expMonth,
      expYear,
    };
  } catch {
    return null;
  }
}

async function readAll(): Promise<UserPaymentMethodRecord[]> {
  try {
    const raw = await readFile(AUX_LEDGER_FILES.userPaymentMethods, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseLine)
      .filter((row): row is UserPaymentMethodRecord => row !== null);
  } catch {
    return [];
  }
}

export async function getUserPaymentMethod(userId: string): Promise<UserPaymentMethodRecord | null> {
  const id = userId.trim();
  if (!id) return null;
  const rows = await readAll();
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i]!.userId === id) return rows[i]!;
  }
  return null;
}

export async function saveUserPaymentMethod(input: {
  userId: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}): Promise<UserPaymentMethodRecord> {
  const userId = input.userId.trim();
  if (!userId) throw new Error("invalid_user_id");
  const cardholderName = normalizeCardholder(input.cardholderName);
  const brand = normalizeBrand(input.brand);
  const last4 = normalizeLast4(input.last4);
  const expMonth = input.expMonth;
  const expYear = input.expYear;
  if (!cardholderName || !brand || !last4) throw new Error("invalid_payment_fields");
  if (!Number.isFinite(expMonth) || expMonth < 1 || expMonth > 12) throw new Error("invalid_exp_month");
  if (!Number.isFinite(expYear) || expYear < 2000 || expYear > 2100) throw new Error("invalid_exp_year");

  const next: UserPaymentMethodRecord = {
    userId,
    updatedAt: new Date().toISOString(),
    cardholderName,
    brand,
    last4,
    expMonth,
    expYear,
  };
  await mkdir(path.dirname(AUX_LEDGER_FILES.userPaymentMethods), { recursive: true });
  await writeFile(AUX_LEDGER_FILES.userPaymentMethods, `${JSON.stringify(next)}\n`, {
    flag: "a",
    encoding: "utf8",
  });
  return next;
}
