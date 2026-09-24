import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  await ensureDatabaseSeeded();

  try {
    const weekly = await db
      .select()
      .from(schema.weeklySchedules)
      .orderBy(asc(schema.weeklySchedules.dayOfWeek));

    const overrides = await db
      .select()
      .from(schema.scheduleOverrides)
      .orderBy(asc(schema.scheduleOverrides.date));

    return NextResponse.json({ weekly, overrides });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil jadwal admin.", details: err.message },
      { status: 500 }
    );
  }
}

// Update weekly schedules
export async function PUT(req: NextRequest) {
  await ensureDatabaseSeeded();

  try {
    const body = await req.json();
    const { weekly } = body;

    if (!Array.isArray(weekly)) {
      return NextResponse.json(
        { error: "Format payload weekly schedules harus berupa array." },
        { status: 400 }
      );
    }

    for (const day of weekly) {
      await db
        .update(schema.weeklySchedules)
        .set({
          isOpen: Boolean(day.isOpen ?? day.is_open),
          startTime: day.startTime ?? day.start_time,
          endTime: day.endTime ?? day.end_time,
          intervalMinutes: Number(day.intervalMinutes ?? day.interval_minutes),
        })
        .where(eq(schema.weeklySchedules.id, day.id));
    }

    return NextResponse.json({
      success: true,
      message: "Jadwal mingguan berhasil diperbarui.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memperbarui jadwal mingguan.", details: err.message },
      { status: 500 }
    );
  }
}

// Add date override
export async function POST(req: NextRequest) {
  await ensureDatabaseSeeded();

  try {
    const body = await req.json();
    const { date, isOpen, startTime, endTime, intervalMinutes, note } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Tanggal override wajib disertakan." },
        { status: 400 }
      );
    }

    // Delete existing override for this date if exists
    await db
      .delete(schema.scheduleOverrides)
      .where(eq(schema.scheduleOverrides.date, date));

    const id = `ovr-${Date.now()}`;

    const [newOverride] = await db
      .insert(schema.scheduleOverrides)
      .values({
        id,
        date,
        isOpen: Boolean(isOpen),
        startTime: startTime || "11:00",
        endTime: endTime || "18:00",
        intervalMinutes: Number(intervalMinutes) || 15,
        note: note ? note.trim() : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Date override berhasil ditambahkan.",
      override: newOverride,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal menambahkan date override.", details: err.message },
      { status: 500 }
    );
  }
}

// Delete date override
export async function DELETE(req: NextRequest) {
  await ensureDatabaseSeeded();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID override wajib disertakan." },
      { status: 400 }
    );
  }

  try {
    await db
      .delete(schema.scheduleOverrides)
      .where(eq(schema.scheduleOverrides.id, id));

    return NextResponse.json({
      success: true,
      message: "Date override berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal menghapus date override.", details: err.message },
      { status: 500 }
    );
  }
}
