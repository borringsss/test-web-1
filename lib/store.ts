"use client";

import {
  MenuItem,
  RestaurantTable,
  WeeklyScheduleDay,
  ScheduleOverride,
  RestaurantSettings,
  Reservation,
  ReservationStatus,
} from "./types";
import {
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_WEEKLY_SCHEDULE,
  INITIAL_OVERRIDES,
  INITIAL_SETTINGS,
  INITIAL_RESERVATIONS,
} from "./mock-data";
import {
  generateReservationCode,
  checkDoubleBooking,
} from "./reservation-service";

const STORAGE_KEYS = {
  MENU: "lunion_menu_items",
  TABLES: "lunion_tables",
  SCHEDULE: "lunion_weekly_schedule",
  OVERRIDES: "lunion_overrides",
  SETTINGS: "lunion_settings",
  RESERVATIONS: "lunion_reservations",
  ADMIN_AUTH: "lunion_admin_authenticated",
};

// Dispatch custom event for intra-tab reactive updates
function dispatchStoreUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("lunion_store_updated"));
  }
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    dispatchStoreUpdate();
  } catch (err) {
    console.error(`Failed to save to localStorage [${key}]:`, err);
  }
}

export const LUnionStore = {
  // SETTINGS
  getSettings(): RestaurantSettings {
    return getFromStorage<RestaurantSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  updateSettings(settings: Partial<RestaurantSettings>): void {
    const current = this.getSettings();
    saveToStorage(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
  },

  // MENU
  getMenuItems(): MenuItem[] {
    return getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS);
  },
  getActiveMenuItems(): MenuItem[] {
    return this.getMenuItems()
      .filter((m) => m.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  addMenuItem(item: Omit<MenuItem, "id">): MenuItem {
    const items = this.getMenuItems();
    const newItem: MenuItem = {
      ...item,
      id: `menu-${Date.now()}`,
    };
    saveToStorage(STORAGE_KEYS.MENU, [...items, newItem]);
    return newItem;
  },
  updateMenuItem(id: string, updates: Partial<MenuItem>): void {
    const items = this.getMenuItems().map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    saveToStorage(STORAGE_KEYS.MENU, items);
  },
  deleteMenuItem(id: string): void {
    const items = this.getMenuItems().filter((m) => m.id !== id);
    saveToStorage(STORAGE_KEYS.MENU, items);
  },

  // TABLES
  getTables(): RestaurantTable[] {
    return getFromStorage<RestaurantTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES);
  },
  getActiveTables(): RestaurantTable[] {
    return this.getTables()
      .filter((t) => t.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  updateTable(id: string, updates: Partial<RestaurantTable>): void {
    const tables = this.getTables().map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    saveToStorage(STORAGE_KEYS.TABLES, tables);
  },

  // SCHEDULE
  getWeeklySchedule(): WeeklyScheduleDay[] {
    return getFromStorage<WeeklyScheduleDay[]>(
      STORAGE_KEYS.SCHEDULE,
      INITIAL_WEEKLY_SCHEDULE
    );
  },
  updateWeeklySchedule(schedule: WeeklyScheduleDay[]): void {
    saveToStorage(STORAGE_KEYS.SCHEDULE, schedule);
  },

  // OVERRIDES
  getOverrides(): ScheduleOverride[] {
    return getFromStorage<ScheduleOverride[]>(
      STORAGE_KEYS.OVERRIDES,
      INITIAL_OVERRIDES
    );
  },
  addOverride(override: Omit<ScheduleOverride, "id">): ScheduleOverride {
    const overrides = this.getOverrides();
    const newOverride: ScheduleOverride = {
      ...override,
      id: `ovr-${Date.now()}`,
    };
    // Replace if date already has override
    const filtered = overrides.filter((o) => o.date !== override.date);
    saveToStorage(STORAGE_KEYS.OVERRIDES, [...filtered, newOverride]);
    return newOverride;
  },
  deleteOverride(id: string): void {
    const overrides = this.getOverrides().filter((o) => o.id !== id);
    saveToStorage(STORAGE_KEYS.OVERRIDES, overrides);
  },

  // RESERVATIONS
  getReservations(): Reservation[] {
    return getFromStorage<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      INITIAL_RESERVATIONS
    );
  },
  getReservationByCode(code: string): Reservation | undefined {
    return this.getReservations().find(
      (r) => r.code.toUpperCase() === code.trim().toUpperCase()
    );
  },
  createReservation(
    data: Omit<Reservation, "id" | "code" | "status" | "created_at" | "updated_at">
  ): { success: boolean; reservation?: Reservation; error?: string } {
    const reservations = this.getReservations();

    // STRICT DOUBLE BOOKING CHECK (PRD #21)
    const isConflict = checkDoubleBooking(
      data.date,
      data.time,
      data.table_id,
      reservations
    );

    if (isConflict) {
      return {
        success: false,
        error: "Meja ini baru saja dipesan oleh tamu lain pada jam yang sama. Silakan pilih meja atau slot jam lainnya.",
      };
    }

    // Generate unique code MYO-XXXXX
    let code = generateReservationCode();
    while (reservations.some((r) => r.code === code)) {
      code = generateReservationCode();
    }

    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now()}`,
      code,
      status: "PENDING",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.RESERVATIONS, [newReservation, ...reservations]);
    return { success: true, reservation: newReservation };
  },

  updateReservationStatus(
    code: string,
    status: ReservationStatus,
    rejectionReason?: string
  ): boolean {
    const reservations = this.getReservations();
    let updated = false;

    const newList = reservations.map((r) => {
      if (r.code.toUpperCase() === code.toUpperCase()) {
        updated = true;
        return {
          ...r,
          status,
          rejection_reason: status === "REJECTED" ? rejectionReason : undefined,
          updated_at: new Date().toISOString(),
        };
      }
      return r;
    });

    if (updated) {
      saveToStorage(STORAGE_KEYS.RESERVATIONS, newList);
    }
    return updated;
  },

  // RESET
  resetAllData(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(INITIAL_WEEKLY_SCHEDULE));
    localStorage.setItem(STORAGE_KEYS.OVERRIDES, JSON.stringify(INITIAL_OVERRIDES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
    dispatchStoreUpdate();
  },

  // ADMIN AUTH
  isAdminLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true";
  },
  setAdminLoggedIn(value: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, value ? "true" : "false");
    dispatchStoreUpdate();
  },
};
