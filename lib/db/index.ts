import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";
import path from "path";
import fs from "fs";

// Global singleton to prevent connection exhaustion in Next.js hot reload
const globalForDb = globalThis as unknown as {
  db: any;
  pgClient: any;
  isPg: boolean;
};

function initDb() {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes("placeholder")) {
    const client = postgres(databaseUrl, {
      max: 10,
      prepare: false,
    });
    globalForDb.pgClient = client;
    globalForDb.isPg = true;
    globalForDb.db = drizzlePg(client, { schema });
    return globalForDb.db;
  }

  // Zero-config embedded PostgreSQL engine (PGlite)
  // Persists data in a local folder '.pglite_data' in the project root
  const dbPath = path.join(process.cwd(), ".pglite_data");
  
  // Cleanup stale postmaster.pid lock on Windows if process crashed
  try {
    const pidFile = path.join(dbPath, "postmaster.pid");
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  } catch {}

  const pgliteInstance = new PGlite(dbPath);
  globalForDb.pgClient = pgliteInstance;
  globalForDb.isPg = false;
  globalForDb.db = drizzlePglite(pgliteInstance, { schema });
  return globalForDb.db;
}

export const db = initDb();
export { schema };

export async function ensureDbReady() {
  if (!globalForDb.isPg && globalForDb.pgClient?.waitReady) {
    await globalForDb.pgClient.waitReady;
  }
}

export async function executeRawSql(rawSql: string) {
  await ensureDbReady();
  if (globalForDb.isPg && globalForDb.pgClient) {
    await globalForDb.pgClient.unsafe(rawSql);
  } else if (globalForDb.pgClient) {
    await globalForDb.pgClient.exec(rawSql);
  }
}
