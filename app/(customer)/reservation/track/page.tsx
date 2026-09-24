"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  PhoneCall,
  Calendar,
  Layers,
  Utensils,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LUnionStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { Reservation } from "@/lib/types";
import { formatSimpleIDR } from "@/lib/utils";

export default function TrackReservationPage() {
  const [searchCode, setSearchCode] = React.useState("");
  const [reservation, setReservation] = React.useState<Reservation | null>(null);
  const [searched, setSearched] = React.useState(false);
  const [searching, setSearching] = React.useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearching(true);
    try {
      const fromApi = await apiClient.getReservationByCode(searchCode.trim());
      if (fromApi) {
        setReservation(fromApi);
      } else {
        const fromStore = LUnionStore.getReservationByCode(searchCode.trim());
        setReservation(fromStore || null);
      }
    } catch {
      const fromStore = LUnionStore.getReservationByCode(searchCode.trim());
      setReservation(fromStore || null);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  return (
    <div className="container py-12 md:py-20 max-w-2xl space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold tracking-[0.25em] text-tomato-600 uppercase font-sans">
          Self-Service Tracker
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
          Lacak Status Reservasi
        </h1>
        <p className="text-charcoal-600 text-sm">
          Masukkan kode reservasi Anda (contoh: <code>MYO-B8X12</code>) untuk memeriksa status persetujuan dari tim admin L'Union Pizza.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-3 rounded-2xl border border-cream-200 shadow-sm flex gap-2">
        <Input
          placeholder="Ketik kode reservasi (MYO-XXXXX)..."
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
          className="font-mono text-base tracking-wider uppercase h-12"
        />
        <Button type="submit" className="bg-tomato-600 hover:bg-tomato-700 text-white px-6 h-12">
          <Search className="w-4 h-4 mr-2" />
          Cari
        </Button>
      </form>

      {/* Search Result */}
      {searched && reservation && (
        <Card className="bg-white border-cream-200 shadow-lg overflow-hidden animate-fade-in">
          <div className="p-6 bg-charcoal-900 text-cream-50 flex items-center justify-between">
            <div>
              <span className="text-xs text-cream-400 uppercase tracking-wider block">
                Kode Reservasi
              </span>
              <span className="font-mono text-2xl font-bold text-tomato-400">
                {reservation.code}
              </span>
            </div>
            <div>
              {reservation.status === "CONFIRMED" && (
                <Badge variant="confirmed" className="text-xs px-3 py-1 font-semibold uppercase">
                  ✓ CONFIRMED
                </Badge>
              )}
              {reservation.status === "PENDING" && (
                <Badge variant="pending" className="text-xs px-3 py-1 font-semibold uppercase">
                  ⏳ PENDING
                </Badge>
              )}
              {reservation.status === "REJECTED" && (
                <Badge variant="rejected" className="text-xs px-3 py-1 font-semibold uppercase">
                  ✕ REJECTED
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {reservation.status === "CONFIRMED" && (
              <div className="p-4 rounded-xl bg-olive-50 border border-olive-200 text-olive-900 text-sm flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-olive-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Reservasi Dikonfirmasi!</span>
                  <span>Meja {reservation.table_name} telah siap untuk kunjungan Anda pada {reservation.date} jam {reservation.time} WIB. Sampai jumpa di L'Union Pizza!</span>
                </div>
              </div>
            )}

            {reservation.status === "PENDING" && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Menunggu Konfirmasi Admin</span>
                  <span>Bukti pembayaran Anda sedang diverifikasi. Jika butuh konfirmasi segera, hubungi kami via WhatsApp.</span>
                </div>
              </div>
            )}

            {reservation.status === "REJECTED" && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Reservasi Ditolak</span>
                  <span>Alasan: {reservation.rejection_reason || "Bukti transfer tidak valid atau slot waktu tidak tersedia."}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-charcoal-400 block">Jadwal:</span>
                <span className="font-semibold text-charcoal-900">
                  {reservation.date} • {reservation.time} WIB
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-charcoal-400 block">Meja & Tamu:</span>
                <span className="font-semibold text-charcoal-900">
                  Meja {reservation.table_name} ({reservation.pax} Pax)
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-charcoal-400 block">Pemesan:</span>
                <span className="font-semibold text-charcoal-900">
                  {reservation.customer_name} ({reservation.customer_whatsapp})
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-charcoal-400 block">Pizza:</span>
                <span className="font-semibold text-charcoal-900">
                  {reservation.is_special_kreasi
                    ? `Kreasi: ${reservation.flavor_1_name} & ${reservation.flavor_2_name}`
                    : reservation.menu_name}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/6285226099883?text=${encodeURIComponent(
                  `Halo L'Union Pizza, ingin konfirmasi status reservasi kode ${reservation.code}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-olive-600 hover:bg-olive-700 text-white text-xs">
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Hubungi Admin via WhatsApp
                </Button>
              </a>
              <Link href="/reservation" className="flex-1">
                <Button variant="outline" className="w-full text-xs">
                  Buat Reservasi Baru
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {searched && !reservation && (
        <div className="p-8 text-center bg-white rounded-2xl border border-cream-200 space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-charcoal-900">
            Kode "{searchCode}" Tidak Ditemukan
          </h3>
          <p className="text-xs text-charcoal-500">
            Periksa kembali penulisan kode reservasi Anda atau hubungi admin jika reservasi baru saja dibuat.
          </p>
        </div>
      )}
    </div>
  );
}
