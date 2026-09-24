import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq } from "drizzle-orm";
import { generateTimeSlots } from "@/lib/reservation-service";

export async function GET(req: NextRequest) {
  await ensureDatabaseSeeded();

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json(
      { error: "Parameter 'date' (YYYY-MM-DD) wajib disertakan." },
      { status: 400 }
    );
  }

  try {
    // 1. Check Date Override first (PRD #10: Priority Date Override -> Weekly Schedule)
    const overrides = await db
      .select()
      .from(schema.scheduleOverrides)
      .where(eq(schema.scheduleOverrides.date, dateStr));

    if (overrides.length > 0) {
      const ovr = overrides[0];
      const slots = ovr.isOpen
        ? generateTimeSlots(ovr.startTime, ovr.endTime, ovr.intervalMinutes)
        : [];

      return NextResponse.json({
        date: dateStr,
        isOpen: ovr.isOpen,
        startTime: ovr.startTime,
        endTime: ovr.endTime,
        intervalMinutes: ovr.intervalMinutes,
        note: ovr.note,
        isOverride: true,
        slots,
      });
    }

    // 2. Fallback to Weekly Schedule
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...

    const weekly = await db
      .select()
      .from(schema.weeklySchedules)
      .where(eq(schema.weeklySchedules.dayOfWeek, dayOfWeek));

    if (weekly.length > 0) {
      const ws = weekly[0];
      const slots = ws.isOpen
        ? generateTimeSlots(ws.startTime, ws.endTime, ws.intervalMinutes)
        : [];

      return NextResponse.json({
        date: dateStr,
        isOpen: ws.isOpen,
        startTime: ws.startTime,
        endTime: ws.endTime,
        intervalMinutes: ws.intervalMinutes,
        isOverride: false,
        slots,
      });
    }

    // Default fallback
    const defaultSlots = generateTimeSlots("11:00", "21:00", 15);
    return NextResponse.json({
      date: dateStr,
      isOpen: true,
      startTime: "11:00",
      endTime: "21:00",
      intervalMinutes: 15,
      isOverride: false,
      slots: defaultSlots,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memuat jadwal operasional.", details: err.message },
      { status: 500 }
    );
  }
}
