"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowRight, Sparkles, Filter, Check } from "lucide-react";
import { LUnionStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { MenuItem } from "@/lib/types";
import { formatSimpleIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MenuPage() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string>("All");

  const loadMenu = React.useCallback(async () => {
    try {
      const data = await apiClient.getMenu();
      if (data) setMenuItems(data.filter((m) => m.is_active));
    } catch {
      setMenuItems(LUnionStore.getActiveMenuItems());
    }
  }, []);

  React.useEffect(() => {
    loadMenu();
    window.addEventListener("lunion_store_updated", loadMenu);
    return () => window.removeEventListener("lunion_store_updated", loadMenu);
  }, [loadMenu]);

  // Collect all unique tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((m) => m.tags?.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [menuItems]);

  // Filter items
  const filteredItems = React.useMemo(() => {
    return menuItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag =
        selectedTag === "All" || (item.tags && item.tags.includes(selectedTag));
      return matchSearch && matchTag;
    });
  }, [menuItems, searchQuery, selectedTag]);

  return (
    <div className="container py-12 md:py-20 space-y-12">
      {/* Editorial Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold tracking-[0.25em] text-tomato-600 uppercase font-sans">
          Neapolitan Repertoire
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal-900 tracking-tight">
          Artisanal Pizza Menu
        </h1>
        <p className="text-charcoal-600 text-sm sm:text-base leading-relaxed">
          Setiap resep dirancang untuk memberikan keseimbangan tekstur renyah, keju lumer fior di latte, dan aroma kayu bakar yang khas. Gunakan menu ini untuk memilih pizza single atau paduan Special Kreasi Anda.
        </p>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="max-w-4xl mx-auto bg-white p-4 rounded-2xl border border-cream-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
            <Input
              placeholder="Cari pizza atau topping..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cream-50/50"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-charcoal-500 flex items-center shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1" /> Kategori:
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  selectedTag === tag
                    ? "bg-charcoal-900 text-white shadow-sm"
                    : "bg-cream-100 text-charcoal-700 hover:bg-cream-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden border-cream-200 bg-white hover:shadow-xl transition-all duration-300 flex flex-col group"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-cream-200">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                {item.tags?.map((t) => (
                  <Badge key={t} variant="secondary" className="bg-white/95 text-charcoal-800 text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-2xl font-bold text-charcoal-900 group-hover:text-tomato-600 transition-colors">
                    {item.name}
                  </h3>
                  <span className="font-mono text-lg font-bold text-tomato-600 whitespace-nowrap">
                    {formatSimpleIDR(item.price)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-charcoal-600 mt-2.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-cream-200/80 flex flex-col gap-2">
                <Link href={`/reservation?menuId=${item.id}`}>
                  <Button className="w-full bg-tomato-600 hover:bg-tomato-700 text-white text-xs font-semibold h-10">
                    <span>Reserve with this Pizza</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link href={`/reservation?kreasi=true&f1=${item.id}`}>
                  <Button variant="ghost" className="w-full text-xs text-charcoal-700 hover:text-tomato-600 h-8">
                    <Sparkles className="w-3 h-3 mr-1 text-tomato-500" />
                    Use as Flavor 1 in Special Kreasi
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-cream-200 p-8">
          <p className="font-serif text-xl text-charcoal-800 font-semibold">
            Tidak ada pizza yang cocok dengan pencarian "{searchQuery}"
          </p>
          <p className="text-xs text-charcoal-500 mt-1">
            Coba ubah kata kunci pencarian atau reset kategori filter.
          </p>
          <Button
            variant="outline"
            className="mt-4 text-xs"
            onClick={() => {
              setSearchQuery("");
              setSelectedTag("All");
            }}
          >
            Reset Filter
          </Button>
        </div>
      )}

      {/* Special Kreasi Banner Info */}
      <div className="bg-charcoal-900 text-cream-50 rounded-2xl p-8 border border-charcoal-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center text-xs font-semibold text-tomato-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Can't decide on just one?
          </span>
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-cream-50">
            Coba Special Kreasi — Mix 2 Flavours
          </h3>
          <p className="text-sm text-cream-300 max-w-xl">
            Pilih dua varian pizza dari menu di atas dan nikmati kedua cita rasa dalam satu loyang dengan harga rata-rata transparan: (Harga 1 + Harga 2) ÷ 2.
          </p>
        </div>
        <Link href="/reservation?kreasi=true">
          <Button className="bg-tomato-600 hover:bg-tomato-700 text-white font-semibold whitespace-nowrap px-6 py-3">
            Buat Special Kreasi →
          </Button>
        </Link>
      </div>
    </div>
  );
}
