import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // If DATABASE_URL is missing (fresh clone), Prisma calls will fail at
    // query time — API routes catch that and fall back to live upstream fetch.
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
