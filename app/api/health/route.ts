import { NextResponse } from "next/server";
import { globalForDb, ensureDbReady } from "@/lib/db";
import { isInitialized, lastInitError, ensureDatabaseSeeded } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabaseSeeded();

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL;

  // Mask database URL for safety
  let maskedUrl = "NOT_CONFIGURED";
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      maskedUrl = `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
    } catch {
      maskedUrl = "CONFIGURED_BUT_INVALID_URL_FORMAT";
    }
  }

  return NextResponse.json({
    status: "ok",
    environment: {
      isVercel: Boolean(process.env.VERCEL),
      nodeEnv: process.env.NODE_ENV,
    },
    envKeysDetected: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      BETTER_AUTH_SECRET: Boolean(process.env.BETTER_AUTH_SECRET),
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "NOT_SET",
    },
    database: {
      isPg: Boolean(globalForDb.isPg),
      maskedUrl,
      isInitialized,
      lastInitError,
    },
  });
}
