import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq, and, inArray } from "drizzle-orm";
import {
  generateReservationCode,
  calculateSpecialKreasiPrice,
  isDateTimeInPast,
} from "@/lib/reservation-service";

export async function POST(req: NextRequest) {
  await ensureDatabaseSeeded();

  try {
    const body = await req.json();

    const {
      date,
      time,
      tableId,
      customerName,
      customerWhatsapp,
      pax,
      note,
      isSpecialKreasi,
      menuItemId,
      flavor1Id,
      flavor2Id,
      paymentProofUrl,
      paymentProofName,
    } = body;

    // 1. Basic validation
    if (!date || !time || !tableId || !customerName || !customerWhatsapp) {
      return NextResponse.json(
        { error: "Mohon lengkapi seluruh data wajib (tanggal, waktu, meja, nama, WhatsApp)." },
        { status: 400 }
      );
    }

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: "Bukti transfer booking fee Rp10.000 wajib diunggah." },
        { status: 400 }
      );
    }

    // 2. Past date and time check (PRD Rule 1 & Rule 2)
    if (isDateTimeInPast(date, time)) {
      return NextResponse.json(
        { error: "Waktu atau tanggal yang Anda pilih telah lewat. Silakan pilih jadwal lain." },
        { status: 400 }
      );
    }

    // 3. Table validation (PRD Rule 5: Active table only)
    const tableQuery = await db
      .select()
      .from(schema.tables)
      .where(and(eq(schema.tables.id, tableId), eq(schema.tables.isActive, true)));

    if (tableQuery.length === 0) {
      return NextResponse.json(
        { error: "Meja yang dipilih tidak aktif atau tidak ditemukan." },
        { status: 400 }
      );
    }
    const targetTable = tableQuery[0];

    // 4. Menu validation & pricing (PRD Rule 8 & 9)
    let totalProductPrice = 0;
    let singleMenuName: string | undefined = undefined;
    let f1Name: string | undefined = undefined;
    let f1Price: number | undefined = undefined;
    let f2Name: string | undefined = undefined;
    let f2Price: number | undefined = undefined;

    if (isSpecialKreasi) {
      if (flavor1Id === flavor2Id) {
        return NextResponse.json(
          { error: "Special Kreasi mewajibkan dua rasa yang berbeda (Flavor 1 ≠ Flavor 2)." },
          { status: 400 }
        );
      }

      const f1Query = await db
        .select()
        .from(schema.menuItems)
        .where(eq(schema.menuItems.id, flavor1Id));
      const f2Query = await db
        .select()
        .from(schema.menuItems)
        .where(eq(schema.menuItems.id, flavor2Id));

      if (f1Query.length === 0 || f2Query.length === 0) {
        return NextResponse.json(
          { error: "Salah satu varian pizza Special Kreasi tidak ditemukan." },
          { status: 400 }
        );
      }

      f1Name = f1Query[0].name;
      f1Price = f1Query[0].price;
      f2Name = f2Query[0].name;
      f2Price = f2Query[0].price;
      totalProductPrice = calculateSpecialKreasiPrice(f1Query[0].price, f2Query[0].price);
    } else {
      if (!menuItemId) {
        return NextResponse.json(
          { error: "Menu pizza belum dipilih." },
          { status: 400 }
        );
      }

      const menuQuery = await db
        .select()
        .from(schema.menuItems)
        .where(eq(schema.menuItems.id, menuItemId));

      if (menuQuery.length === 0) {
        return NextResponse.json(
          { error: "Menu pizza tidak ditemukan." },
          { status: 400 }
        );
      }

      singleMenuName = menuQuery[0].name;
      totalProductPrice = menuQuery[0].price;
    }

    // 5. SERVER-SIDE DOUBLE BOOKING PROTECTION (PRD #21 & #50)
    // Constraint: date + time + tableId cannot have more than 1 active reservation (PENDING or CONFIRMED)
    const existingConflict = await db
      .select()
      .from(schema.reservations)
      .where(
        and(
          eq(schema.reservations.date, date),
          eq(schema.reservations.time, time),
          eq(schema.reservations.tableId, tableId),
          inArray(schema.reservations.status, ["PENDING", "CONFIRMED"])
        )
      );

    if (existingConflict.length > 0) {
      return NextResponse.json(
        {
          error:
            "This table was just reserved by another guest. Please choose another table or time slot.",
        },
        { status: 409 }
      );
    }

    // 6. Generate unique code MYO-XXXXX (PRD #20)
    let code = generateReservationCode();
    let existingCode = await db
      .select()
      .from(schema.reservations)
      .where(eq(schema.reservations.code, code));

    while (existingCode.length > 0) {
      code = generateReservationCode();
      existingCode = await db
        .select()
        .from(schema.reservations)
        .where(eq(schema.reservations.code, code));
    }

    const reservationId = `res-${Date.now()}`;

    // 7. Insert reservation (Status = PENDING per PRD Rule 11)
    const [newReservation] = await db
      .insert(schema.reservations)
      .values({
        id: reservationId,
        code,
        date,
        time,
        tableId,
        tableName: targetTable.name,
        customerName: customerName.trim(),
        customerWhatsapp: customerWhatsapp.trim(),
        pax: Number(pax) || 2,
        note: note ? note.trim() : null,
        isSpecialKreasi: Boolean(isSpecialKreasi),
        menuItemId: isSpecialKreasi ? null : menuItemId,
        menuName: isSpecialKreasi ? null : singleMenuName,
        flavor1Id: isSpecialKreasi ? flavor1Id : null,
        flavor1Name: isSpecialKreasi ? f1Name : null,
        flavor1Price: isSpecialKreasi ? f1Price : null,
        flavor2Id: isSpecialKreasi ? flavor2Id : null,
        flavor2Name: isSpecialKreasi ? f2Name : null,
        flavor2Price: isSpecialKreasi ? f2Price : null,
        totalProductPrice,
        bookingFee: 10000,
        paymentProofUrl,
        paymentProofName: paymentProofName || "payment-proof.jpg",
        status: "PENDING",
      })
      .returning();

    // 8. Insert Audit Trail (PRD #33 & #52)
    await db.insert(schema.reservationStatusHistory).values({
      id: `rsh-${Date.now()}`,
      reservationId,
      fromStatus: "NONE",
      toStatus: "PENDING",
      changedBy: "CUSTOMER",
      reason: "Initial customer submission with booking fee payment proof",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Reservasi berhasil dibuat. Menunggu konfirmasi admin.",
        reservation: newReservation,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Create reservation error:", err);
    return NextResponse.json(
      { error: "Gagal membuat reservasi di server.", details: err.message },
      { status: 500 }
    );
  }
}
