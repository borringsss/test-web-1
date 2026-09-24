import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabaseSeeded();

  try {
    const allTables = await db
      .select()
      .from(schema.tables)
      .orderBy(asc(schema.tables.sortOrder));

    return NextResponse.json({ tables: allTables });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil daftar meja admin.", details: err.message },
      { status: 500 }
    );
  }
}
