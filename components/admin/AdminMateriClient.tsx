"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Video,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Module = {
  _id: Id<"modules">;
  title: string;
  slug: string;
  description: string;
  videoUrl: string;
  isFree: boolean;
  isPublished: boolean;
  order: number;
  createdAt: number;
  categoryId: Id<"categories">;
  categoryName: string;
  categoryColor: string;
  quizCount: number;
  viewCount: number;
  completedCount: number;
};

type Category = {
  _id: Id<"categories">;
  name: string;
  slug: string;
  order: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function AdminMateriClient() {
  const modules = useQuery(api.materi.listMateriAdmin);
  const categories = useQuery(api.categories.listCategories);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categoryTabs = useMemo(() => {
    if (!categories) return [];
    return [...categories]
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ id: c._id, name: c.name }));
  }, [categories]);

  const filtered = useMemo(() => {
    if (!modules) return [];
    const q = searchQuery.toLowerCase().trim();
    return modules.filter((m) => {
      if (activeCategory !== "all" && m.categoryId !== activeCategory)
        return false;
      if (
        q &&
        !m.title.toLowerCase().includes(q) &&
        !m.slug.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [modules, activeCategory, searchQuery]);

  const isLoading = modules === undefined || categories === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Materi</h1>
          <p className="text-gray-400 text-sm mt-1">
            Kelola konten video dan modul pembelajaran.
          </p>
        </div>
        <MateriModal mode="add" categories={categories ?? []} />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-900 p-4 border border-gray-800 rounded-xl">
        <div className="flex flex-wrap gap-1 bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Semua
          </button>
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeCategory === tab.id
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Cari materi..."
            className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-brand-sky/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-800/50">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Judul Materi</TableHead>
                <TableHead className="text-gray-400">Kategori</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Akses</TableHead>
                <TableHead className="text-gray-400 hidden lg:table-cell text-right">
                  Stats
                </TableHead>
                <TableHead className="text-gray-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-800">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full bg-gray-800" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-gray-500"
                  >
                    Tidak ada materi yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((materi) => (
                  <TableRow
                    key={materi._id}
                    className="border-gray-800 hover:bg-gray-800/50"
                  >
                    <TableCell className="font-medium text-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-gray-800 rounded flex items-center justify-center shrink-0">
                          <Video size={14} className="text-sky-500" />
                        </div>
                        <span className="truncate max-w-[200px] sm:max-w-xs">
                          {materi.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-gray-800 text-gray-300 border-gray-700"
                      >
                        {materi.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${materi.isPublished ? "bg-emerald-500" : "bg-gray-500"}`}
                        />
                        <span
                          className={`text-sm ${materi.isPublished ? "text-gray-300" : "text-gray-500"}`}
                        >
                          {materi.isPublished ? "Aktif" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {materi.isFree ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                          Free
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20">
                          Pro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-xs text-gray-400">
                      <div>{materi.quizCount} quiz</div>
                      <div>
                        {materi.completedCount}/{materi.viewCount} selesai
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <MateriModal
                        mode="edit"
                        module={materi}
                        categories={categories ?? []}
                      />
                      <DeleteButton module={materi} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete button with confirmation
// ---------------------------------------------------------------------------

function DeleteButton({ module }: { module: Module }) {
  const deleteModule = useMutation(api.materi.deleteModule);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Hapus "${module.title}"? Seluruh quiz, soal, dan attempt terkait akan ikut terhapus.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteModule({ moduleId: module._id });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus materi");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={deleting}
      onClick={handleDelete}
      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-400/10 ml-1"
    >
      {deleting ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Create/Edit dialog
// ---------------------------------------------------------------------------

type MateriModalProps =
  | { mode: "add"; categories: Category[]; module?: undefined }
  | { mode: "edit"; module: Module; categories: Category[] };

function MateriModal(props: MateriModalProps) {
  const { mode, categories } = props;
  const defaultValue = mode === "edit" ? props.module : undefined;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultValue?.title ?? "");
  const [slug, setSlug] = useState(defaultValue?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!defaultValue?.slug);
  const [description, setDescription] = useState(
    defaultValue?.description ?? "",
  );
  const [videoUrl, setVideoUrl] = useState(defaultValue?.videoUrl ?? "");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | "">(
    defaultValue?.categoryId ?? "",
  );
  const [isFree, setIsFree] = useState(defaultValue?.isFree ?? true);
  const [isPublished, setIsPublished] = useState(
    defaultValue?.isPublished ?? false,
  );
  const [order, setOrder] = useState<number>(defaultValue?.order ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createModule = useMutation(api.materi.createModule);
  const updateModule = useMutation(api.materi.updateModule);

  // auto-slug from title on create only
  useEffect(() => {
    if (mode === "add" && !slugEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited, mode]);

  // reset on open
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setTitle(defaultValue?.title ?? "");
      setSlug(defaultValue?.slug ?? "");
      setSlugEdited(!!defaultValue?.slug);
      setDescription(defaultValue?.description ?? "");
      setVideoUrl(defaultValue?.videoUrl ?? "");
      setCategoryId(
        defaultValue?.categoryId ??
          (categories[0]?._id ?? ""),
      );
      setIsFree(defaultValue?.isFree ?? true);
      setIsPublished(defaultValue?.isPublished ?? false);
      setOrder(defaultValue?.order ?? 0);
      setError(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) return setError("Judul wajib diisi");
    if (!slug.trim()) return setError("Slug wajib diisi");
    if (!categoryId) return setError("Kategori wajib dipilih");
    if (!videoUrl.trim()) return setError("URL video wajib diisi");

    setSaving(true);
    try {
      if (mode === "add") {
        await createModule({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          categoryId,
          isFree,
          isPublished,
          order,
        });
      } else {
        await updateModule({
          moduleId: defaultValue!._id,
          patch: {
            title: title.trim(),
            slug: slug.trim(),
            description: description.trim(),
            videoUrl: videoUrl.trim(),
            categoryId,
            isFree,
            isPublished,
            order,
          },
        });
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan materi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {mode === "add" ? (
        <DialogTrigger
          render={
            <Button
              className="bg-brand-sky hover:bg-brand-sky/90 text-white shadow-lg shadow-sky-500/20 w-full sm:w-auto"
              disabled={categories.length === 0}
            />
          }
        >
          <PlusCircle className="mr-2" size={16} />
          Tambah Materi
        </DialogTrigger>
      ) : (
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-sky-400 hover:bg-sky-400/10"
            />
          }
        >
          <Edit size={16} />
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white p-0 overflow-hidden gap-0 admin-dark-scroll">
        <DialogHeader className="p-6 pb-4 border-b border-gray-800">
          <DialogTitle>
            {mode === "add" ? "Tambah Materi Baru" : "Edit Materi"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Judul Materi
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-sky/50"
              placeholder="Contoh: Integritas Nasional"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Slug</label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugEdited(true);
              }}
              className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-sky/50 font-mono text-sm"
              placeholder="integritas-nasional"
            />
            <p className="text-xs text-gray-500">
              URL: /materi/.../{slug || "slug-otomatis"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Kategori
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.length === 0 ? (
                <p className="col-span-3 text-xs text-gray-500">
                  Belum ada kategori. Tambahkan di Pengaturan.
                </p>
              ) : (
                categories.map((k) => (
                  <button
                    key={k._id}
                    type="button"
                    onClick={() => setCategoryId(k._id)}
                    className={`border rounded-lg p-2 text-center text-sm capitalize cursor-pointer transition-colors ${
                      categoryId === k._id
                        ? "border-brand-sky bg-brand-sky/10 text-brand-sky"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {k.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Link Video YouTube
            </label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-sky/50"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Deskripsi Ringkas
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-sky/50 resize-none min-h-[80px]"
              placeholder="Jelaskan secara ringkas isi materi ini..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Urutan</label>
            <Input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-sky/50"
              placeholder="0"
              min={0}
            />
            <p className="text-xs text-gray-500">
              Urutan kecil tampil lebih dulu.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
            <div>
              <p className="text-sm font-medium text-gray-200">
                Akses Pro Khusus?
              </p>
              <p className="text-xs text-gray-500">
                Materi ini dikunci untuk user gratis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFree(!isFree)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                !isFree ? "bg-brand-purple" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  !isFree ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
            <div>
              <p className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                Status Publikasi
              </p>
              <p className="text-xs text-gray-500">
                {isPublished
                  ? "Materi bisa dilihat user."
                  : "Draft — belum tampil di /materi."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                isPublished ? "bg-emerald-500" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  isPublished ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-gray-800 bg-gray-900/50 flex flex-row justify-end gap-2 sm:gap-2">
          <DialogClose
            render={
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              />
            }
          >
            Batal
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-sky hover:bg-brand-sky/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : mode === "add" ? (
              "Simpan Materi Baru"
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
