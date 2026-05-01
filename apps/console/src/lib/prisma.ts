// ISO 27001 A.9.4.2 / A.10.1.1 — Same DB as storefront; env-only DATABASE_URL.
import { PrismaClient } from "@prisma/client";

type PrismaGlobal = typeof globalThis & { __opusConsolePrisma?: PrismaClient };

const globalForPrisma = globalThis as PrismaGlobal;

export const prisma: PrismaClient =
  globalForPrisma.__opusConsolePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__opusConsolePrisma = prisma;
}
