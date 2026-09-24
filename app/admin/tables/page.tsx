"use client";

import * as React from "react";
import Image from "next/image";
import { Layers, Edit, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
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
import { RestaurantTable } from "@/lib/types";

export default function AdminTablesPage() {
  const [tables, setTables] = React.useState<RestaurantTable[]>([]);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedTable, setSelectedTable] = React.useState<RestaurantTable | null>(null);

  // Form
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [capacity, setCapacity] = React.useState(4);

  const loadTables = React.useCallback(async () => {
    try {
      const fromApi = await apiClient.admin.getTables();
      if (fromApi) {
        setTables(
          fromApi.map((t: any) => ({
            ...t,
            image_url: t.imageUrl || t.image_url,
            is_active: t.isActive !== undefined ? t.isActive : t.is_active,
            sort_order: t.sortOrder || t.sort_order || 1,
          }))
        );
        return;
      }
    } catch {
      // Fallback
    }
    setTables(LUnionStore.getTables());
  }, []);

  React.useEffect(() => {
    loadTables();
    window.addEventListener("lunion_store_updated", loadTables);
    return () => window.removeEventListener("lunion_store_updated", loadTables);
  }, [loadTables]);

  const handleOpenEdit = (t: RestaurantTable) => {
    setSelectedTable(t);
    setName(t.name);
    setDescription(t.description);
    setImageUrl(t.image_url);
    setIsActive(t.is_active);
    setCapacity(t.capacity || 4);
    setEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl,
      isActive: isActive,
      capacity: Number(capacity) || 4,
    };

    try {
      await apiClient.admin.updateTable(selectedTable.id, payload);
      LUnionStore.updateTable(selectedTable.id, {
        name: payload.name,
        description: payload.description,
        image_url: payload.imageUrl,
        is_active: payload.isActive,
        capacity: payload.capacity,
      });

      setEditModalOpen(false);
      await loadTables();
    } catch (err: any) {
      alert("Gagal memperbarui meja: " + (err?.message || "Error server"));
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await apiClient.admin.updateTable(id, { isActive: !current });
      LUnionStore.updateTable(id, { is_active: !current });
      await loadTables();
    } catch (err: any) {
      alert("Gagal mengubah status meja: " + (err?.message || "Error server"));
    }
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
            Table Management
          </h1>
          <p className="text-xs text-charcoal-500">
            Kelola meja Napoli &amp; Romana. Meja yang dinonaktifkan tidak akan muncul di Booking Board pelanggan.
          </p>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tables.map((t) => (
          <Card key={t.id} className="bg-white border-cream-200 overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-cream-200">
              <Image
                src={t.image_url}
                alt={t.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge
                  className={
                    t.is_active
                      ? "bg-olive-600 text-white font-semibold"
                      : "bg-charcoal-900 text-cream-200"
                  }
                >
                  {t.is_active ? "Aktif (Tampil di Board)" : "Nonaktif (Sembunyi)"}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                    Meja {t.name}
                  </h3>
                  <span className="text-xs text-charcoal-500 font-medium">
                    Kapasitas: {t.capacity || 4} Pax
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-charcoal-600 mt-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="pt-4 border-t border-cream-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleActive(t.id, t.is_active)}
                  className="text-xs text-charcoal-600 hover:text-charcoal-900 flex items-center underline"
                >
                  {t.is_active ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                  {t.is_active ? "Nonaktifkan Meja" : "Aktifkan Meja"}
                </button>

                <Button
                  size="sm"
                  onClick={() => handleOpenEdit(t)}
                  className="bg-charcoal-900 hover:bg-charcoal-800 text-white text-xs px-4"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit Detail Meja
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* EDIT MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Meja: {selectedTable?.name}</DialogTitle>
            <DialogDescription className="text-xs">
              Ubah informasi meja, kapasitas, dan foto latar meja.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nama Meja:</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kapasitas Tamu (Pax):</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Deskripsi Suasana Meja:</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL Foto Meja:</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="table-active-check"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-tomato-600 focus:ring-tomato-500"
              />
              <Label htmlFor="table-active-check" className="text-xs font-medium cursor-pointer">
                Aktifkan meja ini (Muncul di Booking Board pelanggan)
              </Label>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-tomato-600 hover:bg-tomato-700 text-white">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
