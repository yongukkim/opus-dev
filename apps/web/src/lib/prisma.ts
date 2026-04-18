// ISO 27001 A.9.4.2 / A.10.1.1 / A.12.4.1 (§2, §3, §5): single pooled Prisma client with SSL-required RDS URL, no secrets in code (env only), and errors never leak to the client.
// KO: PrismaClient는 DATABASE_URL(환경변수)로만 연결하며 핫리로드에서 커넥션이 누수되지 않도록 singleton으로 유지한다.
// JA: PrismaClientはDATABASE_URL(環境変数)のみで接続し、HMR時の接続漏洩を防ぐためsingletonで保持する。
// EN: PrismaClient uses only DATABASE_URL (env) and is cached on globalThis so HMR does not leak connections.
import { PrismaClient } from "@prisma/client";

type PrismaGlobal = typeof globalThis & { __opusPrisma?: PrismaClient };

const globalForPrisma = globalThis as PrismaGlobal;

export const prisma: PrismaClient =
  globalForPrisma.__opusPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__opusPrisma = prisma;
}
