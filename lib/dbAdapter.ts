import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Elige el driver adapter de Prisma según DATABASE_URL:
 *  - file:...             → better-sqlite3 (desarrollo local, cero config)
 *  - libsql: / http(s):   → libSQL / Turso (producción serverless, ej. Vercel)
 *
 * El provider del schema sigue siendo "sqlite" en ambos casos (Turso es
 * SQLite compatible), así el desarrollo local no cambia y el deploy es directo.
 */
export function createDbAdapter() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("libsql:") || url.startsWith("http://") || url.startsWith("https://")) {
    return new PrismaLibSql({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  }
  return new PrismaBetterSqlite3({ url });
}
