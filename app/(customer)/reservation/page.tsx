"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  Layers,
  Utensils,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Upload,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LUnionStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import {
  MenuItem,
  RestaurantTable,
  WeeklyScheduleDay,
  ScheduleOverride,
  RestaurantSettings,
  Reservation,
  SlotAvailability,
} from "@/lib/types";
import {
  getScheduleForDate,
  generateTimeSlots,
  isDateTimeInPast,
  calculateSpecialKreasiPrice,
  getSlotAvailability,
} from "@/lib/reservation-service";
import { formatSimpleIDR, getFormattedDateOffset } from "@/lib/utils";

function ReservationWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load store data
  const [settings, setSettings] = React.useState<RestaurantSettings>(LUnionStore.getSettings());
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [tables, setTables] = React.useState<RestaurantTable[]>([]);
  const [weeklySchedules, setWeeklySchedules] = React.useState<WeeklyScheduleDay[]>([]);
  const [overrides, setOverrides] = React.useState<ScheduleOverride[]>([]);
  const [reservations, setReservations] = React.useState<Reservation[]>([]);

  // Wizard state (Steps: 1 to 6)
  const [step, setStep] = React.useState<number>(1);

  // Form selections
  const [selectedDate, setSelectedDate] = React.useState<string>(getFormattedDateOffset(0));
  const [selectedTime, setSelectedTime] = React.useState<string>("");
  const [selectedTableId, setSelectedTableId] = React.useState<string>("");

  // Pizza selection
  const [isSpecialKreasi, setIsSpecialKreasi] = React.useState<boolean>(false);
  const [selectedMenuId, setSelectedMenuId] = React.useState<string>("");
  const [flavor1Id, setFlavor1Id] = React.useState<string>("");
  const [flavor2Id, setFlavor2Id] = React.useState<string>("");

  // Customer form
  const [customerName, setCustomerName] = React.useState<string>("");
  const [customerWhatsapp, setCustomerWhatsapp] = React.useState<string>("");
  const [pax, setPax] = React.useState<number>(2);
  const [note, setNote] = React.useState<string>("");

  // Payment proof
  const [proofImage, setProofImage] = React.useState<string>("");
  const [proofFileName, setProofFileName] = React.useState<string>("");
  const [copySuccess, setCopySuccess] = React.useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [lastRefreshed, setLastRefreshed] = React.useState<Date>(new Date());

  // Load data & handle reactive updates from Backend API
  const refreshData = React.useCallback(async () => {
    try {
      const [settingsRes, menuRes, tablesRes, availRes] = await Promise.all([
        apiClient.getSettings().catch(() => LUnionStore.getSettings()),
        apiClient.getMenu().catch(() => LUnionStore.getActiveMenuItems()),
        apiClient.getTables().catch(() => LUnionStore.getActiveTables()),
        apiClient.getAvailability(selectedDate).catch(() => null),
      ]);

      if (settingsRes) setSettings(settingsRes);
      if (menuRes) setMenuItems(menuRes.filter((m: any) => m.is_active));
      if (tablesRes) setTables(tablesRes.filter((t: any) => t.is_active));

      if (availRes && Array.isArray(availRes.reservations)) {
        setReservations(availRes.reservations);
      } else {
        setReservations(LUnionStore.getReservations());
      }

      setWeeklySchedules(LUnionStore.getWeeklySchedule());
      setOverrides(LUnionStore.getOverrides());
      setLastRefreshed(new Date());
    } catch {
      setSettings(LUnionStore.getSettings());
      setMenuItems(LUnionStore.getActiveMenuItems());
      setTables(LUnionStore.getActiveTables());
      setWeeklySchedules(LUnionStore.getWeeklySchedule());
      setOverrides(LUnionStore.getOverrides());
      setReservations(LUnionStore.getReservations());
      setLastRefreshed(new Date());
    }
  }, [selectedDate]);

  React.useEffect(() => {
    refreshData();
    window.addEventListener("lunion_store_updated", refreshData);

    // Auto-polling availability every 30 seconds per PRD #36
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => {
      window.removeEventListener("lunion_store_updated", refreshData);
      clearInterval(interval);
    };
  }, [refreshData]);

  // Handle URL query parameters (e.g. from Menu page or Special Kreasi mixer)
  React.useEffect(() => {
    const kreasiParam = searchParams.get("kreasi");
    const menuIdParam = searchParams.get("menuId");
    const f1Param = searchParams.get("f1");
    const f2Param = searchParams.get("f2");

    if (kreasiParam === "true") {
      setIsSpecialKreasi(true);
      if (f1Param) setFlavor1Id(f1Param);
      if (f2Param) setFlavor2Id(f2Param);
    } else if (menuIdParam) {
      setSelectedMenuId(menuIdParam);
    }
  }, [searchParams]);

  // Set initial default selections once menu is loaded
  React.useEffect(() => {
    if (menuItems.length > 0) {
      if (!selectedMenuId) setSelectedMenuId(menuItems[0].id);
      if (!flavor1Id) setFlavor1Id(menuItems[0].id);
      if (!flavor2Id) setFlavor2Id(menuItems[1]?.id || menuItems[0].id);
    }
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [menuItems, tables, selectedMenuId, flavor1Id, flavor2Id, selectedTableId]);

  // Effective schedule for selected date
  const effectiveSchedule = React.useMemo(() => {
    return getScheduleForDate(selectedDate, weeklySchedules, overrides);
  }, [selectedDate, weeklySchedules, overrides]);

  // Time slots for selected date
  const timeSlots = React.useMemo(() => {
    if (!effectiveSchedule.isOpen) return [];
    return generateTimeSlots(
      effectiveSchedule.startTime,
      effectiveSchedule.endTime,
      effectiveSchedule.intervalMinutes
    );
  }, [effectiveSchedule]);

  // Minimum date selectable is today
  const minDate = getFormattedDateOffset(0);

  // Selected table object
  const currentTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  // Calculated product price
  const productPrice = React.useMemo(() => {
    if (isSpecialKreasi) {
      const f1 = menuItems.find((m) => m.id === flavor1Id);
      const f2 = menuItems.find((m) => m.id === flavor2Id);
      if (f1 && f2) {
        return calculateSpecialKreasiPrice(f1.price, f2.price);
      }
      return 0;
    } else {
      const single = menuItems.find((m) => m.id === selectedMenuId);
      return single ? single.price : 0;
    }
  }, [isSpecialKreasi, flavor1Id, flavor2Id, selectedMenuId, menuItems]);

  // Copy bank account helper
  const handleCopyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(settings.payment_account);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle payment proof upload via Backend API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setErrorMessage("Format file harus berupa JPG, PNG, atau WebP.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Ukuran file maksimal 5MB.");
        return;
      }
      setErrorMessage("");
      setProofFileName(file.name);

      try {
        // Upload to /api/upload
        const res = await apiClient.uploadPaymentProof(file);
        setProofImage(res.url);
      } catch (err: any) {
        // Fallback to local object URL
        const url = URL.createObjectURL(file);
        setProofImage(url);
      }
    }
  };

  // Submit Reservation via Backend API with Double-Booking Protection
  const handleSubmitReservation = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    // Validation checks
    if (!selectedDate || !selectedTime || !selectedTableId) {
      setErrorMessage("Silakan lengkapi pilihan tanggal, waktu, dan meja.");
      setIsSubmitting(false);
      return;
    }

    if (!customerName.trim() || !customerWhatsapp.trim()) {
      setErrorMessage("Nama lengkap dan nomor WhatsApp wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    if (isSpecialKreasi && flavor1Id === flavor2Id) {
      setErrorMessage("Special Kreasi mewajibkan dua rasa yang berbeda.");
      setIsSubmitting(false);
      return;
    }

    if (!proofImage) {
      setErrorMessage("Silakan upload bukti transfer booking fee Rp10.000 terlebih dahulu.");
      setIsSubmitting(false);
      return;
    }

    // Prepare reservation payload
    const f1 = menuItems.find((m) => m.id === flavor1Id);
    const f2 = menuItems.find((m) => m.id === flavor2Id);
    const singleMenu = menuItems.find((m) => m.id === selectedMenuId);

    const payload = {
      date: selectedDate,
      time: selectedTime,
      tableId: selectedTableId,
      tableName: currentTable?.name || "Napoli",
      customerName: customerName.trim(),
      customerWhatsapp: customerWhatsapp.trim(),
      pax: Number(pax) || 2,
      note: note.trim() || undefined,
      isSpecialKreasi,
      menuItemId: isSpecialKreasi ? undefined : selectedMenuId,
      menuName: isSpecialKreasi ? undefined : singleMenu?.name,
      flavor1Id: isSpecialKreasi ? flavor1Id : undefined,
      flavor1Name: isSpecialKreasi ? f1?.name : undefined,
      flavor1Price: isSpecialKreasi ? f1?.price : undefined,
      flavor2Id: isSpecialKreasi ? flavor2Id : undefined,
      flavor2Name: isSpecialKreasi ? f2?.name : undefined,
      flavor2Price: isSpecialKreasi ? f2?.price : undefined,
      totalProductPrice: productPrice,
      bookingFee: settings.booking_fee || 10000,
      paymentProofUrl: proofImage,
      paymentProofName: proofFileName,
    };

    try {
      const result = await apiClient.createReservation(payload);

      if (!result.success || !result.reservation) {
        setErrorMessage(
          result.error ||
            "Meja ini baru saja dipesan oleh tamu lain pada jam yang sama. Silakan pilih meja atau slot jam lainnya."
        );
        setIsSubmitting(false);
        setStep(2);
        return;
      }

      // Also sync to local store
      LUnionStore.createReservation({
        date: selectedDate,
        time: selectedTime,
        table_id: selectedTableId,
        table_name: currentTable?.name || "Napoli",
        customer_name: customerName.trim(),
        customer_whatsapp: customerWhatsapp.trim(),
        pax: Number(pax) || 2,
        note: note.trim() || undefined,
        is_special_kreasi: isSpecialKreasi,
        menu_item_id: isSpecialKreasi ? undefined : selectedMenuId,
        menu_name: isSpecialKreasi ? undefined : singleMenu?.name,
        flavor_1_id: isSpecialKreasi ? flavor1Id : undefined,
        flavor_1_name: isSpecialKreasi ? f1?.name : undefined,
        flavor_1_price: isSpecialKreasi ? f1?.price : undefined,
        flavor_2_id: isSpecialKreasi ? flavor2Id : undefined,
        flavor_2_name: isSpecialKreasi ? f2?.name : undefined,
        flavor_2_price: isSpecialKreasi ? f2?.price : undefined,
        total_product_price: productPrice,
        booking_fee: settings.booking_fee || 10000,
        payment_proof_url: proofImage,
        payment_proof_name: proofFileName,
      });

      // Success -> redirect to /reservation/success/[code]
      router.push(`/reservation/success/${result.reservation.code}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal membuat reservasi.");
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Date" },
    { num: 2, label: "Time & Table" },
    { num: 3, label: "Pizza" },
    { num: 4, label: "Details" },
    { num: 5, label: "Payment" },
    { num: 6, label: "Confirm" },
  ];

  return (
    <div className="container py-8 md:py-16 max-w-5xl">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <span className="text-xs font-bold tracking-[0.25em] text-tomato-600 uppercase font-sans">
          Make Your Own Pizza
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal-900 tracking-tight">
          Reserve Your Table
        </h1>
        <p className="text-charcoal-600 text-xs sm:text-sm">
          Ikuti langkah mudah di bawah untuk memilih jadwal, meja, dan pizza impian Anda.
        </p>
      </div>

      {/* STEP INDICATOR (PRD #38) */}
      <div className="mb-10 bg-white p-3 md:p-4 rounded-2xl border border-cream-200/90 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[560px]">
          {stepsList.map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (s.num < step) setStep(s.num);
                  }}
                  className={`flex items-center space-x-2.5 cursor-pointer transition-all ${
                    s.num < step ? "hover:opacity-80" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-tomato-600 text-white ring-4 ring-tomato-100 shadow-sm"
                        : isCompleted
                        ? "bg-olive-600 text-white"
                        : "bg-cream-200 text-charcoal-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs md:text-sm font-medium whitespace-nowrap ${
                      isCurrent
                        ? "text-charcoal-900 font-bold"
                        : isCompleted
                        ? "text-charcoal-700"
                        : "text-charcoal-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 transition-all ${
                      step > idx + 1 ? "bg-olive-600" : "bg-cream-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold block">Perhatian:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* STEP 1: DATE (PRD #8) */}
      {step === 1 && (
        <Card className="bg-white border-cream-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-charcoal-900">
              Langkah 1: Pilih Tanggal Kunjungan
            </CardTitle>
            <p className="text-xs sm:text-sm text-charcoal-500">
              Pilih tanggal reservasi. Tanggal yang telah lewat dinonaktifkan secara otomatis.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-md space-y-3">
              <Label htmlFor="date-input" className="text-sm font-semibold">
                Tanggal Reservasi:
              </Label>
              <Input
                id="date-input"
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-12 text-base font-medium bg-cream-50/50"
              />
            </div>

            {/* Operating info for chosen date */}
            <div className="p-4 rounded-xl bg-cream-100/70 border border-cream-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-600">
                  Status Jadwal Restoran
                </span>
                {effectiveSchedule.isOverride && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 text-[10px]">
                    Special Date Override
                  </Badge>
                )}
              </div>
              {effectiveSchedule.isOpen ? (
                <div className="flex items-center space-x-2 text-sm text-charcoal-900">
                  <CheckCircle2 className="w-4 h-4 text-olive-600 shrink-0" />
                  <span>
                    Buka pada jam <strong>{effectiveSchedule.startTime} – {effectiveSchedule.endTime} WIB</strong> (Interval {effectiveSchedule.intervalMinutes} menit)
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-red-600 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Restoran Tutup pada tanggal ini ({effectiveSchedule.note || "Closed"}).</span>
                </div>
              )}
              {effectiveSchedule.note && (
                <p className="text-xs text-charcoal-500 italic">
                  Catatan: {effectiveSchedule.note}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                disabled={!effectiveSchedule.isOpen}
                onClick={() => setStep(2)}
                className="bg-tomato-600 hover:bg-tomato-700 text-white px-8"
              >
                <span>Lanjut ke Jadwal & Meja</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SCHEDULE & TABLE BOOKING BOARD (PRD #9, 10, 11, 12, 13, 55) */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="bg-white border-cream-200 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-charcoal-900">
                  Langkah 2: Booking Board & Pilihan Meja
                </CardTitle>
                <p className="text-xs sm:text-sm text-charcoal-500">
                  Tanggal: <strong>{selectedDate}</strong> • Interval 15 Menit. Klik slot yang berstatus <strong>Available</strong>.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  className="text-xs text-charcoal-600"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Refresh Ketersediaan
                </Button>
                <span className="text-[11px] text-charcoal-400 font-mono">
                  {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 p-3 bg-cream-100/60 rounded-xl border border-cream-200 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-charcoal-300" />
                  <span className="text-charcoal-700"><strong>Available:</strong> Dapat dipilih</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300" />
                  <span className="text-amber-800"><strong>Pending:</strong> Terkunci (Nama dirahasiakan)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-olive-100 border border-olive-400" />
                  <span className="text-olive-900"><strong>Confirmed:</strong> Terisi (Nama & Menu tampil)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-tomato-600" />
                  <span className="text-tomato-700"><strong>Pilihan Anda</strong></span>
                </div>
              </div>

              {/* BOOKING BOARD: DESKTOP MATRIX VIEW (PRD #55) */}
              <div className="hidden md:block overflow-x-auto border border-cream-200 rounded-xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-charcoal-900 text-cream-50">
                      <th className="p-3.5 font-serif font-bold text-sm w-28">WAKTU</th>
                      {tables.map((tbl) => (
                        <th key={tbl.id} className="p-3.5 font-serif font-bold text-sm border-l border-charcoal-800">
                          {tbl.name}
                          <span className="block text-[11px] font-sans font-normal text-cream-300">
                            {tbl.description.substring(0, 45)}...
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {timeSlots.map((slot) => {
                      const isPast = isDateTimeInPast(selectedDate, slot);

                      return (
                        <tr key={slot} className="hover:bg-cream-50/70 transition-colors">
                          <td className="p-3 font-mono font-semibold text-charcoal-900 bg-cream-100/40">
                            {slot}
                          </td>
                          {tables.map((tbl) => {
                            const avail = getSlotAvailability(
                              selectedDate,
                              slot,
                              tbl.id,
                              tbl.name,
                              reservations
                            );

                            const isSelected =
                              selectedTime === slot && selectedTableId === tbl.id;

                            if (isPast) {
                              return (
                                <td key={tbl.id} className="p-2 border-l border-cream-200 bg-cream-100/40 text-charcoal-400 text-xs italic">
                                  Waktu telah lewat
                                </td>
                              );
                            }

                            if (avail.status === "CONFIRMED") {
                              return (
                                <td key={tbl.id} className="p-2 border-l border-cream-200 bg-olive-50/80">
                                  <div className="p-2 rounded-lg bg-olive-100/80 border border-olive-300 text-olive-900 text-xs space-y-0.5">
                                    <div className="flex items-center justify-between font-semibold">
                                      <span>CONFIRMED</span>
                                      <Lock className="w-3 h-3 text-olive-700" />
                                    </div>
                                    <p className="font-bold truncate">{avail.reservation?.customer_name}</p>
                                    <p className="text-[11px] text-olive-800 truncate">{avail.reservation?.menu_name}</p>
                                  </div>
                                </td>
                              );
                            }

                            if (avail.status === "PENDING") {
                              return (
                                <td key={tbl.id} className="p-2 border-l border-cream-200 bg-amber-50/70">
                                  <div className="p-2 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 text-xs space-y-0.5">
                                    <div className="flex items-center justify-between font-semibold">
                                      <span>PENDING</span>
                                      <Lock className="w-3 h-3 text-amber-700" />
                                    </div>
                                    <p className="text-[11px] text-amber-800 italic">
                                      Slot terkunci (Menunggu konfirmasi admin)
                                    </p>
                                  </div>
                                </td>
                              );
                            }

                            // AVAILABLE
                            return (
                              <td key={tbl.id} className="p-2 border-l border-cream-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTime(slot);
                                    setSelectedTableId(tbl.id);
                                  }}
                                  className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all ${
                                    isSelected
                                      ? "bg-tomato-600 text-white border-tomato-700 font-bold shadow-sm"
                                      : "bg-white hover:bg-cream-100 text-charcoal-800 border-charcoal-200 hover:border-tomato-500"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{isSelected ? "✓ Dipilih" : "Available"}</span>
                                    <span className="font-mono text-[11px]">{slot}</span>
                                  </div>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* BOOKING BOARD: MOBILE TOUCH CARD VIEW (PRD #55) */}
              <div className="md:hidden space-y-4">
                <p className="text-xs font-semibold text-charcoal-700">Pilih Meja Dahulu:</p>
                <div className="grid grid-cols-2 gap-2">
                  {tables.map((tbl) => (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTableId === tbl.id
                          ? "bg-charcoal-900 text-white border-charcoal-900 shadow-md"
                          : "bg-white text-charcoal-800 border-cream-200"
                      }`}
                    >
                      <h4 className="font-serif font-bold text-sm">{tbl.name}</h4>
                      <p className="text-[10px] opacity-80 mt-1 line-clamp-1">{tbl.description}</p>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-charcoal-700 pt-2">
                  Slot Waktu untuk Meja {currentTable?.name}:
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
                  {timeSlots.map((slot) => {
                    const isPast = isDateTimeInPast(selectedDate, slot);
                    const avail = getSlotAvailability(
                      selectedDate,
                      slot,
                      selectedTableId,
                      currentTable?.name || "",
                      reservations
                    );
                    const isSelected = selectedTime === slot;

                    if (isPast) {
                      return (
                        <div key={slot} className="p-2.5 rounded-lg bg-cream-100 text-charcoal-400 text-xs border border-cream-200 italic opacity-60">
                          <span className="font-mono">{slot}</span> (Lewat)
                        </div>
                      );
                    }

                    if (avail.status === "CONFIRMED") {
                      return (
                        <div key={slot} className="p-2 rounded-lg bg-olive-100 text-olive-900 text-xs border border-olive-300">
                          <div className="flex justify-between font-bold">
                            <span className="font-mono">{slot}</span>
                            <span className="text-[10px]">TERISI</span>
                          </div>
                          <p className="text-[11px] truncate font-medium">{avail.reservation?.customer_name}</p>
                        </div>
                      );
                    }

                    if (avail.status === "PENDING") {
                      return (
                        <div key={slot} className="p-2 rounded-lg bg-amber-100 text-amber-900 text-xs border border-amber-300">
                          <div className="flex justify-between font-bold">
                            <span className="font-mono">{slot}</span>
                            <span className="text-[10px]">PENDING</span>
                          </div>
                          <p className="text-[10px] text-amber-800 italic">Terkunci</p>
                        </div>
                      );
                    }

                    // Available
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-tomato-600 text-white border-tomato-700 font-bold shadow-md"
                            : "bg-white text-charcoal-800 border-charcoal-200 hover:border-tomato-500"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold">{slot}</span>
                          <span>{isSelected ? "✓" : "Pilih"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Slot Notice */}
              {selectedTime && (
                <div className="p-4 rounded-xl bg-tomato-50 border border-tomato-200 text-tomato-900 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-tomato-700 font-semibold block">
                      Slot yang Anda Pilih:
                    </span>
                    <span className="font-serif text-lg font-bold">
                      {selectedDate} • {selectedTime} WIB • Meja {currentTable?.name}
                    </span>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-tomato-600 shrink-0" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Ubah Tanggal
                </Button>
                <Button
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                  className="bg-tomato-600 hover:bg-tomato-700 text-white px-8"
                >
                  <span>Lanjut Pilih Menu</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: PIZZA & SPECIAL KREASI (PRD #14, 15, 50) */}
      {step === 3 && (
        <Card className="bg-white border-cream-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-charcoal-900">
              Langkah 3: Pilih Menu Pizza Anda
            </CardTitle>
            <p className="text-xs sm:text-sm text-charcoal-500">
              Pilih satu loyang Signature Pizza kami atau gunakan fitur <strong>Special Kreasi (Mix 2 Flavours)</strong>.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle Mode: Single vs Special Kreasi */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setIsSpecialKreasi(false)}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  !isSpecialKreasi
                    ? "bg-charcoal-900 text-white border-charcoal-900 shadow-md font-bold"
                    : "bg-cream-100 text-charcoal-700 border-cream-200 hover:bg-cream-200"
                }`}
              >
                <Utensils className="w-4 h-4 mx-auto mb-1 text-tomato-500" />
                <span className="text-sm">Single Signature Pizza</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSpecialKreasi(true)}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  isSpecialKreasi
                    ? "bg-tomato-600 text-white border-tomato-700 shadow-md font-bold"
                    : "bg-cream-100 text-charcoal-700 border-cream-200 hover:bg-cream-200"
                }`}
              >
                <Sparkles className="w-4 h-4 mx-auto mb-1" />
                <span className="text-sm">Special Kreasi (Mix 2)</span>
              </button>
            </div>

            {/* OPTION A: SINGLE SIGNATURE PIZZA */}
            {!isSpecialKreasi && (
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Pilih Varian Pizza:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => {
                    const isSelected = selectedMenuId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMenuId(item.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-tomato-600 bg-tomato-50/40 ring-2 ring-tomato-500 shadow-sm"
                            : "border-cream-200 bg-white hover:border-charcoal-400"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif font-bold text-base text-charcoal-900">
                              {item.name}
                            </h4>
                            <span className="font-mono text-sm font-bold text-tomato-600">
                              {formatSimpleIDR(item.price)}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-600 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-cream-200 text-right">
                          <span className={`text-xs font-semibold ${isSelected ? "text-tomato-600" : "text-charcoal-400"}`}>
                            {isSelected ? "✓ Terpilih" : "Klik untuk Memilih"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OPTION B: SPECIAL KREASI — MIX 2 FLAVOURS (PRD #15) */}
            {isSpecialKreasi && (
              <div className="bg-charcoal-900 text-cream-50 rounded-2xl p-6 border border-charcoal-800 space-y-6">
                <div className="flex items-center justify-between border-b border-charcoal-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-tomato-400 uppercase tracking-wider block">
                      Fitur Unggulan MYO
                    </span>
                    <h3 className="font-serif text-xl font-bold text-cream-50">
                      Padukan Dua Rasa Dalam Satu Loyang
                    </h3>
                  </div>
                  <Badge variant="secondary" className="bg-charcoal-800 text-cream-300 font-mono text-xs">
                    (P1 + P2) ÷ 2
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Flavor 1 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-cream-300 uppercase tracking-wider">
                      Rasa Pertama (Sisi Kiri):
                    </Label>
                    <select
                      value={flavor1Id}
                      onChange={(e) => setFlavor1Id(e.target.value)}
                      className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg p-3 text-sm text-cream-100 focus:outline-none focus:ring-2 focus:ring-tomato-500"
                    >
                      {menuItems.map((m) => (
                        <option key={`f1-${m.id}`} value={m.id}>
                          {m.name} ({formatSimpleIDR(m.price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Flavor 2 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-cream-300 uppercase tracking-wider">
                      Rasa Kedua (Sisi Kanan):
                    </Label>
                    <select
                      value={flavor2Id}
                      onChange={(e) => setFlavor2Id(e.target.value)}
                      className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg p-3 text-sm text-cream-100 focus:outline-none focus:ring-2 focus:ring-tomato-500"
                    >
                      {menuItems.map((m) => (
                        <option key={`f2-${m.id}`} value={m.id}>
                          {m.name} ({formatSimpleIDR(m.price)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Constraint check: Flavor 1 != Flavor 2 */}
                {flavor1Id === flavor2Id ? (
                  <div className="p-3.5 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Aturan Special Kreasi:</strong> Rasa 1 dan Rasa 2 harus berbeda. Silakan pilih kombinasi rasa lain.
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-charcoal-950/90 border border-charcoal-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-cream-400 block">Kombinasi Special Kreasi:</span>
                      <span className="font-serif text-base font-bold text-cream-50">
                        {menuItems.find((m) => m.id === flavor1Id)?.name} &amp; {menuItems.find((m) => m.id === flavor2Id)?.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-cream-400 block">Harga Kreasi (Rata-rata):</span>
                      <span className="font-mono text-xl font-bold text-tomato-400">
                        {formatSimpleIDR(productPrice)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-cream-200">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Jadwal
              </Button>
              <Button
                disabled={isSpecialKreasi && flavor1Id === flavor2Id}
                onClick={() => setStep(4)}
                className="bg-tomato-600 hover:bg-tomato-700 text-white px-8"
              >
                <span>Lanjut Isi Data Diri</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: CUSTOMER DATA (PRD #16) */}
      {step === 4 && (
        <Card className="bg-white border-cream-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-charcoal-900">
              Langkah 4: Data Pelanggan
            </CardTitle>
            <p className="text-xs sm:text-sm text-charcoal-500">
              Pastikan nomor WhatsApp aktif untuk penerimaan konfirmasi dan pembaruan reservasi.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="cust-name" className="text-sm font-semibold">
                  Nama Pemesan <span className="text-tomato-600">*</span>:
                </Label>
                <Input
                  id="cust-name"
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-wa" className="text-sm font-semibold">
                  Nomor WhatsApp <span className="text-tomato-600">*</span>:
                </Label>
                <Input
                  id="cust-wa"
                  placeholder="Contoh: 081234567890"
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-pax" className="text-sm font-semibold">
                  Jumlah Orang (Pax) <span className="text-tomato-600">*</span>:
                </Label>
                <Input
                  id="cust-pax"
                  type="number"
                  min={1}
                  max={8}
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-note" className="text-sm font-semibold">
                  Catatan Tambahan (Opsional):
                </Label>
                <Input
                  id="cust-note"
                  placeholder="Contoh: Merayakan ulang tahun, crust lebih renyah..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-cream-200">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Pilihan Menu
              </Button>
              <Button
                disabled={!customerName.trim() || !customerWhatsapp.trim() || pax < 1}
                onClick={() => setStep(5)}
                className="bg-tomato-600 hover:bg-tomato-700 text-white px-8"
              >
                <span>Lanjut ke Pembayaran Booking Fee</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: BOOKING FEE & PAYMENT PROOF (PRD #17, 18, 56) */}
      {step === 5 && (
        <Card className="bg-white border-cream-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-charcoal-900">
              Langkah 5: Booking Fee & Upload Bukti Transfer
            </CardTitle>
            <p className="text-xs sm:text-sm text-charcoal-500">
              Kunci slot meja Anda dengan membayar biaya komitmen pemesanan.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SeaBank Account Details Card */}
            <div className="bg-charcoal-900 text-cream-50 rounded-2xl p-6 border border-charcoal-800 space-y-4">
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-tomato-400 font-semibold">
                  Instruksi Transfer Booking Fee
                </span>
                <Badge variant="secondary" className="bg-tomato-600/30 text-tomato-300 border-tomato-500/40">
                  Wajib Transfer
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-cream-400 block">Nominal Booking Fee:</span>
                  <span className="font-mono text-2xl font-bold text-cream-50">
                    {formatSimpleIDR(settings.booking_fee || 10000)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-cream-400 block">Bank Tujuan:</span>
                  <span className="font-serif text-lg font-bold text-cream-50">
                    {settings.payment_bank}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-cream-400 block">Nomor Rekening:</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-mono text-lg font-bold text-tomato-400 select-all">
                      {settings.payment_account}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyAccount}
                      className="h-7 px-2 text-xs text-cream-300 hover:text-white hover:bg-charcoal-800"
                    >
                      {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-olive-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-charcoal-950/80 border border-charcoal-800 text-xs text-cream-300 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Catatan Penting:</strong> Booking fee sebesar Rp10.000 digunakan untuk mengunci slot meja. <strong>Sisa pembayaran produk pizza dilunasi di kasir restoran saat kunjungan.</strong>
                </span>
              </div>
            </div>

            {/* Upload Dropzone */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Upload Bukti Transfer (JPG, PNG, WebP):</Label>

              <div className="border-2 border-dashed border-cream-300 hover:border-tomato-600/60 rounded-2xl p-6 text-center transition-colors bg-cream-50/50">
                {proofImage ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-48 h-48 rounded-xl overflow-hidden border border-cream-200 shadow-sm">
                      <Image
                        src={proofImage}
                        alt="Bukti Transfer"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-xs text-olive-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{proofFileName || "Bukti transfer berhasil dipilih"}</span>
                    </div>
                    <div>
                      <label htmlFor="re-upload" className="inline-block cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const input = document.getElementById("proof-file") as HTMLInputElement;
                            if (input) input.click();
                          }}
                        >
                          Ganti Gambar
                        </Button>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="proof-file" className="cursor-pointer block space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto flex items-center justify-center text-charcoal-700">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-charcoal-800 block">
                        Klik untuk upload foto bukti transfer
                      </span>
                      <span className="text-xs text-charcoal-400">
                        Mendukung format JPG, PNG, atau WebP (Maks 5MB)
                      </span>
                    </div>
                  </label>
                )}
                <input
                  id="proof-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-cream-200">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Data Diri
              </Button>
              <Button
                disabled={!proofImage}
                onClick={() => setStep(6)}
                className="bg-tomato-600 hover:bg-tomato-700 text-white px-8"
              >
                <span>Review Ringkasan</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: SUMMARY & CONFIRM SUBMISSION (PRD #19, 21) */}
      {step === 6 && (
        <Card className="bg-white border-cream-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-charcoal-900">
              Langkah 6: Konfirmasi Reservasi
            </CardTitle>
            <p className="text-xs sm:text-sm text-charcoal-500">
              Periksa kembali seluruh detail sebelum mengirim permohonan reservasi Anda.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Details */}
              <div className="space-y-4 p-5 rounded-2xl bg-cream-100/60 border border-cream-200">
                <h4 className="font-serif font-bold text-lg text-charcoal-900 border-b border-cream-200 pb-2">
                  Detail Pemesanan
                </h4>
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Tanggal:</span>
                    <span className="font-semibold text-charcoal-900">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Waktu:</span>
                    <span className="font-mono font-bold text-tomato-600">{selectedTime} WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Meja:</span>
                    <span className="font-semibold text-charcoal-900">{currentTable?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Jumlah Tamu (Pax):</span>
                    <span className="font-semibold text-charcoal-900">{pax} Orang</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Nama Pemesan:</span>
                    <span className="font-semibold text-charcoal-900">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">WhatsApp:</span>
                    <span className="font-mono font-semibold text-charcoal-900">{customerWhatsapp}</span>
                  </div>
                  {note && (
                    <div className="pt-2 border-t border-cream-200">
                      <span className="text-charcoal-500 block mb-0.5">Catatan:</span>
                      <span className="italic text-charcoal-800">{note}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Menu & Financial Breakdown */}
              <div className="space-y-4 p-5 rounded-2xl bg-cream-100/60 border border-cream-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-lg text-charcoal-900 border-b border-cream-200 pb-2">
                    Rincian Menu & Biaya
                  </h4>
                  <div className="space-y-2.5 text-xs sm:text-sm pt-2">
                    {isSpecialKreasi ? (
                      <div>
                        <Badge variant="secondary" className="bg-tomato-100 text-tomato-800 text-[10px] mb-1">
                          Special Kreasi (Mix 2 Flavours)
                        </Badge>
                        <p className="font-serif font-bold text-base text-charcoal-900">
                          {menuItems.find((m) => m.id === flavor1Id)?.name} &amp;{" "}
                          {menuItems.find((m) => m.id === flavor2Id)?.name}
                        </p>
                        <p className="text-[11px] text-charcoal-500 mt-0.5">
                          Harga Rata-rata: {formatSimpleIDR(productPrice)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-charcoal-500 block">Pilihan Pizza:</span>
                        <p className="font-serif font-bold text-base text-charcoal-900">
                          {menuItems.find((m) => m.id === selectedMenuId)?.name}
                        </p>
                        <p className="text-xs text-charcoal-500">
                          Harga: {formatSimpleIDR(productPrice)}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-cream-300 space-y-2">
                      <div className="flex justify-between text-xs text-charcoal-600">
                        <span>Estimasi Total Produk:</span>
                        <span className="font-mono">{formatSimpleIDR(productPrice)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-olive-700">
                        <span>Booking Fee (Telah Ditransfer):</span>
                        <span className="font-mono">{formatSimpleIDR(settings.booking_fee || 10000)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-charcoal-500 italic pt-1">
                        <span>Pelunasan di kasir:</span>
                        <span className="font-mono">
                          {formatSimpleIDR(Math.max(0, productPrice - (settings.booking_fee || 10000)))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {proofImage && (
                  <div className="pt-3 border-t border-cream-200 flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-cream-300 shrink-0">
                      <Image src={proofImage} alt="Bukti" fill className="object-cover" />
                    </div>
                    <span className="text-xs text-olive-700 font-medium truncate">
                      ✓ Bukti transfer siap diverifikasi admin
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-cream-200">
              <Button variant="outline" onClick={() => setStep(5)} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Bukti Transfer
              </Button>
              <Button
                onClick={handleSubmitReservation}
                disabled={isSubmitting}
                className="bg-tomato-600 hover:bg-tomato-700 text-white px-9 py-3 text-base font-semibold shadow-lg shadow-tomato-600/20"
              >
                {isSubmitting ? (
                  <span>Memproses Reservasi...</span>
                ) : (
                  <span>Konfirmasi & Kirim Reservasi</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReservationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container py-20 text-center text-charcoal-500">
          Memuat wizard reservasi L'Union Pizza...
        </div>
      }
    >
      <ReservationWizardContent />
    </React.Suspense>
  );
}
