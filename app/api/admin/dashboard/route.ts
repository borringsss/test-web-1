import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { desc, eq, inArray } from "drizzle-orm";
import { getFormattedDateOffset } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabaseSeeded();

  try {
    const all = await db
      .select()
      .from(schema.reservations)
      .orderBy(desc(schema.reservations.createdAt));

    const todayStr = getFormattedDateOffset(0);

    type ReservationItem = typeof schema.reservations.$inferSelect;

    const total = all.length;
    const pending = (all as ReservationItem[]).filter((r) => r.status === "PENDING").length;
    const confirmed = (all as ReservationItem[]).filter((r) => r.status === "CONFIRMED").length;
    const totalPax = (all as ReservationItem[])
      .filter((r) => r.status !== "REJECTED")
      .reduce((sum, r) => sum + r.pax, 0);

    const todayReservations = (all as ReservationItem[]).filter((r) => r.date === todayStr);

    return NextResponse.json({
      metrics: {
        total,
        pending,
        confirmed,
        totalPax,
      },
      todayDate: todayStr,
      todayReservations,
      recentPending: (all as ReservationItem[])
        .filter((r) => r.status === "PENDING")
        .slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memuat metrik dashboard admin.", details: err.message },
      { status: 500 }
    );
  }
}
