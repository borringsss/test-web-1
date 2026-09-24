export type ReservationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  is_active: boolean;
  sort_order: number;
  tags?: string[];
}

export interface RestaurantTable {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  capacity?: number;
}

export interface WeeklyScheduleDay {
  id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  day_name: string;
  is_open: boolean;
  start_time: string; // "11:00"
  end_time: string;   // "21:00"
  interval_minutes: number; // 15
}

export interface ScheduleOverride {
  id: string;
  date: string; // YYYY-MM-DD
  is_open: boolean;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  note?: string;
}

export interface Reservation {
  id: string;
  code: string; // e.g. "MYO-A7K29"
  date: string; // YYYY-MM-DD
  time: string; // "11:15"
  table_id: string;
  table_name: string;
  
  customer_name: string;
  customer_whatsapp: string;
  pax: number;
  note?: string;
  
  is_special_kreasi: boolean;
  menu_item_id?: string;
  menu_name?: string;
  flavor_1_id?: string;
  flavor_1_name?: string;
  flavor_1_price?: number;
  flavor_2_id?: string;
  flavor_2_name?: string;
  flavor_2_price?: number;
  
  total_product_price: number;
  booking_fee: number; // 10000
  payment_proof_url: string;
  payment_proof_name?: string;
  
  status: ReservationStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  restaurant_name: string;
  phone: string;
  whatsapp: string;
  booking_fee: number;
  payment_bank: string;
  payment_account: string;
  account_name: string;
  address: string;
  maps_url: string;
}

export interface SlotAvailability {
  time: string;
  table_id: string;
  table_name: string;
  status: "AVAILABLE" | "PENDING" | "CONFIRMED";
  reservation?: {
    code: string;
    customer_name?: string; // shown ONLY if CONFIRMED
    menu_name?: string;     // shown ONLY if CONFIRMED
  };
}
