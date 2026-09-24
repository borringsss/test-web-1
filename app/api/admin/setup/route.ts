import { NextResponse } from "next/server";
import { db, schema, globalForDb } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { hashPassword } from "better-auth/crypto";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();

    const adminEmail = "admin@lunionpizza.com";
    const hashedPassword = await hashPassword("admin123");

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, adminEmail));

    let adminUserId = "admin-user-1";

    if (existingUsers.length === 0) {
      await db.insert(schema.user).values({
        id: adminUserId,
        name: "L'Union Admin",
        email: adminEmail,
        emailVerified: true,
        role: "ADMIN",
      });
    } else {
      adminUserId = existingUsers[0].id;
      // Ensure role is ADMIN
      await db
        .update(schema.user)
        .set({ role: "ADMIN", emailVerified: true })
        .where(eq(schema.user.id, adminUserId));
    }

    // Check if credential account exists
    const existingAccounts = await db
      .select()
      .from(schema.account)
      .where(
        and(
          eq(schema.account.userId, adminUserId),
          eq(schema.account.providerId, "credential")
        )
      );

    if (existingAccounts.length === 0) {
      await db.insert(schema.account).values({
        id: `admin-account-${Date.now()}`,
        userId: adminUserId,
        accountId: adminUserId,
        providerId: "credential",
        password: hashedPassword,
      });
    } else {
      await db
        .update(schema.account)
        .set({
          password: hashedPassword,
          accountId: adminUserId,
        })
        .where(eq(schema.account.id, existingAccounts[0].id));
    }

    return NextResponse.json({
      success: true,
      message: "Akun admin berhasil disinkronisasi & siap digunakan.",
      credentials: {
        email: adminEmail,
        password: "admin123",
      },
      database: {
        engine: globalForDb.isPg ? "PostgreSQL (Cloud / Supabase)" : "PGlite (Embedded)",
        adminUserId,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menyiapkan akun admin.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
