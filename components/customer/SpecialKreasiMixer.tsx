"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Check, AlertCircle } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { calculateSpecialKreasiPrice } from "@/lib/reservation-service";
import { formatSimpleIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SpecialKreasiMixerProps {
  menuItems: MenuItem[];
}

export function SpecialKreasiMixer({ menuItems }: SpecialKreasiMixerProps) {
  const activeItems = menuItems.filter((m) => m.is_active);

  // Defaults: Margherita (id 1) and Pepperoni (id 4)
  const defaultF1 = activeItems[0] || menuItems[0];
  const defaultF2 = activeItems.find((m) => m.name === "Pepperoni") || activeItems[3] || activeItems[1];

  const [flavor1Id, setFlavor1Id] = React.useState<string>(defaultF1?.id || "");
  const [flavor2Id, setFlavor2Id] = React.useState<string>(defaultF2?.id || "");

  const item1 = activeItems.find((m) => m.id === flavor1Id) || defaultF1;
  const item2 = activeItems.find((m) => m.id === flavor2Id) || defaultF2;

  const isSameFlavor = item1?.id === item2?.id;
  const totalPrice = item1 && item2 ? calculateSpecialKreasiPrice(item1.price, item2.price) : 0;

  return (
    <div className="bg-charcoal-900 text-cream-50 rounded-2xl p-6 md:p-10 border border-charcoal-800 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-tomato-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-olive-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left explanation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-tomato-600/20 text-tomato-400 text-xs font-semibold tracking-wide uppercase border border-tomato-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Signature Feature</span>
          </div>

          <h3 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-cream-50 leading-tight">
            Special Kreasi — <br />
            <span className="text-tomato-400 italic">Mix 2 Flavours</span>
          </h3>

          <p className="text-cream-300 text-sm md:text-base leading-relaxed">
            Tidak perlu berkompromi saat memilih topping. Gabungkan dua resep autentik favorit Anda dalam satu loyang pizza segar.
          </p>

          <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-xl p-4 space-y-2">
            <span className="text-xs uppercase tracking-wider text-cream-400 font-semibold block">
              Formula Transparan:
            </span>
            <div className="font-mono text-sm text-cream-100 flex items-center justify-between">
              <span>(Harga Rasa 1 + Harga Rasa 2) ÷ 2</span>
            </div>
            {item1 && item2 && !isSameFlavor && (
              <div className="text-xs text-cream-400 font-mono pt-1 border-t border-charcoal-800 flex justify-between">
                <span>
                  ({formatSimpleIDR(item1.price)} + {formatSimpleIDR(item2.price)}) ÷ 2 =
                </span>
                <span className="text-tomato-400 font-bold">{formatSimpleIDR(totalPrice)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right interactive builder */}
        <div className="lg:col-span-7 bg-charcoal-950/60 p-5 md:p-6 rounded-xl border border-charcoal-800/80 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flavor 1 Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-cream-300 uppercase tracking-wider flex items-center justify-between">
                <span>Rasa Sisi Kiri (Flavor 1)</span>
                <span className="text-tomato-400 font-mono">{item1 ? formatSimpleIDR(item1.price) : ""}</span>
              </label>
              <select
                value={flavor1Id}
                onChange={(e) => setFlavor1Id(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-3.5 py-2.5 text-sm text-cream-100 focus:outline-none focus:ring-2 focus:ring-tomato-500"
              >
                {activeItems.map((item) => (
                  <option key={`f1-${item.id}`} value={item.id}>
                    {item.name} — {formatSimpleIDR(item.price)}
                  </option>
                ))}
              </select>
              {item1 && (
                <p className="text-[11px] text-cream-400 line-clamp-2 leading-relaxed">
                  {item1.description}
                </p>
              )}
            </div>

            {/* Flavor 2 Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-cream-300 uppercase tracking-wider flex items-center justify-between">
                <span>Rasa Sisi Kanan (Flavor 2)</span>
                <span className="text-tomato-400 font-mono">{item2 ? formatSimpleIDR(item2.price) : ""}</span>
              </label>
              <select
                value={flavor2Id}
                onChange={(e) => setFlavor2Id(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-3.5 py-2.5 text-sm text-cream-100 focus:outline-none focus:ring-2 focus:ring-tomato-500"
              >
                {activeItems.map((item) => (
                  <option key={`f2-${item.id}`} value={item.id}>
                    {item.name} — {formatSimpleIDR(item.price)}
                  </option>
                ))}
              </select>
              {item2 && (
                <p className="text-[11px] text-cream-400 line-clamp-2 leading-relaxed">
                  {item2.description}
                </p>
              )}
            </div>
          </div>

          {/* Validation Warning */}
          {isSameFlavor ? (
            <div className="bg-red-950/60 border border-red-800/80 rounded-lg p-3 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                <strong>Aturan Special Kreasi:</strong> Rasa 1 dan Rasa 2 harus berbeda. Silakan pilih kombinasi dua menu yang berbeda.
              </span>
            </div>
          ) : (
            <div className="bg-charcoal-900/90 border border-charcoal-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-cream-400 block">Kombinasi Special Kreasi Anda:</span>
                <span className="font-serif text-lg font-bold text-cream-50">
                  {item1?.name} <span className="text-tomato-400">&</span> {item2?.name}
                </span>
                <span className="block text-xs text-olive-400 mt-0.5">
                  ✓ Topping 50/50 satu loyang
                </span>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="text-xs text-cream-400 block">Total Harga Pizza:</span>
                <span className="font-serif text-2xl font-bold text-tomato-400 font-mono">
                  {formatSimpleIDR(totalPrice)}
                </span>
              </div>
            </div>
          )}

          {/* CTA Button to start reservation with this combination */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={
                isSameFlavor
                  ? "/reservation"
                  : `/reservation?kreasi=true&f1=${flavor1Id}&f2=${flavor2Id}`
              }
              className="flex-1"
            >
              <Button
                disabled={isSameFlavor}
                className="w-full bg-tomato-600 hover:bg-tomato-700 text-white font-semibold py-3 shadow-md"
              >
                <span>Pesan Kreasi Ini Sekarang</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="outline" className="border-charcoal-700 text-cream-100 hover:bg-charcoal-800">
                Lihat Semua Rasa
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
