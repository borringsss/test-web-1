"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  UtensilsCrossed,
  Layers,
  Sparkles,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LUnionStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { Reservation, RestaurantTable } from "@/lib/types";
import { formatSimpleIDR, getFormattedDateOffset } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [metrics, setMetrics] = React.useState<{
    total: number;
    pending: number;
    confirmed: number;
    totalPax: number;
  }>({ total: 0, pending: 0, confirmed: 0, totalPax: 0 });
  const [todayReservations, setTodayReservations] = React.useState<Reservation[]>([]);
  const todayStr = getFormattedDateOffset(0);

  const loadData = React.useCallback(async () => {
    try {
      const data = await apiClient.admin.getDashboard();
      if (data && data.metrics) {
        setMetrics(data.metrics);
        setTodayReservations(data.todayReservations || []);
        const allRes = await apiClient.admin.getReservations();
        setReservations(allRes || []);
        return;
      }
    } catch {
      // Fallback to store
    }
    const storeRes = LUnionStore.getReservations();
    setReservations(storeRes);
    setTodayReservations(storeRes.filter((r) => r.date === todayStr));
    setMetrics({
      total: storeRes.length,
      pending: storeRes.filter((r) => r.status === "PENDING").length,
      confirmed: storeRes.filter((r) => r.status === "CONFIRMED").length,
      totalPax: storeRes
        .filter((r) => r.status !== "REJECTED")
        .reduce((sum, r) => sum + r.pax, 0),
    });
  }, [todayStr]);

  React.useEffect(() => {
    loadData();
    window.addEventListener("lunion_store_updated", loadData);
    return () => window.removeEventListener("lunion_store_updated", loadData);
  }, [loadData]);

  // KPIs
  const totalReservations = metrics.total;
  const pendingReservations = reservations.filter((r) => r.status === "PENDING");
  const confirmedReservations = reservations.filter((r) => r.status === "CONFIRMED");
  const totalPax = metrics.totalPax;

  const handleQuickConfirm = async (r: Reservation) => {
    try {
      await apiClient.admin.updateReservationStatus(r.id, "CONFIRMED");
      LUnionStore.updateReservationStatus(r.code, "CONFIRMED");
      await loadData();
    } catch (err: any) {
      alert("Gagal mengonfirmasi reservasi: " + (err?.message || "Error server"));
    }
  };

  const handleQuickReject = async (r: Reservation) => {
    const reason = prompt("Masukkan alasan penolakan (opsional):", "Bukti transfer tidak sesuai / tidak terbaca");
    if (reason !== null) {
      try {
        await apiClient.admin.updateReservationStatus(r.id, "REJECTED", reason);
        LUnionStore.updateReservationStatus(r.code, "REJECTED", reason);
        await loadData();
      } catch (err: any) {
        alert("Gagal menolak reservasi: " + (err?.message || "Error server"));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-tomato-600 uppercase font-sans">
            Overview & Metrics
          </span>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Back Office Dashboard
          </h1>
          <p className="text-xs text-charcoal-500">
            Hari ini: <strong>{todayStr}</strong> • Ringkasan operasional dan status reservasi tamu.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/admin/reservations">
            <Button className="bg-tomato-600 hover:bg-tomato-700 text-white text-xs">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Kelola Semua Reservasi
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS (PRD #26) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reservations */}
        <Card className="bg-white border-cream-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
                Total Reservations
              </span>
              <p className="font-serif text-3xl font-bold text-charcoal-900">
                {totalReservations}
              </p>
              <span className="text-[11px] text-charcoal-400">Seluruh riwayat booking</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center text-charcoal-800">
              <CalendarDays className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Waiting */}
        <Card className="bg-white border-amber-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Pending Approval
              </span>
              <p className="font-serif text-3xl font-bold text-amber-600">
                {pendingReservations.length}
              </p>
              <span className="text-[11px] text-amber-800 font-medium">Menunggu review admin</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Confirmed */}
        <Card className="bg-white border-olive-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-olive-700 uppercase tracking-wider">
                Confirmed Bookings
              </span>
              <p className="font-serif text-3xl font-bold text-olive-600">
                {confirmedReservations.length}
              </p>
              <span className="text-[11px] text-olive-800 font-medium">Slot terkunci di papan</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-olive-50 flex items-center justify-center text-olive-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Pax */}
        <Card className="bg-white border-cream-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
                Total Guests (Pax)
              </span>
              <p className="font-serif text-3xl font-bold text-charcoal-900">
                {totalPax}
              </p>
              <span className="text-[11px] text-charcoal-400">Tamu aktif terlayani</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center text-charcoal-800">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PENDING RESERVATIONS ACTION BOARD (PRD #54) */}
      <Card className="bg-white border-cream-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center text-charcoal-900">
              <Clock className="w-5 h-5 text-amber-500 mr-2" />
              Perlu Konfirmasi Segera ({pendingReservations.length})
            </CardTitle>
            <p className="text-xs text-charcoal-500">
              Tinjau bukti transfer booking fee Rp10.000 dan berikan persetujuan untuk mengunci slot meja.
            </p>
          </div>
          <Link href="/admin/reservations?status=PENDING">
            <Button variant="ghost" size="sm" className="text-xs text-charcoal-600">
              Lihat Semua Pending →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {pendingReservations.length === 0 ? (
            <div className="py-8 text-center bg-cream-50 rounded-xl border border-cream-200/80">
              <CheckCircle2 className="w-8 h-8 text-olive-600 mx-auto mb-2" />
              <p className="font-serif font-bold text-charcoal-800 text-base">Semua Reservasi Bersih</p>
              <p className="text-xs text-charcoal-500 mt-0.5">Tidak ada reservasi yang menunggu konfirmasi saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-cream-200 text-charcoal-500 text-xs">
                    <th className="pb-3 font-semibold">KODE</th>
                    <th className="pb-3 font-semibold">JADWAL</th>
                    <th className="pb-3 font-semibold">TAMU</th>
                    <th className="pb-3 font-semibold">MEJA</th>
                    <th className="pb-3 font-semibold">MENU</th>
                    <th className="pb-3 font-semibold text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {pendingReservations.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-cream-50/50">
                      <td className="py-3 font-mono font-bold text-xs text-tomato-600">
                        {r.code}
                      </td>
                      <td className="py-3 text-xs">
                        <span className="font-semibold block">{r.date}</span>
                        <span className="font-mono text-charcoal-500">{r.time} WIB</span>
                      </td>
                      <td className="py-3 text-xs">
                        <span className="font-bold block text-charcoal-900">{r.customer_name}</span>
                        <span className="font-mono text-charcoal-500">{r.customer_whatsapp}</span>
                      </td>
                      <td className="py-3 text-xs font-semibold text-charcoal-800">
                        {r.table_name}
                      </td>
                      <td className="py-3 text-xs">
                        {r.is_special_kreasi ? (
                          <span className="text-tomato-700 font-medium">
                            Kreasi: {r.flavor_1_name} &amp; {r.flavor_2_name}
                          </span>
                        ) : (
                          <span>{r.menu_name}</span>
                        )}
                        <span className="block text-[11px] text-charcoal-400 font-mono">
                          {formatSimpleIDR(r.total_product_price)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleQuickConfirm(r)}
                            className="bg-olive-600 hover:bg-olive-700 text-white text-xs h-8 px-3"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleQuickReject(r)}
                            className="text-xs h-8 px-2.5"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TODAY'S OCCUPANCY TIMELINE (PRD #54) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-cream-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-xl text-charcoal-900">
                Reservasi Hari Ini ({todayStr})
              </CardTitle>
              <p className="text-xs text-charcoal-500">
                {todayReservations.length} total jadwal tercatat untuk hari ini.
              </p>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {todayReservations.filter((r) => r.status === "CONFIRMED").length} Confirmed
            </Badge>
          </CardHeader>
          <CardContent>
            {todayReservations.length === 0 ? (
              <p className="text-xs text-charcoal-500 italic py-6 text-center">
                Belum ada reservasi untuk tanggal hari ini.
              </p>
            ) : (
              <div className="space-y-2.5">
                {todayReservations.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-cream-200 flex items-center justify-between hover:bg-cream-50/60 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-charcoal-900 bg-cream-100 px-2 py-1 rounded">
                        {r.time}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-charcoal-900">{r.customer_name}</h4>
                        <p className="text-xs text-charcoal-500">
                          Meja {r.table_name} • {r.pax} Pax • {r.is_special_kreasi ? `Kreasi 2 Rasa` : r.menu_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {r.status === "CONFIRMED" && <Badge variant="confirmed">Confirmed</Badge>}
                      {r.status === "PENDING" && <Badge variant="pending">Pending</Badge>}
                      {r.status === "REJECTED" && <Badge variant="rejected">Rejected</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Management Shortcuts */}
        <Card className="bg-white border-cream-200">
          <CardHeader>
            <CardTitle className="text-xl text-charcoal-900">Akses Cepat</CardTitle>
            <p className="text-xs text-charcoal-500">Pusat pengaturan sistem back office.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/menu" className="block">
              <div className="p-3 rounded-xl border border-cream-200 hover:border-tomato-500 hover:bg-cream-50/50 transition-all flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center text-charcoal-800">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-charcoal-900">Menu &amp; Harga</h5>
                    <p className="text-[11px] text-charcoal-500">Update harga &amp; varian pizza</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-400" />
              </div>
            </Link>

            <Link href="/admin/tables" className="block">
              <div className="p-3 rounded-xl border border-cream-200 hover:border-tomato-500 hover:bg-cream-50/50 transition-all flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center text-charcoal-800">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-charcoal-900">Meja Napoli &amp; Romana</h5>
                    <p className="text-[11px] text-charcoal-500">Status aktif &amp; deskripsi meja</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-400" />
              </div>
            </Link>

            <Link href="/admin/schedule" className="block">
              <div className="p-3 rounded-xl border border-cream-200 hover:border-tomato-500 hover:bg-cream-50/50 transition-all flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center text-charcoal-800">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-charcoal-900">Jadwal &amp; Override</h5>
                    <p className="text-[11px] text-charcoal-500">Jam mingguan &amp; hari libur</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
