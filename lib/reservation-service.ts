import {
  WeeklyScheduleDay,
  ScheduleOverride,
  Reservation,
  SlotAvailability,
} from "./types";

export interface EffectiveSchedule {
  isOpen: boolean;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  note?: string;
  isOverride: boolean;
}

/**
 * Priority Rule (PRD #10):
 * Date Override -> Weekly Schedule
 */
export function getScheduleForDate(
  dateStr: string,
  weeklySchedules: WeeklyScheduleDay[],
  overrides: ScheduleOverride[]
): EffectiveSchedule {
  // Check override first
  const override = overrides.find((o) => o.date === dateStr);
  if (override) {
    return {
      isOpen: override.is_open,
      startTime: override.start_time,
      endTime: override.end_time,
      intervalMinutes: override.interval_minutes || 15,
      note: override.note,
      isOverride: true,
    };
  }

  // Fallback to weekly schedule
  // Note: Parse date components directly to avoid timezone drift issues
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...

  const weekly = weeklySchedules.find((w) => w.day_of_week === dayOfWeek);
  if (weekly) {
    return {
      isOpen: weekly.is_open,
      startTime: weekly.start_time,
      endTime: weekly.end_time,
      intervalMinutes: weekly.interval_minutes || 15,
      isOverride: false,
    };
  }

  // Default fallback
  return {
    isOpen: true,
    startTime: "11:00",
    endTime: "21:00",
    intervalMinutes: 15,
    isOverride: false,
  };
}

/**
 * Generate 15-minute slot intervals from start_time to end_time
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 15
): string[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots: string[] = [];
  for (let mins = startTotal; mins <= endTotal; mins += intervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push(timeStr);
  }

  return slots;
}

/**
 * Check if a date + time is in the past
 * (Rule 1 & Rule 2: Past dates and past times today cannot be selected)
 */
export function isDateTimeInPast(dateStr: string, timeStr?: string): boolean {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (dateStr < todayStr) {
    return true;
  }

  if (dateStr === todayStr && timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const slotMins = h * 60 + m;
    return slotMins <= currentMins;
  }

  return false;
}

/**
 * Special Kreasi Rule (PRD #15 & #50):
 * (Price 1 + Price 2) / 2
 */
export function calculateSpecialKreasiPrice(
  price1: number,
  price2: number
): number {
  return Math.round((price1 + price2) / 2);
}

/**
 * Generate unique reservation code MYO-XXXXX
 * PRD #20: Format MYO-XXXXX
 */
export function generateReservationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous 0, O, 1, I
  let code = "MYO-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Double-Booking Check (PRD #21 & #50):
 * Constraint: date + time + tableId
 * Reservation with status PENDING or CONFIRMED locks the table.
 * REJECTED does NOT lock the table.
 */
export function checkDoubleBooking(
  date: string,
  time: string,
  tableId: string,
  reservations: Reservation[],
  excludeReservationId?: string
): boolean {
  return reservations.some((r) => {
    if (excludeReservationId && r.id === excludeReservationId) return false;
    return (
      r.date === date &&
      r.time === time &&
      r.table_id === tableId &&
      (r.status === "PENDING" || r.status === "CONFIRMED")
    );
  });
}

/**
 * Get visual slot availability for public booking board (PRD #11, #50, #55)
 * - AVAILABLE: slot can be picked
 * - PENDING: locked, customer name is NOT shown
 * - CONFIRMED: locked, shows customer name, table, and menu
 * - REJECTED: slot is freed (treated as AVAILABLE)
 */
export function getSlotAvailability(
  date: string,
  time: string,
  tableId: string,
  tableName: string,
  reservations: Reservation[]
): SlotAvailability {
  // Find active booking for this slot
  const booking = reservations.find(
    (r) =>
      r.date === date &&
      r.time === time &&
      r.table_id === tableId &&
      (r.status === "PENDING" || r.status === "CONFIRMED")
  );

  if (!booking) {
    return {
      time,
      table_id: tableId,
      table_name: tableName,
      status: "AVAILABLE",
    };
  }

  if (booking.status === "PENDING") {
    return {
      time,
      table_id: tableId,
      table_name: tableName,
      status: "PENDING",
      reservation: {
        code: booking.code,
        // Name & Menu explicitly omitted for privacy per PRD Rule 14
      },
    };
  }

  // CONFIRMED per PRD Rule 15: displays name, table, and menu
  const menuDisplay = booking.is_special_kreasi
    ? `Kreasi: ${booking.flavor_1_name} & ${booking.flavor_2_name}`
    : booking.menu_name || "Custom Pizza";

  return {
    time,
    table_id: tableId,
    table_name: tableName,
    status: "CONFIRMED",
    reservation: {
      code: booking.code,
      customer_name: booking.customer_name,
      menu_name: menuDisplay,
    },
  };
}
