import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureDatabaseSeeded();

  const { id } = params;

  try {
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(schema.tables)
      .set(updateData)
      .where(eq(schema.tables.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Data meja berhasil diperbarui.",
      table: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memperbarui data meja.", details: err.message },
      { status: 500 }
    );
  }
}
