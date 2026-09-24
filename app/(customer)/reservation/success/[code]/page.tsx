"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  PhoneCall,
  Calendar,
  Layers,
  Utensils,
  User,
  ArrowRight,
  Share2,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LUnionStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { Reservation } from "@/lib/types";
import { formatSimpleIDR } from "@/lib/utils";

export default function ReservationSuccessPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase();
  const [reservation, setReservation] = React.useState<Reservation | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadReservation() {
      if (!code) return;
      try {
        const fromApi = await apiClient.getReservationByCode(code);
        if (fromApi) {
          setReservation(fromApi);
        } else {
          const fromStore = LUnionStore.getReservationByCode(code);
          setReservation(fromStore || null);
        }
      } catch {
        const fromStore = LUnionStore.getReservationByCode(code);
        setReservation(fromStore || null);
      } finally {
        setLoading(false);
      }

      // Fire confetti celebration
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if canvas not supported
      }
    }

    loadReservation();
  }, [code]);

  if (loading) {
    return (
      <div className="container py-20 text-center text-charcoal-500">
        Memeriksa data reservasi...
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-tomato-600 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-charcoal-900">
          Reservasi Tidak Ditemukan
        </h2>
        <p className="text-sm text-charcoal-600">
          Kode reservasi "{code}" tidak ditemukan dalam sistem. Pastikan Anda memasukkan kode yang sesuai.
        </p>
        <Link href="/reservation">
          <Button className="mt-4 bg-tomato-600 hover:bg-tomato-700 text-white">
            Buat Reservasi Baru
          </Button>
        </Link>
      </div>
    );
  }

  // Pre-filled WhatsApp message
  const waText = encodeURIComponent(
    `Halo L'Union Pizza, saya ingin konfirmasi reservasi MYO dengan kode ${reservation.code} atas nama ${reservation.customer_name} untuk tanggal ${reservation.date} jam ${reservation.time} WIB.`
  );
  const waUrl = `https://wa.me/6285226099883?text=${waText}`;

  return (
    <div className="container py-12 md:py-20 max-w-3xl">
      <div className="bg-white rounded-3xl border border-cream-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-charcoal-900 text-cream-50 p-8 sm:p-10 text-center space-y-4 relative">
          <div className="w-16 h-16 rounded-full bg-olive-500/20 border border-olive-500/40 text-olive-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold tracking-[0.25em] text-tomato-400 uppercase font-sans block">
            Make Your Own Pizza
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cream-50">
            Reservation Submitted
          </h1>

          <div className="inline-block bg-charcoal-950 px-6 py-2.5 rounded-xl border border-charcoal-800">
            <span className="text-[11px] text-cream-400 uppercase tracking-widest block font-medium">
              Reservation Code:
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold text-tomato-400 tracking-wider">
              {reservation.code}
            </span>
          </div>

          <div className="pt-2">
            <Badge variant="pending" className="text-xs px-3 py-1 font-semibold uppercase tracking-wider">
              Status: {reservation.status}
            </Badge>
          </div>

          <p className="text-sm text-cream-300 max-w-lg mx-auto leading-relaxed pt-1">
            "Your reservation is waiting for confirmation. Tim admin L'Union Pizza sedang memvalidasi bukti transfer booking fee Anda."
          </p>
        </div>

        {/* Reservation Receipt Body */}
        <div className="p-6 sm:p-10 space-y-8">
          <div>
            <h3 className="font-serif text-xl font-bold text-charcoal-900 border-b border-cream-200 pb-3 mb-4">
              Ringkasan Jadwal & Tamu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-cream-50 border border-cream-200/80">
                <Calendar className="w-5 h-5 text-tomato-600 shrink-0" />
                <div>
                  <span className="text-xs text-charcoal-500 block">Tanggal:</span>
                  <span className="font-semibold text-charcoal-900">{reservation.date}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-cream-50 border border-cream-200/80">
                <Clock className="w-5 h-5 text-tomato-600 shrink-0" />
                <div>
                  <span className="text-xs text-charcoal-500 block">Waktu:</span>
                  <span className="font-mono font-bold text-charcoal-900">{reservation.time} WIB</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-cream-50 border border-cream-200/80">
                <Layers className="w-5 h-5 text-tomato-600 shrink-0" />
                <div>
                  <span className="text-xs text-charcoal-500 block">Meja Pilihan:</span>
                  <span className="font-semibold text-charcoal-900">{reservation.table_name}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-cream-50 border border-cream-200/80">
                <User className="w-5 h-5 text-tomato-600 shrink-0" />
                <div>
                  <span className="text-xs text-charcoal-500 block">Nama Tamu & Pax:</span>
                  <span className="font-semibold text-charcoal-900">
                    {reservation.customer_name} ({reservation.pax} Pax)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-bold text-charcoal-900 border-b border-cream-200 pb-3 mb-4">
              Menu & Pembayaran
            </h3>
            <div className="p-4 rounded-xl bg-cream-100/60 border border-cream-200 space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-charcoal-500 block">Pesanan Pizza:</span>
                  {reservation.is_special_kreasi ? (
                    <span className="font-serif font-bold text-base text-charcoal-900">
                      Special Kreasi: {reservation.flavor_1_name} &amp; {reservation.flavor_2_name}
                    </span>
                  ) : (
                    <span className="font-serif font-bold text-base text-charcoal-900">
                      {reservation.menu_name}
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-charcoal-900">
                  {formatSimpleIDR(reservation.total_product_price)}
                </span>
              </div>

              <div className="pt-2 border-t border-cream-200 flex justify-between text-xs text-olive-700 font-semibold">
                <span>Booking Fee (Telah Ditransfer via SeaBank):</span>
                <span className="font-mono">{formatSimpleIDR(reservation.booking_fee)}</span>
              </div>

              <div className="flex justify-between text-xs text-charcoal-500 italic">
                <span>Sisa pelunasan di kasir:</span>
                <span className="font-mono">
                  {formatSimpleIDR(Math.max(0, reservation.total_product_price - reservation.booking_fee))}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 space-y-4">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button size="lg" className="w-full bg-olive-600 hover:bg-olive-700 text-white font-semibold py-4 text-base shadow-md">
                <PhoneCall className="w-5 h-5 mr-2" />
                <span>Contact via WhatsApp (0852-2609-9883)</span>
              </Button>
            </a>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/reservation/track" className="flex-1">
                <Button variant="outline" className="w-full border-charcoal-300">
                  Cek Status Reservasi Nanti
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="ghost" className="w-full text-charcoal-700">
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
