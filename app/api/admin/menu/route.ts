import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { asc } from "drizzle-orm";

export async function GET() {
  await ensureDatabaseSeeded();

  try {
    const items = await db
      .select()
      .from(schema.menuItems)
      .orderBy(asc(schema.menuItems.sortOrder));

    const formatted = (items as (typeof schema.menuItems.$inferSelect)[]).map((item) => ({
      ...item,
      tags: item.tags ? item.tags.split(",").map((t: string) => t.trim()) : [],
    }));

    return NextResponse.json({ menu: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil daftar menu admin.", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await ensureDatabaseSeeded();

  try {
    const body = await req.json();
    const { name, slug, description, price, imageUrl, isActive, tags } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Nama pizza dan harga wajib diisi." },
        { status: 400 }
      );
    }

    const id = `menu-${Date.now()}`;
    const cleanSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
    const tagsString = Array.isArray(tags) ? tags.join(", ") : tags || "";

    const [newItem] = await db
      .insert(schema.menuItems)
      .values({
        id,
        name: name.trim(),
        slug: cleanSlug,
        description: description ? description.trim() : "",
        price: Number(price),
        imageUrl:
          imageUrl ||
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: 99,
        tags: tagsString,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Menu pizza berhasil ditambahkan.",
        item: {
          ...newItem,
          tags: newItem.tags ? newItem.tags.split(",").map((t: string) => t.trim()) : [],
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal menambahkan menu pizza.", details: err.message },
      { status: 500 }
    );
  }
}
