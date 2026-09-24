import { db, schema, executeRawSql, ensureDbReady } from "./index";
import {
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_WEEKLY_SCHEDULE,
  INITIAL_OVERRIDES,
  INITIAL_SETTINGS,
  INITIAL_RESERVATIONS,
} from "@/lib/mock-data";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

export let isInitialized = false;
export let lastInitError: string | null = null;

export async function ensureDatabaseSeeded() {
  if (isInitialized) return;

  try {
    await ensureDbReady();
    // 1. Create tables if not existing (DDL query for Postgres / PGlite)
    await executeRawSql(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "image" TEXT,
        "role" TEXT DEFAULT 'ADMIN',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "token" TEXT NOT NULL UNIQUE,
        "expires_at" TIMESTAMP NOT NULL,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "account_id" TEXT NOT NULL,
        "provider_id" TEXT NOT NULL,
        "access_token" TEXT,
        "refresh_token" TEXT,
        "access_token_expires_at" TIMESTAMP,
        "refresh_token_expires_at" TIMESTAMP,
        "scope" TEXT,
        "password" TEXT,
        "id_token" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "restaurant_settings" (
        "id" TEXT PRIMARY KEY,
        "restaurant_name" TEXT NOT NULL DEFAULT 'L''Union Pizza',
        "phone" TEXT NOT NULL DEFAULT '+62 852-2609-9883',
        "whatsapp" TEXT NOT NULL DEFAULT '0852-2609-9883',
        "booking_fee" INTEGER NOT NULL DEFAULT 10000,
        "payment_bank" TEXT NOT NULL DEFAULT 'SeaBank',
        "payment_account" TEXT NOT NULL DEFAULT '901702376579',
        "account_name" TEXT NOT NULL DEFAULT 'L''Union Pizza MYO',
        "address" TEXT NOT NULL DEFAULT 'Jl. Veteran No. 42, Artisan Dining Quarter',
        "maps_url" TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=LUnion+Pizza',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "weekly_schedules" (
        "id" TEXT PRIMARY KEY,
        "day_of_week" INTEGER NOT NULL,
        "day_name" TEXT NOT NULL,
        "is_open" BOOLEAN NOT NULL DEFAULT TRUE,
        "start_time" TEXT NOT NULL DEFAULT '11:00',
        "end_time" TEXT NOT NULL DEFAULT '21:00',
        "interval_minutes" INTEGER NOT NULL DEFAULT 15
      );

      CREATE TABLE IF NOT EXISTS "schedule_overrides" (
        "id" TEXT PRIMARY KEY,
        "date" TEXT NOT NULL,
        "is_open" BOOLEAN NOT NULL DEFAULT FALSE,
        "start_time" TEXT NOT NULL DEFAULT '11:00',
        "end_time" TEXT NOT NULL DEFAULT '18:00',
        "interval_minutes" INTEGER NOT NULL DEFAULT 15,
        "note" TEXT
      );

      CREATE TABLE IF NOT EXISTS "tables" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "image_url" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "sort_order" INTEGER NOT NULL DEFAULT 1,
        "capacity" INTEGER NOT NULL DEFAULT 4,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "menu_items" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "price" INTEGER NOT NULL,
        "image_url" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "sort_order" INTEGER NOT NULL DEFAULT 1,
        "tags" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "reservations" (
        "id" TEXT PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "table_id" TEXT NOT NULL REFERENCES "tables"("id"),
        "table_name" TEXT NOT NULL,
        "customer_name" TEXT NOT NULL,
        "customer_whatsapp" TEXT NOT NULL,
        "pax" INTEGER NOT NULL DEFAULT 2,
        "note" TEXT,
        "is_special_kreasi" BOOLEAN NOT NULL DEFAULT FALSE,
        "menu_item_id" TEXT REFERENCES "menu_items"("id"),
        "menu_name" TEXT,
        "flavor_1_id" TEXT REFERENCES "menu_items"("id"),
        "flavor_1_name" TEXT,
        "flavor_1_price" INTEGER,
        "flavor_2_id" TEXT REFERENCES "menu_items"("id"),
        "flavor_2_name" TEXT,
        "flavor_2_price" INTEGER,
        "total_product_price" INTEGER NOT NULL,
        "booking_fee" INTEGER NOT NULL DEFAULT 10000,
        "payment_proof_url" TEXT NOT NULL,
        "payment_proof_name" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "rejection_reason" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "reservation_status_history" (
        "id" TEXT PRIMARY KEY,
        "reservation_id" TEXT NOT NULL REFERENCES "reservations"("id") ON DELETE CASCADE,
        "from_status" TEXT NOT NULL,
        "to_status" TEXT NOT NULL,
        "changed_by" TEXT,
        "reason" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id_token" TEXT;
      UPDATE "account" SET "account_id" = "user_id" WHERE "provider_id" = 'credential';
    `);

    // 2. Check and seed Menu Items
    const existingMenu = await db.select().from(schema.menuItems);
    if (existingMenu.length === 0) {
      for (const item of INITIAL_MENU_ITEMS) {
        await db.insert(schema.menuItems).values({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          imageUrl: item.image,
          isActive: item.is_active,
          sortOrder: item.sort_order,
          tags: item.tags?.join(", ") || "",
        });
      }
    }

    // 3. Check and seed Tables
    const existingTables = await db.select().from(schema.tables);
    if (existingTables.length === 0) {
      for (const t of INITIAL_TABLES) {
        await db.insert(schema.tables).values({
          id: t.id,
          name: t.name,
          description: t.description,
          imageUrl: t.image_url,
          isActive: t.is_active,
          sortOrder: t.sort_order,
          capacity: t.capacity || 4,
        });
      }
    }

    // 4. Check and seed Weekly Schedules
    const existingSchedules = await db.select().from(schema.weeklySchedules);
    if (existingSchedules.length === 0) {
      for (const ws of INITIAL_WEEKLY_SCHEDULE) {
        await db.insert(schema.weeklySchedules).values({
          id: ws.id,
          dayOfWeek: ws.day_of_week,
          dayName: ws.day_name,
          isOpen: ws.is_open,
          startTime: ws.start_time,
          endTime: ws.end_time,
          intervalMinutes: ws.interval_minutes,
        });
      }
    }

    // 5. Check and seed Settings
    const existingSettings = await db.select().from(schema.restaurantSettings);
    if (existingSettings.length === 0) {
      await db.insert(schema.restaurantSettings).values({
        id: "settings-1",
        restaurantName: INITIAL_SETTINGS.restaurant_name,
        phone: INITIAL_SETTINGS.phone,
        whatsapp: INITIAL_SETTINGS.whatsapp,
        bookingFee: INITIAL_SETTINGS.booking_fee,
        paymentBank: INITIAL_SETTINGS.payment_bank,
        paymentAccount: INITIAL_SETTINGS.payment_account,
        accountName: INITIAL_SETTINGS.account_name,
        address: INITIAL_SETTINGS.address,
        mapsUrl: INITIAL_SETTINGS.maps_url,
      });
    }

    // 6. Check and seed Schedule Overrides
    const existingOverrides = await db.select().from(schema.scheduleOverrides);
    if (existingOverrides.length === 0) {
      for (const ovr of INITIAL_OVERRIDES) {
        await db.insert(schema.scheduleOverrides).values({
          id: ovr.id,
          date: ovr.date,
          isOpen: ovr.is_open,
          startTime: ovr.start_time,
          endTime: ovr.end_time,
          intervalMinutes: ovr.interval_minutes,
          note: ovr.note,
        });
      }
    }

    // 7. Check and seed default Admin User in Better Auth
    try {
      const adminEmail = "admin@lunionpizza.com";
      const hashedPassword = await hashPassword("admin123");
      const existingAdminUsers = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, adminEmail));

      let adminUserId = "admin-user-1";

      if (existingAdminUsers.length === 0) {
        await db.insert(schema.user).values({
          id: adminUserId,
          name: "L'Union Admin",
          email: adminEmail,
          emailVerified: true,
          role: "ADMIN",
        });
      } else {
        adminUserId = existingAdminUsers[0].id;
        await db
          .update(schema.user)
          .set({ role: "ADMIN", emailVerified: true })
          .where(eq(schema.user.id, adminUserId));
      }

      const existingAdminAccounts = await db
        .select()
        .from(schema.account)
        .where(
          and(
            eq(schema.account.userId, adminUserId),
            eq(schema.account.providerId, "credential")
          )
        );

      if (existingAdminAccounts.length === 0) {
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
          .where(eq(schema.account.id, existingAdminAccounts[0].id));
      }
    } catch (e) {
      console.error("Admin user seed error:", e);
    }

    // 8. Check and seed Reservations
    const existingRes = await db.select().from(schema.reservations);
    if (existingRes.length === 0) {
      for (const r of INITIAL_RESERVATIONS) {
        await db.insert(schema.reservations).values({
          id: r.id,
          code: r.code,
          date: r.date,
          time: r.time,
          tableId: r.table_id,
          tableName: r.table_name,
          customerName: r.customer_name,
          customerWhatsapp: r.customer_whatsapp,
          pax: r.pax,
          note: r.note,
          isSpecialKreasi: r.is_special_kreasi,
          menuItemId: r.menu_item_id,
          menuName: r.menu_name,
          flavor1Id: r.flavor_1_id,
          flavor1Name: r.flavor_1_name,
          flavor1Price: r.flavor_1_price,
          flavor2Id: r.flavor_2_id,
          flavor2Name: r.flavor_2_name,
          flavor2Price: r.flavor_2_price,
          totalProductPrice: r.total_product_price,
          bookingFee: r.booking_fee,
          paymentProofUrl: r.payment_proof_url,
          paymentProofName: r.payment_proof_name,
          status: r.status,
          rejectionReason: r.rejection_reason,
        });
      }
    }

    isInitialized = true;
  } catch (err: any) {
    lastInitError = err?.message || String(err);
    console.error("Database initialization error:", err);
  }
}
