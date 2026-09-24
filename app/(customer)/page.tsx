"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Flame,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChefHat,
  PhoneCall,
  Utensils,
  Layers,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SpecialKreasiMixer } from "@/components/customer/SpecialKreasiMixer";
import { LUnionStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { MenuItem, RestaurantTable } from "@/lib/types";
import { formatSimpleIDR } from "@/lib/utils";

export default function HomePage() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [tables, setTables] = React.useState<RestaurantTable[]>([]);

  const loadData = React.useCallback(async () => {
    try {
      const [menuData, tablesData] = await Promise.all([
        apiClient.getMenu(),
        apiClient.getTables(),
      ]);
      if (menuData) setMenuItems(menuData.filter((m) => m.is_active));
      if (tablesData) setTables(tablesData.filter((t) => t.is_active));
    } catch {
      setMenuItems(LUnionStore.getActiveMenuItems());
      setTables(LUnionStore.getActiveTables());
    }
  }, []);

  React.useEffect(() => {
    loadData();
    window.addEventListener("lunion_store_updated", loadData);
    return () => window.removeEventListener("lunion_store_updated", loadData);
  }, [loadData]);

  return (
    <div className="space-y-24 md:space-y-32 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-12 pb-20 bg-cream-100/60 border-b border-cream-200/60">
        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300/80 text-charcoal-800 text-xs font-semibold tracking-wider uppercase">
              <Flame className="w-3.5 h-3.5 text-tomato-600 animate-pulse" />
              <span>Artisanal Wood-Fired Neapolitan Craft</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-charcoal-900 leading-[1.08]">
              MAKE YOUR <br />
              <span className="text-tomato-600 italic font-serif">OWN PIZZA</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-charcoal-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Rasakan pengalaman intim meracik pizza impian Anda. Pilih meja favorit Anda, tentukan paduan rasa autentik, dan nikmati pizza yang dipanggang segar di hadapan Anda.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/reservation" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-tomato-600 hover:bg-tomato-700 text-white shadow-lg shadow-tomato-600/20 text-base font-semibold px-8 h-13">
                  <Calendar className="w-4 h-4 mr-2" />
                  RESERVE YOUR EXPERIENCE
                </Button>
              </Link>
              <Link href="/menu" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-charcoal-800/30 text-charcoal-900 hover:bg-cream-200/80 px-7 h-13">
                  <Utensils className="w-4 h-4 mr-2" />
                  VIEW MENU
                </Button>
              </Link>
            </div>

            {/* Quick feature pills */}
            <div className="pt-6 grid grid-cols-3 gap-3 border-t border-cream-200/80 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <span className="block font-serif text-xl sm:text-2xl font-bold text-charcoal-900">48-Hr</span>
                <span className="text-[11px] sm:text-xs text-charcoal-500 font-medium">Fermented Dough</span>
              </div>
              <div className="text-center lg:text-left border-x border-cream-300/80 px-2">
                <span className="block font-serif text-xl sm:text-2xl font-bold text-tomato-600">2 Tables</span>
                <span className="text-[11px] sm:text-xs text-charcoal-500 font-medium">Napoli & Romana</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block font-serif text-xl sm:text-2xl font-bold text-charcoal-900">Mix 2</span>
                <span className="text-[11px] sm:text-xs text-charcoal-500 font-medium">Special Kreasi</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Imagery */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative ring */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80"
                  alt="L'Union Artisanal Pizza"
                  fill
                  priority
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent" />
                
                {/* Overlay card */}
                <div className="absolute bottom-6 left-6 right-6 bg-cream-50/95 backdrop-blur-md p-4 rounded-xl border border-cream-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-tomato-600 tracking-wider">Hearthside Experience</span>
                      <h4 className="font-serif text-lg font-bold text-charcoal-900">Meja Napoli & Romana</h4>
                    </div>
                    <Link href="/reservation">
                      <div className="w-10 h-10 rounded-full bg-tomato-600 flex items-center justify-center text-white hover:bg-tomato-700 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-charcoal-900 text-cream-50 px-4 py-2.5 rounded-xl shadow-xl border border-charcoal-700 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold tracking-wide">Booking Fee Only Rp10.000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MYO EXPERIENCE — VISUAL STORYTELLING (PRD 7.3) */}
      <section id="myo-experience" className="container scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold tracking-[0.2em] text-tomato-600 uppercase font-sans">
            How It Works
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal-900">
            The Make Your Own Journey
          </h2>
          <p className="text-charcoal-600 text-sm sm:text-base leading-relaxed">
            Empat langkah sederhana menuju momen santap tak terlupakan bersama teman atau orang terkasih.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Choose Your Time",
              desc: "Pilih tanggal dan slot waktu 15 menit yang sesuai dengan ritme hari Anda.",
              icon: Clock,
            },
            {
              step: "02",
              title: "Choose Your Table",
              desc: "Tentukan meja Napoli menghadap oven terbuka atau meja Romana yang hangat & intim.",
              icon: Layers,
            },
            {
              step: "03",
              title: "Choose Your Pizza",
              desc: "Pilih pizza favorit atau kombinasikan dua resep berbeda via Special Kreasi.",
              icon: Utensils,
            },
            {
              step: "04",
              title: "Enjoy Your Creation",
              desc: "Saksikan pizzaiolo kami memanggang kreasi Anda pada suhu 450°C dalam 90 detik.",
              icon: Flame,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-cream-100/70 border border-cream-200/80 rounded-2xl p-6 relative group hover:border-tomato-600/40 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-3xl font-extrabold text-tomato-600/40 group-hover:text-tomato-600 transition-colors">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-cream-200/80 flex items-center justify-center text-charcoal-800 group-hover:bg-tomato-600 group-hover:text-white transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SIGNATURE MENU SHOWCASE (PRD 7.4) */}
      <section className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3">
            <span className="text-xs font-bold tracking-[0.2em] text-tomato-600 uppercase font-sans">
              Artisan Catalog
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal-900">
              Signature Menu
            </h2>
            <p className="text-charcoal-600 text-sm max-w-xl">
              Setiap loyang diolah dengan tepung gandum Italia pilihan, tomat San Marzano D.O.P, dan keju fior di latte segar.
            </p>
          </div>
          <Link href="/menu">
            <Button variant="outline" className="border-charcoal-800/30 hover:bg-cream-200">
              Explore Full Menu ({menuItems.length} Pizzas) →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.slice(0, 6).map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-cream-200 bg-white hover:shadow-lg transition-all duration-300 flex flex-col group"
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
                    <Badge key={t} variant="secondary" className="bg-white/90 text-charcoal-800 text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-xl font-bold text-charcoal-900 group-hover:text-tomato-600 transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-mono text-base font-bold text-tomato-600 whitespace-nowrap">
                      {formatSimpleIDR(item.price)}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-cream-200 flex items-center justify-between">
                  <Link
                    href={`/reservation?menuId=${item.id}`}
                    className="text-xs font-semibold text-tomato-600 hover:text-tomato-700 flex items-center group/btn"
                  >
                    <span>Reserve this Pizza</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                  <span className="text-[11px] text-charcoal-400 font-mono">12-inch Neapolitan</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. SPECIAL KREASI — MIX 2 FLAVOURS (PRD 7.5 & 15) */}
      <section className="container">
        <SpecialKreasiMixer menuItems={menuItems} />
      </section>

      {/* 5. RESTAURANT STORY & CRAFT (PRD 7.6) */}
      <section id="story" className="container scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
              <Image
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80"
                alt="Inside L'Union Pizzeria"
                fill
                className="object-cover"
              />
            </div>
            {/* Small offset image */}
            <div className="hidden sm:block absolute -bottom-8 -right-8 w-48 h-48 rounded-2xl overflow-hidden border-4 border-cream-50 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80"
                alt="Neapolitan Crust"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold tracking-[0.2em] text-tomato-600 uppercase font-sans">
              Our Artisanal Heritage
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal-900 leading-tight">
              Kisah di Balik Setiap Kerak yang Sempurna
            </h2>
            <p className="text-charcoal-600 text-sm sm:text-base leading-relaxed">
              L'Union Pizza lahir dari kecintaan mendalam pada seni pembuatan pizza Napoli sejati. Kami percaya bahwa pizza bukan sekadar hidangan cepat saji, melainkan sebuah kanvas interaksi kuliner.
            </p>
            <p className="text-charcoal-600 text-sm sm:text-base leading-relaxed">
              Dengan mengistirahatkan adonan selama 48 jam demi fermentasi alami yang ringan di lambung, serta pembakaran cepat dalam oven batu bersuhu 450°C, kami menghadirkan kerak dengan corak <em>leopard-spotting</em> yang renyah di luar dan lembut di dalam.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border-l-2 border-tomato-600 pl-4">
                <span className="font-serif text-xl font-bold text-charcoal-900 block">Dua Meja Ikonik</span>
                <span className="text-xs text-charcoal-500">Napoli & Romana untuk pengalaman eksklusif</span>
              </div>
              <div className="border-l-2 border-tomato-600 pl-4">
                <span className="font-serif text-xl font-bold text-charcoal-900 block">Bahan Impor Asli</span>
                <span className="text-xs text-charcoal-500">San Marzano DOP & Fior di Latte</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PHOTO GALLERY (PRD 7.7) */}
      <section className="container">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold tracking-[0.2em] text-tomato-600 uppercase font-sans">
            Visual Story
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
            Atmosphere & Creations
          </h2>
          <p className="text-charcoal-600 text-sm">
            Potret kehangatan dan kelezatan di dapur terbuka L'Union Pizza.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              src: "https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&auto=format&fit=crop&q=80",
              title: "Wood Oven Hearth",
            },
            {
              src: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80",
              title: "Fresh Herbs & Olive Oil",
            },
            {
              src: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&auto=format&fit=crop&q=80",
              title: "Bubbling Mozzarella",
            },
            {
              src: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80",
              title: "Dining Intimacy",
            },
          ].map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl overflow-hidden shadow-md group cursor-pointer"
            >
              <Image
                src={img.src}
                alt={img.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-charcoal-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-xs font-medium text-white">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. BIG RESERVATION CTA (PRD 7.8) */}
      <section className="container">
        <div className="relative rounded-3xl bg-charcoal-900 text-cream-50 p-8 sm:p-12 md:p-16 overflow-hidden border border-charcoal-800 text-center space-y-6">
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <Image
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80"
              alt="Background pattern"
              fill
              className="object-cover"
            />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <span className="text-xs font-bold tracking-[0.25em] text-tomato-400 uppercase font-sans">
              Limited Hearthside Tables
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-cream-50 leading-tight">
              YOUR PIZZA. <br />
              YOUR TABLE. <br />
              <span className="text-tomato-400 italic">YOUR EXPERIENCE.</span>
            </h2>
            <p className="text-cream-300 text-sm sm:text-base leading-relaxed">
              Slot meja kami terbatas setiap 15 menit untuk menjaga kualitas pengalaman memanggang Anda secara personal. Amankan slot meja Napoli atau Romana Anda sekarang.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/reservation">
                <Button size="lg" className="bg-tomato-600 hover:bg-tomato-700 text-white font-semibold px-8 h-13 text-base shadow-xl shadow-tomato-600/30">
                  <Calendar className="w-5 h-5 mr-2" />
                  Reserve Your MYO
                </Button>
              </Link>
              <a
                href="https://wa.me/6285226099883"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="border-charcoal-700 text-cream-50 hover:bg-charcoal-800 h-13 px-6">
                  <PhoneCall className="w-4 h-4 mr-2 text-olive-400" />
                  Chat via WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. LOCATION & OPENING HOURS (PRD 7.9) */}
      <section id="location" className="container scroll-mt-24">
        <div className="bg-white rounded-2xl border border-cream-200/90 p-8 md:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold tracking-[0.2em] text-tomato-600 uppercase font-sans">
              Visit Us
            </span>
            <h2 className="font-serif text-3xl font-bold text-charcoal-900">
              Lokasi & Jam Buka
            </h2>
            <p className="text-charcoal-600 text-sm leading-relaxed">
              Berlokasi strategis di pusat kuliner dengan suasana hangat, wangi kayu bakar, dan sambutan akrab.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-tomato-600 shrink-0 mt-0.5" />
                <span className="text-sm text-charcoal-700">
                  Jl. Veteran No. 42, Artisan Dining Quarter (Dekat Area Parkir Utama)
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-tomato-600 shrink-0 mt-0.5" />
                <div className="text-sm text-charcoal-700">
                  <p>Minggu – Kamis: 11:00 – 21:00 WIB</p>
                  <p>Jumat: 14:00 – 21:00 WIB</p>
                  <p>Sabtu: 11:00 – 21:00 WIB</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <a
                href="https://maps.google.com/?q=LUnion+Pizza"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-charcoal-900 hover:bg-charcoal-800 text-white text-xs">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Buka di Google Maps
                </Button>
              </a>
              <a
                href="https://wa.me/6285226099883"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="border-charcoal-300 text-xs">
                  <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-olive-600" />
                  WhatsApp: 0852-2609-9883
                </Button>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 relative aspect-[16/10] rounded-xl overflow-hidden border border-cream-200 shadow-inner">
            <Image
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"
              alt="Restaurant Dining Atmosphere"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
