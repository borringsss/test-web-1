import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  await ensureDatabaseSeeded();

  const code = params.code?.toUpperCase();

  if (!code) {
    return NextResponse.json(
      { error: "Kode reservasi wajib disertakan." },
      { status: 400 }
    );
  }

  try {
    const records = await db
      .select()
      .from(schema.reservations)
      .where(eq(schema.reservations.code, code));

    if (records.length === 0) {
      return NextResponse.json(
        { error: `Reservasi dengan kode '${code}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation: records[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil data reservasi.", details: err.message },
      { status: 500 }
    );
  }
}
