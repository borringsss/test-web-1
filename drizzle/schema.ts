import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// ==========================================
// BETTER AUTH TABLES (PRD #25)
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").default("ADMIN"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// L'UNION PIZZA DOMAIN TABLES (PRD #33)
// ==========================================

export const restaurantSettings = pgTable("restaurant_settings", {
  id: text("id").primaryKey(),
  restaurantName: text("restaurant_name").notNull().default("L'Union Pizza"),
  phone: text("phone").notNull().default("+62 852-2609-9883"),
  whatsapp: text("whatsapp").notNull().default("0852-2609-9883"),
  bookingFee: integer("booking_fee").notNull().default(10000),
  paymentBank: text("payment_bank").notNull().default("SeaBank"),
  paymentAccount: text("payment_account").notNull().default("901702376579"),
  accountName: text("account_name").notNull().default("L'Union Pizza MYO"),
  address: text("address")
    .notNull()
    .default("Jl. Veteran No. 42, Artisan Dining Quarter"),
  mapsUrl: text("maps_url")
    .notNull()
    .default("https://maps.google.com/?q=LUnion+Pizza"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const weeklySchedules = pgTable("weekly_schedules", {
  id: text("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sun, 1 = Mon, ..., 6 = Sat
  dayName: text("day_name").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  startTime: text("start_time").notNull().default("11:00"),
  endTime: text("end_time").notNull().default("21:00"),
  intervalMinutes: integer("interval_minutes").notNull().default(15),
});

export const scheduleOverrides = pgTable("schedule_overrides", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  isOpen: boolean("is_open").notNull().default(false),
  startTime: text("start_time").notNull().default("11:00"),
  endTime: text("end_time").notNull().default("18:00"),
  intervalMinutes: integer("interval_minutes").notNull().default(15),
  note: text("note"),
});

export const tables = pgTable("tables", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(1),
  capacity: integer("capacity").notNull().default(4),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(1),
  tags: text("tags"), // Comma-separated or JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // MYO-XXXXX
  date: text("date").notNull(),          // YYYY-MM-DD
  time: text("time").notNull(),          // HH:mm
  tableId: text("table_id")
    .notNull()
    .references(() => tables.id),
  tableName: text("table_name").notNull(),

  customerName: text("customer_name").notNull(),
  customerWhatsapp: text("customer_whatsapp").notNull(),
  pax: integer("pax").notNull().default(2),
  note: text("note"),

  isSpecialKreasi: boolean("is_special_kreasi").notNull().default(false),
  menuItemId: text("menu_item_id").references(() => menuItems.id),
  menuName: text("menu_name"),

  flavor1Id: text("flavor_1_id").references(() => menuItems.id),
  flavor1Name: text("flavor_1_name"),
  flavor1Price: integer("flavor_1_price"),

  flavor2Id: text("flavor_2_id").references(() => menuItems.id),
  flavor2Name: text("flavor_2_name"),
  flavor2Price: integer("flavor_2_price"),

  totalProductPrice: integer("total_product_price").notNull(),
  bookingFee: integer("booking_fee").notNull().default(10000),
  paymentProofUrl: text("payment_proof_url").notNull(),
  paymentProofName: text("payment_proof_name"),

  status: text("status").notNull().default("PENDING"), // PENDING, CONFIRMED, REJECTED
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reservationStatusHistory = pgTable("reservation_status_history", {
  id: text("id").primaryKey(),
  reservationId: text("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  changedBy: text("changed_by"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
