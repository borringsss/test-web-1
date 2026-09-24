import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabaseSeeded();

  try {
    const items = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.isActive, true))
      .orderBy(schema.menuItems.sortOrder);

    // Format tags from comma-separated string to array
    const formatted = (items as (typeof schema.menuItems.$inferSelect)[]).map((item) => ({
      ...item,
      tags: item.tags ? item.tags.split(",").map((t: string) => t.trim()) : [],
    }));

    return NextResponse.json({ menu: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memuat daftar menu.", details: err.message },
      { status: 500 }
    );
  }
}
