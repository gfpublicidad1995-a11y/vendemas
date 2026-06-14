import { PrismaClient } from "@/lib/generated/prisma/client";
import { createDbAdapter } from "@/lib/dbAdapter";

// Singleton de Prisma. El adapter (SQLite local o Turso/libSQL en prod) se
// elige automáticamente según DATABASE_URL — ver lib/dbAdapter.ts.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: createDbAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
