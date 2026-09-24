"use client";

import * as React from "react";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { WeeklyScheduleDay, ScheduleOverride } from "@/lib/types";

export default function AdminSchedulePage() {
  const [weeklySchedules, setWeeklySchedules] = React.useState<WeeklyScheduleDay[]>([]);
  const [overrides, setOverrides] = React.useState<ScheduleOverride[]>([]);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Override modal
  const [overrideModalOpen, setOverrideModalOpen] = React.useState(false);
  const [overrideDate, setOverrideDate] = React.useState("");
  const [overrideIsOpen, setOverrideIsOpen] = React.useState(false);
  const [overrideStart, setOverrideStart] = React.useState("11:00");
  const [overrideEnd, setOverrideEnd] = React.useState("18:00");
  const [overrideInterval, setOverrideInterval] = React.useState(15);
  const [overrideNote, setOverrideNote] = React.useState("");

  const loadSchedules = React.useCallback(async () => {
    try {
      const data = await apiClient.admin.getSchedule();
      if (data) {
        if (data.weekly) {
          setWeeklySchedules(
            data.weekly.map((w: any) => ({
              id: w.id,
              day_of_week: w.dayOfWeek ?? w.day_of_week,
              day_name: w.dayName ?? w.day_name,
              is_open: w.isOpen !== undefined ? w.isOpen : w.is_open,
              start_time: w.startTime ?? w.start_time,
              end_time: w.endTime ?? w.end_time,
              interval_minutes: w.intervalMinutes ?? w.interval_minutes,
            }))
          );
        }
        if (data.overrides) {
          setOverrides(
            data.overrides.map((o: any) => ({
              id: o.id,
              date: o.date,
              is_open: o.isOpen !== undefined ? o.isOpen : o.is_open,
              start_time: o.startTime ?? o.start_time,
              end_time: o.endTime ?? o.end_time,
              interval_minutes: o.intervalMinutes ?? o.interval_minutes,
              note: o.note,
            }))
          );
        }
        return;
      }
    } catch {
      // Fallback
    }
    setWeeklySchedules(LUnionStore.getWeeklySchedule());
    setOverrides(LUnionStore.getOverrides());
  }, []);

  React.useEffect(() => {
    loadSchedules();
    window.addEventListener("lunion_store_updated", loadSchedules);
    return () => window.removeEventListener("lunion_store_updated", loadSchedules);
  }, [loadSchedules]);

  // Handle changes to weekly schedules
  const handleWeeklyChange = (
    index: number,
    field: keyof WeeklyScheduleDay,
    value: any
  ) => {
    const updated = [...weeklySchedules];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklySchedules(updated);
  };

  const handleSaveWeekly = async () => {
    try {
      await apiClient.admin.updateWeeklySchedule(weeklySchedules);
      LUnionStore.updateWeeklySchedule(weeklySchedules);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      await loadSchedules();
    } catch (err: any) {
      alert("Gagal menyimpan jadwal mingguan: " + (err?.message || "Error server"));
    }
  };

  // Add override
  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDate) return;

    const payload = {
      date: overrideDate,
      isOpen: overrideIsOpen,
      startTime: overrideStart,
      endTime: overrideEnd,
      intervalMinutes: Number(overrideInterval) || 15,
      note: overrideNote.trim(),
    };

    try {
      await apiClient.admin.addDateOverride(payload);
      LUnionStore.addOverride({
        date: payload.date,
        is_open: payload.isOpen,
        start_time: payload.startTime,
        end_time: payload.endTime,
        interval_minutes: payload.intervalMinutes,
        note: payload.note,
      });

      setOverrideModalOpen(false);
      setOverrideDate("");
      setOverrideNote("");
      await loadSchedules();
    } catch (err: any) {
      alert("Gagal menambah date override: " + (err?.message || "Error server"));
    }
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      await apiClient.admin.deleteDateOverride(id);
      LUnionStore.deleteOverride(id);
      await loadSchedules();
    } catch (err: any) {
      alert("Gagal menghapus override: " + (err?.message || "Error server"));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-tomato-600 uppercase font-sans">
            Back Office
          </span>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Schedule &amp; Overrides
          </h1>
          <p className="text-xs text-charcoal-500">
            Atur jam buka mingguan dan buat override untuk hari libur / jam khusus.
          </p>
        </div>
      </div>

      {/* Priority Banner (PRD #10) */}
      <div className="bg-charcoal-900 text-cream-50 p-4 rounded-xl border border-charcoal-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-5 h-5 text-tomato-400 shrink-0" />
          <span>
            <strong>Aturan Prioritas Jadwal:</strong> Jika terdapat <em>Date Override</em> pada tanggal tertentu, override akan selalu mengalahkan <em>Weekly Schedule</em> (Date Override &rarr; Weekly Schedule).
          </span>
        </div>
      </div>

      {/* 1. WEEKLY SCHEDULE MANAGEMENT (PRD #31) */}
      <Card className="bg-white border-cream-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xl text-charcoal-900">Weekly Schedule Management</CardTitle>
            <CardDescription className="text-xs">
              Jadwal operasional mingguan standar. Interval default: 15 menit.
            </CardDescription>
          </div>
          <Button
            onClick={handleSaveWeekly}
            className="bg-olive-600 hover:bg-olive-700 text-white text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {savedSuccess ? "Tersimpan ✓" : "Simpan Jadwal"}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-cream-100 text-charcoal-700 border-b border-cream-200">
                  <th className="p-3.5 font-semibold">HARI</th>
                  <th className="p-3.5 font-semibold text-center">STATUS BUKA</th>
                  <th className="p-3.5 font-semibold">JAM MULAI</th>
                  <th className="p-3.5 font-semibold">JAM SELESAI</th>
                  <th className="p-3.5 font-semibold">INTERVAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {weeklySchedules.map((day, idx) => (
                  <tr key={day.id} className="hover:bg-cream-50/50">
                    <td className="p-3.5 font-bold text-charcoal-900">
                      {day.day_name}
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={day.is_open}
                        onChange={(e) =>
                          handleWeeklyChange(idx, "is_open", e.target.checked)
                        }
                        className="w-4 h-4 rounded text-tomato-600 focus:ring-tomato-500 cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5">
                      <Input
                        type="time"
                        value={day.start_time}
                        disabled={!day.is_open}
                        onChange={(e) =>
                          handleWeeklyChange(idx, "start_time", e.target.value)
                        }
                        className="w-32 h-8 text-xs font-mono"
                      />
                    </td>

                    <td className="p-3.5">
                      <Input
                        type="time"
                        value={day.end_time}
                        disabled={!day.is_open}
                        onChange={(e) =>
                          handleWeeklyChange(idx, "end_time", e.target.value)
                        }
                        className="w-32 h-8 text-xs font-mono"
                      />
                    </td>

                    <td className="p-3.5">
                      <select
                        value={day.interval_minutes}
                        disabled={!day.is_open}
                        onChange={(e) =>
                          handleWeeklyChange(
                            idx,
                            "interval_minutes",
                            Number(e.target.value)
                          )
                        }
                        className="bg-white border border-input rounded-md px-2 py-1 text-xs font-mono"
                      >
                        <option value={15}>15 menit</option>
                        <option value={30}>30 menit</option>
                        <option value={60}>60 menit</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 2. DATE OVERRIDE MANAGEMENT (PRD #32) */}
      <Card className="bg-white border-cream-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xl text-charcoal-900">Date Override Management</CardTitle>
            <CardDescription className="text-xs">
              Override khusus untuk tanggal tertentu (misal: libur hari raya atau event khusus).
            </CardDescription>
          </div>
          <Button
            onClick={() => setOverrideModalOpen(true)}
            className="bg-tomato-600 hover:bg-tomato-700 text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tambah Date Override
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-cream-100 text-charcoal-700 border-b border-cream-200">
                  <th className="p-3.5 font-semibold">TANGGAL</th>
                  <th className="p-3.5 font-semibold">STATUS</th>
                  <th className="p-3.5 font-semibold">JAM OPERASIONAL</th>
                  <th className="p-3.5 font-semibold">INTERVAL</th>
                  <th className="p-3.5 font-semibold">CATATAN / ALASAN</th>
                  <th className="p-3.5 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {overrides.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-charcoal-400">
                      Belum ada date override. Jadwal menggunakan Weekly Schedule default.
                    </td>
                  </tr>
                ) : (
                  overrides.map((ovr) => (
                    <tr key={ovr.id} className="hover:bg-cream-50/50">
                      <td className="p-3.5 font-mono font-bold text-charcoal-900">
                        {ovr.date}
                      </td>

                      <td className="p-3.5">
                        {ovr.is_open ? (
                          <Badge variant="confirmed" className="text-[10px]">
                            OPEN (Buka)
                          </Badge>
                        ) : (
                          <Badge variant="rejected" className="text-[10px]">
                            CLOSED (Tutup)
                          </Badge>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-xs">
                        {ovr.is_open
                          ? `${ovr.start_time} – ${ovr.end_time} WIB`
                          : "Tutup Seharian"}
                      </td>

                      <td className="p-3.5 font-mono text-xs">
                        {ovr.is_open ? `${ovr.interval_minutes} menit` : "-"}
                      </td>

                      <td className="p-3.5 text-xs text-charcoal-600">
                        {ovr.note || "-"}
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteOverride(ovr.id)}
                          className="h-7 px-2 text-xs"
                          title="Hapus Override"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ADD OVERRIDE MODAL */}
      <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Tambah Date Override</DialogTitle>
            <DialogDescription className="text-xs">
              Override akan mengalahkan weekly schedule standar untuk tanggal ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddOverride} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pilih Tanggal:</Label>
              <Input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                id="ovr-open-check"
                type="checkbox"
                checked={overrideIsOpen}
                onChange={(e) => setOverrideIsOpen(e.target.checked)}
                className="w-4 h-4 rounded text-tomato-600 focus:ring-tomato-500"
              />
              <Label htmlFor="ovr-open-check" className="text-xs font-semibold cursor-pointer">
                Restoran Buka Pada Tanggal Ini
              </Label>
            </div>

            {overrideIsOpen && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-cream-50 rounded-xl border border-cream-200">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Jam Mulai:</Label>
                  <Input
                    type="time"
                    value={overrideStart}
                    onChange={(e) => setOverrideStart(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Jam Selesai:</Label>
                  <Input
                    type="time"
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px] font-semibold">Interval (Menit):</Label>
                  <select
                    value={overrideInterval}
                    onChange={(e) => setOverrideInterval(Number(e.target.value))}
                    className="w-full bg-white border border-input rounded-md px-2 py-1.5 text-xs font-mono"
                  >
                    <option value={15}>15 menit</option>
                    <option value={30}>30 menit</option>
                    <option value={60}>60 menit</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catatan / Alasan Override:</Label>
              <Input
                placeholder="Contoh: Libur Idul Fitri / Jam Khusus Malam Tahun Baru"
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setOverrideModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-tomato-600 hover:bg-tomato-700 text-white">
                Simpan Override
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
