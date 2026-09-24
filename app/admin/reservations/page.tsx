"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Phone,
  Layers,
  Utensils,
  ExternalLink,
  ZoomIn,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LUnionStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { Reservation, ReservationStatus } from "@/lib/types";
import { formatSimpleIDR } from "@/lib/utils";

function ReservationsManagementContent() {
  const searchParams = useSearchParams();
  const initialStatusFilter = searchParams.get("status") || "ALL";

  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter);
  const [dateFilter, setDateFilter] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals
  const [selectedRes, setSelectedRes] = React.useState<Reservation | null>(null);
  const [detailOpen, setDetailOpen] = React.useState<boolean>(false);
  const [proofModalOpen, setProofModalOpen] = React.useState<boolean>(false);
  const [proofModalUrl, setProofModalUrl] = React.useState<string>("");

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = React.useState<boolean>(false);
  const [rejectingRes, setRejectingRes] = React.useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState<string>("Bukti transfer tidak valid atau tidak terbaca.");

  const loadData = React.useCallback(async () => {
    try {
      const fromApi = await apiClient.admin.getReservations({
        status: statusFilter,
        date: dateFilter,
        search: searchQuery,
      });
      if (fromApi) {
        setReservations(fromApi);
        return;
      }
    } catch {
      // Fallback to store
    }
    setReservations(LUnionStore.getReservations());
  }, [statusFilter, dateFilter, searchQuery]);

  React.useEffect(() => {
    loadData();
    window.addEventListener("lunion_store_updated", loadData);
    return () => window.removeEventListener("lunion_store_updated", loadData);
  }, [loadData]);

  // Filter reservations
  const filteredReservations = React.useMemo(() => {
    return reservations.filter((r) => {
      const matchStatus =
        statusFilter === "ALL" || r.status === statusFilter;
      const matchDate = !dateFilter || r.date === dateFilter;
      const custName = r.customer_name || (r as any).customerName || "";
      const custWa = r.customer_whatsapp || (r as any).customerWhatsapp || "";
      const rCode = r.code || "";
      const matchSearch =
        !searchQuery ||
        rCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custWa.includes(searchQuery);

      return matchStatus && matchDate && matchSearch;
    });
  }, [reservations, statusFilter, dateFilter, searchQuery]);

  const handleConfirm = async (r: Reservation) => {
    try {
      await apiClient.admin.updateReservationStatus(r.id, "CONFIRMED");
      LUnionStore.updateReservationStatus(r.code, "CONFIRMED");
      if (selectedRes && selectedRes.code === r.code) {
        setSelectedRes({ ...selectedRes, status: "CONFIRMED" });
      }
      await loadData();
    } catch (err: any) {
      alert("Gagal mengonfirmasi reservasi: " + (err?.message || "Error server"));
    }
  };

  const openRejectModal = (r: Reservation) => {
    setRejectingRes(r);
    setRejectionReason("Bukti transfer tidak valid atau tidak terbaca.");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (rejectingRes) {
      try {
        await apiClient.admin.updateReservationStatus(rejectingRes.id, "REJECTED", rejectionReason);
        LUnionStore.updateReservationStatus(rejectingRes.code, "REJECTED", rejectionReason);
        setRejectModalOpen(false);
        if (selectedRes && selectedRes.code === rejectingRes.code) {
          setSelectedRes({ ...selectedRes, status: "REJECTED", rejection_reason: rejectionReason });
        }
        await loadData();
      } catch (err: any) {
        alert("Gagal menolak reservasi: " + (err?.message || "Error server"));
      }
    }
  };

  const openProofModal = (url: string) => {
    setProofModalUrl(url);
    setProofModalOpen(true);
  };

  const openDetailModal = (r: Reservation) => {
    setSelectedRes(r);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-tomato-600 uppercase font-sans">
            Back Office
          </span>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Reservation Management
          </h1>
          <p className="text-xs text-charcoal-500">
            Kelola, setujui, dan tolak reservasi pelanggan serta tinjau bukti pembayaran fee.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white border-cream-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
              <Input
                placeholder="Cari kode (MYO-...), nama customer, atau nomor WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs sm:text-sm bg-cream-50/50"
              />
            </div>

            {/* Date filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-charcoal-500 whitespace-nowrap">Filter Tanggal:</span>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs w-44 bg-cream-50/50"
              />
              {dateFilter && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDateFilter("")}
                  className="text-xs text-charcoal-500 h-9 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center space-x-2 border-t border-cream-200 pt-3 overflow-x-auto">
            {["ALL", "PENDING", "CONFIRMED", "REJECTED"].map((st) => {
              const count =
                st === "ALL"
                  ? reservations.length
                  : reservations.filter((r) => r.status === st).length;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-charcoal-900 text-white shadow-sm font-semibold"
                      : "bg-cream-100 text-charcoal-700 hover:bg-cream-200"
                  }`}
                >
                  <span>{st === "ALL" ? "Semua Status" : st}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      statusFilter === st ? "bg-charcoal-700 text-cream-100" : "bg-cream-200 text-charcoal-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Reservation Table (PRD #27) */}
      <Card className="bg-white border-cream-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-charcoal-900 text-cream-50 border-b border-charcoal-800">
                  <th className="p-3.5 font-semibold">KODE</th>
                  <th className="p-3.5 font-semibold">WAKTU &amp; TANGGAL</th>
                  <th className="p-3.5 font-semibold">CUSTOMER</th>
                  <th className="p-3.5 font-semibold">MEJA</th>
                  <th className="p-3.5 font-semibold">MENU PIZZA</th>
                  <th className="p-3.5 font-semibold text-center">BUKTI</th>
                  <th className="p-3.5 font-semibold text-center">STATUS</th>
                  <th className="p-3.5 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-charcoal-400">
                      Tidak ada reservasi yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-cream-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-xs text-tomato-600">
                        {r.code}
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold block text-charcoal-900">{r.date}</span>
                        <span className="font-mono text-xs text-charcoal-500">{r.time} WIB</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold block text-charcoal-900">{r.customer_name}</span>
                        <span className="text-xs text-charcoal-500 font-mono">{r.customer_whatsapp}</span>
                        <span className="text-[11px] text-charcoal-400 block">{r.pax} Pax</span>
                      </td>

                      <td className="p-3.5 font-semibold text-charcoal-800">
                        {r.table_name}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        {r.is_special_kreasi ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-tomato-600 uppercase tracking-wide block">
                              Special Kreasi (Mix 2)
                            </span>
                            <span className="font-medium text-xs text-charcoal-900 block truncate">
                              {r.flavor_1_name} &amp; {r.flavor_2_name}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-charcoal-900 block truncate">
                            {r.menu_name}
                          </span>
                        )}
                        <span className="font-mono text-xs text-charcoal-500">
                          {formatSimpleIDR(r.total_product_price)}
                        </span>
                      </td>

                      {/* Payment Proof Thumbnail */}
                      <td className="p-3.5 text-center">
                        {r.payment_proof_url ? (
                          <button
                            type="button"
                            onClick={() => openProofModal(r.payment_proof_url)}
                            className="relative w-10 h-10 rounded-lg overflow-hidden border border-cream-300 hover:ring-2 hover:ring-tomato-500 transition-all inline-block group"
                            title="Klik untuk memperbesar bukti"
                          >
                            <Image
                              src={r.payment_proof_url}
                              alt="Bukti Transfer"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-charcoal-400 italic">Tidak ada</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {r.status === "CONFIRMED" && <Badge variant="confirmed">Confirmed</Badge>}
                        {r.status === "PENDING" && <Badge variant="pending">Pending</Badge>}
                        {r.status === "REJECTED" && <Badge variant="rejected">Rejected</Badge>}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDetailModal(r)}
                            className="text-xs h-8 px-2 text-charcoal-700 hover:text-charcoal-900"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Detail
                          </Button>

                          {r.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleConfirm(r)}
                                className="bg-olive-600 hover:bg-olive-700 text-white text-xs h-8 px-2.5"
                                title="Konfirmasi Reservasi"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectModal(r)}
                                className="text-xs h-8 px-2"
                                title="Tolak Reservasi"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {r.status === "CONFIRMED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRejectModal(r)}
                              className="text-xs h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                              title="Batalkan & Tolak"
                            >
                              Cancel
                            </Button>
                          )}

                          {r.status === "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirm(r)}
                              className="text-xs h-8 px-2 text-olive-700 border-olive-200 hover:bg-olive-50"
                              title="Pulihkan ke Confirmed"
                            >
                              Re-confirm
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DETAIL MODAL (PRD #28) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Detail Reservasi: {selectedRes?.code}</DialogTitle>
            <DialogDescription className="text-xs">
              Dibuat pada: {selectedRes?.created_at ? new Date(selectedRes.created_at).toLocaleString("id-ID") : "-"}
            </DialogDescription>
          </DialogHeader>

          {selectedRes && (
            <div className="space-y-5 text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream-100 border border-cream-200">
                <div>
                  <span className="text-xs text-charcoal-500 uppercase block">Status Saat Ini:</span>
                  <div className="pt-0.5">
                    {selectedRes.status === "CONFIRMED" && <Badge variant="confirmed">CONFIRMED (Terkunci)</Badge>}
                    {selectedRes.status === "PENDING" && <Badge variant="pending">PENDING (Menunggu Verifikasi)</Badge>}
                    {selectedRes.status === "REJECTED" && <Badge variant="rejected">REJECTED (Slot Bebas)</Badge>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-charcoal-500 uppercase block">Booking Fee (SeaBank):</span>
                  <span className="font-mono font-bold text-olive-700 text-base">
                    {formatSimpleIDR(selectedRes.booking_fee)}
                  </span>
                </div>
              </div>

              {selectedRes.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                  <strong>Alasan Penolakan:</strong> {selectedRes.rejection_reason}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-charcoal-400">Jadwal:</span>
                  <p className="font-bold text-charcoal-900">{selectedRes.date} • {selectedRes.time} WIB</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-charcoal-400">Meja:</span>
                  <p className="font-bold text-charcoal-900">{selectedRes.table_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-charcoal-400">Nama Customer:</span>
                  <p className="font-bold text-charcoal-900">{selectedRes.customer_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-charcoal-400">WhatsApp:</span>
                  <p className="font-mono font-semibold text-charcoal-900">
                    <a
                      href={`https://wa.me/${selectedRes.customer_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-tomato-600 hover:underline flex items-center"
                    >
                      {selectedRes.customer_whatsapp}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-charcoal-400">Pax:</span>
                  <p className="font-semibold text-charcoal-900">{selectedRes.pax} Orang</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-charcoal-400">Total Harga Produk:</span>
                  <p className="font-mono font-bold text-charcoal-900">{formatSimpleIDR(selectedRes.total_product_price)}</p>
                </div>
              </div>

              {selectedRes.note && (
                <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs">
                  <span className="font-bold text-charcoal-700 block mb-0.5">Catatan Khusus:</span>
                  <span className="text-charcoal-800">{selectedRes.note}</span>
                </div>
              )}

              {/* Menu info */}
              <div className="p-3 rounded-xl bg-cream-100 border border-cream-200 text-xs space-y-1">
                <span className="font-bold text-charcoal-800 block">Detail Menu Terpilih:</span>
                {selectedRes.is_special_kreasi ? (
                  <p className="text-charcoal-900">
                    Special Kreasi: <strong>{selectedRes.flavor_1_name}</strong> ({formatSimpleIDR(selectedRes.flavor_1_price || 0)}) + <strong>{selectedRes.flavor_2_name}</strong> ({formatSimpleIDR(selectedRes.flavor_2_price || 0)})
                  </p>
                ) : (
                  <p className="text-charcoal-900">
                    Single Signature Pizza: <strong>{selectedRes.menu_name}</strong>
                  </p>
                )}
              </div>

              {/* Proof thumbnail preview in modal */}
              {selectedRes.payment_proof_url && (
                <div>
                  <span className="text-xs font-bold text-charcoal-800 block mb-2">
                    Bukti Pembayaran Fee (Klik untuk memperbesar):
                  </span>
                  <div
                    onClick={() => openProofModal(selectedRes.payment_proof_url)}
                    className="relative w-36 h-36 rounded-xl overflow-hidden border border-cream-300 cursor-pointer hover:opacity-90 shadow-sm"
                  >
                    <Image
                      src={selectedRes.payment_proof_url}
                      alt="Proof"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            {selectedRes?.status === "PENDING" && (
              <>
                <Button
                  onClick={() => {
                    handleConfirm(selectedRes);
                    setDetailOpen(false);
                  }}
                  className="bg-olive-600 hover:bg-olive-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Konfirmasi Reservasi
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailOpen(false);
                    openRejectModal(selectedRes);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Tolak Reservasi
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PAYMENT PROOF LIGHTBOX MODAL (PRD #28, 57) */}
      <Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
        <DialogContent className="max-w-3xl p-4 bg-charcoal-950 text-cream-50 border-charcoal-800">
          <DialogHeader>
            <DialogTitle className="text-cream-50 text-lg flex items-center justify-between">
              <span>Preview Bukti Transfer Pembayaran Fee</span>
              {proofModalUrl && (
                <a
                  href={proofModalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-tomato-400 hover:underline flex items-center font-normal"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Buka Gambar Asli
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/50 border border-charcoal-800 mt-2">
            {proofModalUrl && (
              <Image
                src={proofModalUrl}
                alt="Payment Proof Full"
                fill
                unoptimized
                className="object-contain"
              />
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              className="border-charcoal-700 text-cream-100 hover:bg-charcoal-800"
              onClick={() => setProofModalOpen(false)}
            >
              Tutup Lightbox
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECTION REASON MODAL (PRD #57) */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Tolak Reservasi {rejectingRes?.code}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Slot meja akan kembali berstatus <strong>Available</strong> di sistem customer. Masukkan alasan penolakan untuk catatan customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-charcoal-700">Alasan Penolakan:</label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Bukti transfer tidak terbaca / nominal tidak sesuai"
              className="text-sm"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              Tolak &amp; Bebaskan Meja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-charcoal-500">Memuat manajemen reservasi...</div>}>
      <ReservationsManagementContent />
    </React.Suspense>
  );
}
