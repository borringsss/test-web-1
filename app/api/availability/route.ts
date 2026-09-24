import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq, and, inArray } from "drizzle-orm";
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
    // 1. Get active tables (Rule 5: Inactive tables not shown)
    const activeTables = await db
      .select()
      .from(schema.tables)
      .where(eq(schema.tables.isActive, true))
      .orderBy(schema.tables.sortOrder);

    // 2. Determine schedule slots
    const overrides = await db
      .select()
      .from(schema.scheduleOverrides)
      .where(eq(schema.scheduleOverrides.date, dateStr));

    let isOpen = true;
    let startTime = "11:00";
    let endTime = "21:00";
    let intervalMinutes = 15;
    let isOverride = false;
    let note: string | null | undefined = undefined;

    if (overrides.length > 0) {
      isOpen = overrides[0].isOpen;
      startTime = overrides[0].startTime;
      endTime = overrides[0].endTime;
      intervalMinutes = overrides[0].intervalMinutes;
      isOverride = true;
      note = overrides[0].note;
    } else {
      const [year, month, day] = dateStr.split("-").map(Number);
      const targetDate = new Date(year, month - 1, day);
      const dayOfWeek = targetDate.getDay();

      const weekly = await db
        .select()
        .from(schema.weeklySchedules)
        .where(eq(schema.weeklySchedules.dayOfWeek, dayOfWeek));

      if (weekly.length > 0) {
        isOpen = weekly[0].isOpen;
        startTime = weekly[0].startTime;
        endTime = weekly[0].endTime;
        intervalMinutes = weekly[0].intervalMinutes;
      }
    }

    const timeSlots = isOpen
      ? generateTimeSlots(startTime, endTime, intervalMinutes)
      : [];

    // 3. Get all active reservations for this date
    // PRD #13: Active means status != 'REJECTED' (i.e. 'PENDING' or 'CONFIRMED')
    const activeReservations = await db
      .select()
      .from(schema.reservations)
      .where(
        and(
          eq(schema.reservations.date, dateStr),
          inArray(schema.reservations.status, ["PENDING", "CONFIRMED"])
        )
      );

    // 4. Build availability matrix
    // PRD #11 & #50:
    // - PENDING: slot locked, customer name is NOT shown
    // - CONFIRMED: slot locked, shows customer name, table, and menu
    const matrix: Record<string, Record<string, any>> = {};

    type ReservationRecord = typeof schema.reservations.$inferSelect;
    type TableRecord = typeof schema.tables.$inferSelect;

    for (const slot of timeSlots) {
      matrix[slot] = {};
      for (const tbl of (activeTables as TableRecord[])) {
        const booking = (activeReservations as ReservationRecord[]).find(
          (r) => r.time === slot && r.tableId === tbl.id
        );

        if (!booking) {
          matrix[slot][tbl.id] = {
            status: "AVAILABLE",
          };
        } else if (booking.status === "PENDING") {
          matrix[slot][tbl.id] = {
            status: "PENDING",
            code: booking.code,
            // Name and menu strictly omitted for privacy (PRD Rule 14)
          };
        } else if (booking.status === "CONFIRMED") {
          const menuDisplay = booking.isSpecialKreasi
            ? `Kreasi: ${booking.flavor1Name} & ${booking.flavor2Name}`
            : booking.menuName || "Pizza";

          matrix[slot][tbl.id] = {
            status: "CONFIRMED",
            code: booking.code,
            customerName: booking.customerName, // PRD Rule 15
            menuName: menuDisplay,              // PRD Rule 15
          };
        }
      }
    }

    return NextResponse.json({
      date: dateStr,
      isOpen,
      isOverride,
      note,
      startTime,
      endTime,
      intervalMinutes,
      tables: activeTables,
      timeSlots,
      matrix,
      reservations: (activeReservations as ReservationRecord[]).map((r) => ({
        id: r.id,
        code: r.code,
        date: r.date,
        time: r.time,
        table_id: r.tableId,
        table_name: r.tableName,
        customer_name: r.status === "CONFIRMED" ? r.customerName : "Tamu Rahasia",
        customer_whatsapp: "",
        pax: r.pax,
        is_special_kreasi: r.isSpecialKreasi,
        menu_name:
          r.status === "CONFIRMED"
            ? r.isSpecialKreasi
              ? `Kreasi: ${r.flavor1Name} & ${r.flavor2Name}`
              : r.menuName
            : "Menu Dipesan",
        status: r.status,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal menghitung ketersediaan meja.", details: err.message },
      { status: 500 }
    );
  }
}
