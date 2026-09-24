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
    if (body.slug !== undefined) updateData.slug = body.slug.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags.join(", ") : body.tags;
    }
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(schema.menuItems)
      .set(updateData)
      .where(eq(schema.menuItems.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Menu berhasil diperbarui.",
      item: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memperbarui menu.", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureDatabaseSeeded();

  const { id } = params;

  try {
    await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));

    return NextResponse.json({
      success: true,
      message: "Menu berhasil dihapus dari sistem.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal menghapus menu.", details: err.message },
      { status: 500 }
    );
  }
}
