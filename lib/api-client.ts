import { MenuItem, RestaurantTable, Reservation, SlotAvailability } from "./types";

export function normalizeReservation(r: any): Reservation {
  if (!r) return r;
  return {
    ...r,
    id: r.id,
    code: r.code,
    date: r.date,
    time: r.time,
    table_id: r.tableId || r.table_id || "",
    table_name: r.tableName || r.table_name || "",
    customer_name: r.customerName || r.customer_name || "",
    customer_whatsapp: r.customerWhatsapp || r.customer_whatsapp || "",
    pax: Number(r.pax) || 2,
    note: r.note || "",
    is_special_kreasi: Boolean(r.isSpecialKreasi ?? r.is_special_kreasi),
    menu_item_id: r.menuItemId || r.menu_item_id || "",
    menu_name: r.menuName || r.menu_name || "",
    flavor_1_id: r.flavor1Id || r.flavor_1_id || "",
    flavor_1_name: r.flavor1Name || r.flavor_1_name || "",
    flavor_1_price: r.flavor1Price ?? r.flavor_1_price ?? 0,
    flavor_2_id: r.flavor2Id || r.flavor_2_id || "",
    flavor_2_name: r.flavor2Name || r.flavor_2_name || "",
    flavor_2_price: r.flavor2Price ?? r.flavor_2_price ?? 0,
    total_product_price: r.totalProductPrice ?? r.total_product_price ?? 0,
    booking_fee: r.bookingFee ?? r.booking_fee ?? 10000,
    payment_proof_url: r.paymentProofUrl || r.payment_proof_url || "",
    payment_proof_name: r.paymentProofName || r.payment_proof_name || "",
    status: r.status || "PENDING",
    rejection_reason: r.rejectionReason || r.rejection_reason || "",
    created_at: r.createdAt || r.created_at || new Date().toISOString(),
    updated_at: r.updatedAt || r.updated_at || new Date().toISOString(),
    // Camelcase aliases
    tableId: r.tableId || r.table_id || "",
    tableName: r.tableName || r.table_name || "",
    customerName: r.customerName || r.customer_name || "",
    customerWhatsapp: r.customerWhatsapp || r.customer_whatsapp || "",
    isSpecialKreasi: Boolean(r.isSpecialKreasi ?? r.is_special_kreasi),
    menuItemId: r.menuItemId || r.menu_item_id || "",
    menuName: r.menuName || r.menu_name || "",
    flavor1Id: r.flavor1Id || r.flavor_1_id || "",
    flavor1Name: r.flavor1Name || r.flavor_1_name || "",
    flavor1Price: r.flavor1Price ?? r.flavor_1_price ?? 0,
    flavor2Id: r.flavor2Id || r.flavor_2_id || "",
    flavor2Name: r.flavor2Name || r.flavor_2_name || "",
    flavor2Price: r.flavor2Price ?? r.flavor_2_price ?? 0,
    totalProductPrice: r.totalProductPrice ?? r.total_product_price ?? 0,
    bookingFee: r.bookingFee ?? r.booking_fee ?? 10000,
    paymentProofUrl: r.paymentProofUrl || r.payment_proof_url || "",
    paymentProofName: r.paymentProofName || r.payment_proof_name || "",
    rejectionReason: r.rejectionReason || r.rejection_reason || "",
  };
}

export function normalizeMenuItem(item: any): MenuItem {
  if (!item) return item;
  return {
    ...item,
    id: item.id,
    name: item.name,
    slug: item.slug || item.id,
    description: item.description || "",
    price: Number(item.price) || 0,
    image: item.imageUrl || item.image || "",
    image_url: item.imageUrl || item.image || "",
    imageUrl: item.imageUrl || item.image || "",
    is_active: Boolean(item.isActive ?? item.is_active ?? true),
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    sort_order: Number(item.sortOrder ?? item.sort_order ?? 1),
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? 1),
    tags: Array.isArray(item.tags)
      ? item.tags
      : typeof item.tags === "string" && item.tags.length > 0
      ? item.tags.split(",").map((t: string) => t.trim())
      : [],
  };
}

export function normalizeTable(tbl: any): RestaurantTable {
  if (!tbl) return tbl;
  return {
    ...tbl,
    id: tbl.id,
    name: tbl.name,
    description: tbl.description || "",
    image_url: tbl.imageUrl || tbl.image_url || "",
    imageUrl: tbl.imageUrl || tbl.image_url || "",
    is_active: Boolean(tbl.isActive ?? tbl.is_active ?? true),
    isActive: Boolean(tbl.isActive ?? tbl.is_active ?? true),
    sort_order: Number(tbl.sortOrder ?? tbl.sort_order ?? 1),
    sortOrder: Number(tbl.sortOrder ?? tbl.sort_order ?? 1),
    capacity: Number(tbl.capacity) || 4,
  };
}

export const apiClient = {
  // CUSTOMER APIS
  async getMenu(): Promise<MenuItem[]> {
    const res = await fetch("/api/menu");
    if (!res.ok) throw new Error("Gagal mengambil menu");
    const data = await res.json();
    return (data.menu || []).map(normalizeMenuItem);
  },

  async getTables(): Promise<RestaurantTable[]> {
    const res = await fetch("/api/tables");
    if (!res.ok) throw new Error("Gagal mengambil meja");
    const data = await res.json();
    return (data.tables || []).map(normalizeTable);
  },

  async getSchedule(date: string) {
    const res = await fetch(`/api/schedule?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error("Gagal mengambil jadwal");
    return res.json();
  },

  async getAvailability(date: string) {
    const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error("Gagal mengambil ketersediaan meja");
    return res.json();
  },

  async uploadPaymentProof(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mengunggah file bukti transfer");
    return { url: data.url, filename: data.filename };
  },

  async createReservation(payload: any): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Gagal membuat reservasi." };
    }
    return { success: true, reservation: normalizeReservation(data.reservation) };
  },

  async getReservationByCode(code: string): Promise<Reservation | null> {
    const res = await fetch(`/api/reservations/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.reservation ? normalizeReservation(data.reservation) : null;
  },

  async getSettings() {
    const res = await fetch("/api/settings");
    if (!res.ok) throw new Error("Gagal mengambil pengaturan");
    const data = await res.json();
    return data.settings;
  },

  // ADMIN APIS
  admin: {
    async getDashboard() {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Gagal memuat dashboard");
      const data = await res.json();
      return {
        ...data,
        todayReservations: (data.todayReservations || []).map(normalizeReservation),
        recentPending: (data.recentPending || []).map(normalizeReservation),
      };
    },

    async getReservations(params?: { status?: string; date?: string; search?: string }): Promise<Reservation[]> {
      const sp = new URLSearchParams();
      if (params?.status && params.status !== "ALL") sp.set("status", params.status);
      if (params?.date) sp.set("date", params.date);
      if (params?.search) sp.set("search", params.search);

      const res = await fetch(`/api/admin/reservations?${sp.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data reservasi");
      const data = await res.json();
      return (data.reservations || []).map(normalizeReservation);
    },

    async updateReservationStatus(id: string, status: string, rejectionReason?: string) {
      const res = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rejectionReason }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status reservasi");
      const data = await res.json();
      return {
        ...data,
        reservation: data.reservation ? normalizeReservation(data.reservation) : undefined,
      };
    },

    async getMenu(): Promise<MenuItem[]> {
      const res = await fetch("/api/admin/menu");
      if (!res.ok) throw new Error("Gagal mengambil menu admin");
      const data = await res.json();
      return (data.menu || []).map(normalizeMenuItem);
    },

    async createMenuItem(payload: any): Promise<MenuItem> {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat menu");
      return normalizeMenuItem(data.item);
    },

    async updateMenuItem(id: string, payload: any) {
      const res = await fetch(`/api/admin/menu/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal mengubah menu");
      const data = await res.json();
      return {
        ...data,
        item: data.item ? normalizeMenuItem(data.item) : undefined,
      };
    },

    async deleteMenuItem(id: string) {
      const res = await fetch(`/api/admin/menu/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus menu");
      return res.json();
    },

    async getTables(): Promise<RestaurantTable[]> {
      const res = await fetch("/api/admin/tables");
      if (!res.ok) throw new Error("Gagal mengambil meja admin");
      const data = await res.json();
      return (data.tables || []).map(normalizeTable);
    },

    async updateTable(id: string, payload: any) {
      const res = await fetch(`/api/admin/tables/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal mengubah data meja");
      const data = await res.json();
      return {
        ...data,
        table: data.table ? normalizeTable(data.table) : undefined,
      };
    },

    async getSchedule() {
      const res = await fetch("/api/admin/schedule");
      if (!res.ok) throw new Error("Gagal mengambil jadwal admin");
      return res.json();
    },

    async updateWeeklySchedule(weekly: any[]) {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekly }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui jadwal mingguan");
      return res.json();
    },

    async addDateOverride(payload: any) {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah date override");
      return data.override;
    },

    async deleteDateOverride(id: string) {
      const res = await fetch(`/api/admin/schedule?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus date override");
      return res.json();
    },

    async updateSettings(payload: any) {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal memperbarui pengaturan");
      const data = await res.json();
      return data.settings;
    },
  },
};
