import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabaseSeeded();

  try {
    const settingsList = await db.select().from(schema.restaurantSettings);
    const settings = settingsList[0] || {
      id: "settings-1",
      restaurantName: "L'Union Pizza",
      phone: "+62 852-2609-9883",
      whatsapp: "0852-2609-9883",
      bookingFee: 10000,
      paymentBank: "SeaBank",
      paymentAccount: "901702376579",
      accountName: "L'Union Pizza MYO",
      address: "Jl. Veteran No. 42, Artisan Dining Quarter",
      mapsUrl: "https://maps.google.com/?q=LUnion+Pizza",
    };

    return NextResponse.json({
      settings: {
        id: settings.id,
        restaurant_name: settings.restaurantName,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        booking_fee: settings.bookingFee,
        payment_bank: settings.paymentBank,
        payment_account: settings.paymentAccount,
        account_name: settings.accountName,
        address: settings.address,
        maps_url: settings.mapsUrl,
        restaurantName: settings.restaurantName,
        bookingFee: settings.bookingFee,
        paymentBank: settings.paymentBank,
        paymentAccount: settings.paymentAccount,
        accountName: settings.accountName,
        mapsUrl: settings.mapsUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil pengaturan restoran.", details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  await ensureDatabaseSeeded();

  try {
    const body = await req.json();
    const settingsList = await db.select().from(schema.restaurantSettings);
    const targetId = settingsList[0]?.id || "settings-1";

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (body.restaurantName || body.restaurant_name) {
      updatePayload.restaurantName = body.restaurantName || body.restaurant_name;
    }
    if (body.phone) updatePayload.phone = body.phone;
    if (body.whatsapp) updatePayload.whatsapp = body.whatsapp;
    if (body.bookingFee !== undefined || body.booking_fee !== undefined) {
      updatePayload.bookingFee = Number(body.bookingFee ?? body.booking_fee);
    }
    if (body.paymentBank || body.payment_bank) {
      updatePayload.paymentBank = body.paymentBank || body.payment_bank;
    }
    if (body.paymentAccount || body.payment_account) {
      updatePayload.paymentAccount = body.paymentAccount || body.payment_account;
    }
    if (body.accountName || body.account_name) {
      updatePayload.accountName = body.accountName || body.account_name;
    }
    if (body.address) updatePayload.address = body.address;
    if (body.mapsUrl || body.maps_url) {
      updatePayload.mapsUrl = body.mapsUrl || body.maps_url;
    }

    const updated = await db
      .update(schema.restaurantSettings)
      .set(updatePayload)
      .where(eq(schema.restaurantSettings.id, targetId))
      .returning();

    return NextResponse.json({
      success: true,
      settings: updated[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memperbarui pengaturan restoran.", details: err.message },
      { status: 500 }
    );
  }
}
