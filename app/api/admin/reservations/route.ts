import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { desc, eq, and, sql, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureDatabaseSeeded();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const dateParam = searchParams.get("date");
  const searchParam = searchParams.get("search");

  try {
    const query = db
      .select()
      .from(schema.reservations)
      .orderBy(desc(schema.reservations.createdAt));

    const records = await query;

    const filtered = (records as (typeof schema.reservations.$inferSelect)[]).filter((r) => {
      const matchStatus =
        !statusParam || statusParam === "ALL" || r.status === statusParam;
      const matchDate = !dateParam || r.date === dateParam;
      const matchSearch =
        !searchParam ||
        r.code.toLowerCase().includes(searchParam.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchParam.toLowerCase()) ||
        r.customerWhatsapp.includes(searchParam);

      return matchStatus && matchDate && matchSearch;
    });

    return NextResponse.json({ reservations: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil daftar reservasi admin.", details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  await ensureDatabaseSeeded();

  try {
    const body = await req.json();
    const { id, code, status, rejectionReason, changedBy } = body;
    const targetKey = id || code;

    if (!targetKey || !status) {
      return NextResponse.json(
        { error: "ID atau Kode reservasi dan status baru wajib disertakan." },
        { status: 400 }
      );
    }

    // 1. Fetch current reservation
    const current = await db
      .select()
      .from(schema.reservations)
      .where(
        or(
          eq(schema.reservations.id, targetKey),
          eq(schema.reservations.code, targetKey)
        )
      );

    if (current.length === 0) {
      return NextResponse.json(
        { error: "Reservasi tidak ditemukan." },
        { status: 404 }
      );
    }

    const previousStatus = current[0].status;
    const resId = current[0].id;

    // 2. Update status
    const [updated] = await db
      .update(schema.reservations)
      .set({
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.reservations.id, resId))
      .returning();

    // 3. Insert into audit trail (PRD #33 & #52)
    await db.insert(schema.reservationStatusHistory).values({
      id: `rsh-${Date.now()}`,
      reservationId: resId,
      fromStatus: previousStatus,
      toStatus: status,
      changedBy: changedBy || "ADMIN",
      reason: rejectionReason || `Status changed to ${status}`,
    });

    return NextResponse.json({
      success: true,
      message: `Status reservasi berhasil diubah menjadi ${status}.`,
      reservation: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memperbarui status reservasi.", details: err.message },
      { status: 500 }
    );
  }
}
