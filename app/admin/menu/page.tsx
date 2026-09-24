"use client";

import * as React from "react";
import Image from "next/image";
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MenuItem } from "@/lib/types";
import { formatSimpleIDR } from "@/lib/utils";

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState("");

  // Form fields
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState(58000);
  const [imageUrl, setImageUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [tags, setTags] = React.useState("Classic");

  const loadMenu = React.useCallback(async () => {
    try {
      const fromApi = await apiClient.admin.getMenu();
      if (fromApi) {
        setMenuItems(
          fromApi.map((m: any) => ({
            ...m,
            image: m.imageUrl || m.image,
            is_active: m.isActive !== undefined ? m.isActive : m.is_active,
            sort_order: m.sortOrder || m.sort_order || 1,
          }))
        );
        return;
      }
    } catch {
      // Fallback
    }
    setMenuItems(LUnionStore.getMenuItems());
  }, []);

  React.useEffect(() => {
    loadMenu();
    window.addEventListener("lunion_store_updated", loadMenu);
    return () => window.removeEventListener("lunion_store_updated", loadMenu);
  }, [loadMenu]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId("");
    setName("");
    setSlug("");
    setDescription("");
    setPrice(65000);
    setImageUrl("https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80");
    setIsActive(true);
    setTags("Signature");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description);
    setPrice(item.price);
    setImageUrl(item.image);
    setIsActive(item.is_active);
    setTags(item.tags?.join(", ") || "Classic");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) return;

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const generatedSlug = slug.trim() || name.toLowerCase().replace(/\s+/g, "-");

    const payload = {
      name: name.trim(),
      slug: generatedSlug,
      description: description.trim(),
      price: Number(price),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
      isActive,
      tags: parsedTags,
    };

    try {
      if (isEditing && editingId) {
        await apiClient.admin.updateMenuItem(editingId, payload);
        LUnionStore.updateMenuItem(editingId, {
          ...payload,
          image: payload.imageUrl,
          is_active: payload.isActive,
        });
      } else {
        await apiClient.admin.createMenuItem(payload);
        LUnionStore.addMenuItem({
          ...payload,
          image: payload.imageUrl,
          is_active: payload.isActive,
          sort_order: menuItems.length + 1,
        });
      }
      setModalOpen(false);
      await loadMenu();
    } catch (err: any) {
      alert("Gagal menyimpan menu: " + (err?.message || "Error server"));
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await apiClient.admin.updateMenuItem(id, { isActive: !current });
      LUnionStore.updateMenuItem(id, { is_active: !current });
      await loadMenu();
    } catch (err: any) {
      alert("Gagal mengubah status menu: " + (err?.message || "Error server"));
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (confirm(`Hapus menu "${itemName}" dari sistem?`)) {
      try {
        await apiClient.admin.deleteMenuItem(id);
        LUnionStore.deleteMenuItem(id);
        await loadMenu();
      } catch (err: any) {
        alert("Gagal menghapus menu: " + (err?.message || "Error server"));
      }
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
            Menu Management
          </h1>
          <p className="text-xs text-charcoal-500">
            Kelola menu pizza, harga satuan, dan ketersediaan untuk alur Make Your Own pelanggan.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-tomato-600 hover:bg-tomato-700 text-white text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Menu Baru
        </Button>
      </div>

      {/* Menu Table Card */}
      <Card className="bg-white border-cream-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-charcoal-900 text-cream-50">
                  <th className="p-3.5 font-semibold">FOTO</th>
                  <th className="p-3.5 font-semibold">NAMA &amp; DESKRIPSI</th>
                  <th className="p-3.5 font-semibold">HARGA</th>
                  <th className="p-3.5 font-semibold">TAGS</th>
                  <th className="p-3.5 font-semibold text-center">STATUS</th>
                  <th className="p-3.5 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="p-3.5 w-16">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-cream-200 bg-cream-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>

                    <td className="p-3.5 max-w-sm">
                      <h4 className="font-bold text-sm text-charcoal-900">{item.name}</h4>
                      <p className="text-xs text-charcoal-500 line-clamp-1">{item.description}</p>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-tomato-600 text-sm">
                      {formatSimpleIDR(item.price)}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          item.is_active
                            ? "bg-olive-100 text-olive-800 border border-olive-300"
                            : "bg-charcoal-100 text-charcoal-600 border border-charcoal-200"
                        }`}
                        title="Klik untuk toggle aktif/nonaktif"
                      >
                        {item.is_active ? "Aktif (Tampil)" : "Nonaktif (Sembunyi)"}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 px-2 text-xs"
                          title="Edit Menu"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id, item.name)}
                          className="h-8 px-2 text-xs"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Edit Menu Pizza" : "Tambah Menu Pizza Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Harga di sini akan otomatis menjadi acuan formula Special Kreasi dan harga pesanan pelanggan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nama Pizza:</Label>
              <Input
                placeholder="Contoh: Quattro Formaggi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Harga (Rupiah):</Label>
                <Input
                  type="number"
                  placeholder="58000"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tags (Pisahkan koma):</Label>
                <Input
                  placeholder="Classic, Vegetarian"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Deskripsi Topping &amp; Rasa:</Label>
              <Input
                placeholder="San Marzano sugo, fior di latte, basil, olive oil..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL Foto Pizza:</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="is-active-check"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-tomato-600 focus:ring-tomato-500"
              />
              <Label htmlFor="is-active-check" className="text-xs font-medium cursor-pointer">
                Aktifkan menu ini (Dapat dipilih pelanggan di alur reservasi MYO)
              </Label>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-tomato-600 hover:bg-tomato-700 text-white">
                Simpan Menu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
