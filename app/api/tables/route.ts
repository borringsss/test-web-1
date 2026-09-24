import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabaseSeeded();

  try {
    const tables = await db
      .select()
      .from(schema.tables)
      .where(eq(schema.tables.isActive, true))
      .orderBy(schema.tables.sortOrder);

    return NextResponse.json({ tables });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memuat daftar meja.", details: err.message },
      { status: 500 }
    );
  }
}
