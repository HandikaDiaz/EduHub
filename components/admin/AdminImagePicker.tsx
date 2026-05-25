"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminImagePickerProps {
  /** URL gambar yang sudah ter-commit (tersimpan di Cloudinary). */
  value: string | null | undefined;
  /** File pending — sudah dipilih user tapi belum di-upload ke Cloudinary. */
  pendingFile: File | null | undefined;
  /**
   * Dipanggil saat user pick / clear / replace gambar.
   * - Pick file baru: { url: previousUrl, pendingFile: file }
   * - Clear gambar:   { url: null, pendingFile: null }
   *
   * Komponen parent menyimpan kedua state, lalu pada saat Save:
   *   - kalau `pendingFile` ada → upload via /api/admin/upload-image (kirim
   *     `replaceUrl=value` supaya gambar lama otomatis dihapus dari Cloudinary)
   *   - replace `value` dengan URL hasil upload, set `pendingFile=null`
   */
  onChange: (next: { url: string | null; pendingFile: File | null }) => void;
  /** Label untuk accessibility / debugging. */
  label?: string;
  /** Render ringkas (untuk inline di form panjang). */
  compact?: boolean;
}

/**
 * Drag-and-drop / click-to-upload image picker dengan **deferred upload**.
 *
 * Flow:
 *   1. User pilih file → preview lokal pakai object URL (tanpa upload)
 *   2. State pendingFile dihold di parent draft
 *   3. User klik tombol Simpan di form → parent flush:
 *      - upload pendingFile ke Cloudinary (auto-konversi WebP di server)
 *      - replace gambar lama (replaceUrl) di sisi server
 *      - replace value dengan URL baru
 *
 * Keuntungan flow ini: kalau user batal/tutup dialog tanpa save, tidak ada
 * file orphan menumpuk di Cloudinary. Konversi WebP tetap di server pakai
 * sharp untuk konsistensi hasil.
 */
export function AdminImagePicker({
  value,
  pendingFile,
  onChange,
  label = "Gambar",
  compact = false,
}: AdminImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Object URL preview untuk pendingFile. Dibuat dengan URL.createObjectURL
  // dan di-revoke saat cleanup supaya tidak memory leak.
  const previewBlobUrl = useMemo(() => {
    if (!pendingFile) return null;
    return URL.createObjectURL(pendingFile);
  }, [pendingFile]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  // Sumber preview: pendingFile (lokal blob) > value (URL Cloudinary committed)
  const displayUrl = previewBlobUrl ?? value ?? null;

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) return "File harus berupa gambar";
    const MAX_BYTES = 8 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return `Ukuran file melebihi batas ${MAX_BYTES / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onChange({ url: value ?? null, pendingFile: file });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };
  const handleClick = () => inputRef.current?.click();

  const handleClear = () => {
    setError(null);
    onChange({ url: null, pendingFile: null });
  };

  // ---- Sudah ada gambar (committed atau pending) — tampilkan preview ----
  if (displayUrl) {
    const isPending = !!pendingFile;
    return (
      <div className={cn("space-y-2", compact && "space-y-1")}>
        <div className="relative group">
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border bg-slate-900",
              isPending ? "border-amber-500/60" : "border-slate-700",
              compact ? "aspect-video max-h-32" : "aspect-video max-h-64",
            )}
          >
            <Image
              src={displayUrl}
              alt={label}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              unoptimized
            />

            {/* Badge "Belum disimpan" saat ada pendingFile */}
            {isPending && (
              <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-amber-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-amber-950">
                <Sparkles className="size-3" />
                Belum disimpan
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClick}
              className="h-7 px-2 text-xs bg-slate-900/90 backdrop-blur-sm border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <Upload className="size-3 mr-1" /> Ganti
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="h-7 w-7 p-0 bg-slate-900/90 backdrop-blur-sm border-slate-700 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Hapus gambar"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {isPending && (
          <p className="text-[11px] text-amber-400 inline-flex items-center gap-1">
            <Sparkles className="size-3" />
            Gambar akan di-upload saat kamu klik tombol Simpan.
          </p>
        )}
        {error && (
          <p className="text-xs text-rose-400 inline-flex items-center gap-1">
            <AlertCircle className="size-3" />
            {error}
          </p>
        )}
      </div>
    );
  }

  // ---- Empty state — drop zone ----
  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer",
          compact ? "py-4 px-3" : "py-8 px-4",
          dragActive
            ? "border-emerald-400 bg-emerald-500/10"
            : "border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/50",
        )}
      >
        <div className="size-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <ImageIcon className="size-5 text-slate-500" />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-slate-200">
            Klik atau drop gambar di sini
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            JPG, PNG, WebP, AVIF, HEIC · maks 8MB · auto-konversi WebP saat Simpan
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p className="text-xs text-rose-400 inline-flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: flush pending image fields ke Cloudinary
// ---------------------------------------------------------------------------

/**
 * Upload pendingFile ke `/api/admin/upload-image` (server konversi WebP +
 * upload ke Cloudinary + hapus oldUrl). Return URL final.
 *
 * Dipanggil dari handler Save di form admin sebelum mutation Convex
 * dipanggil. Kalau pendingFile null, return value asli (no-op).
 */
export async function flushPendingImage(
  value: string | null,
  pendingFile: File | null,
): Promise<string | null> {
  if (!pendingFile) return value ?? null;

  const formData = new FormData();
  formData.append("file", pendingFile);
  if (value) formData.append("replaceUrl", value);

  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Upload gambar gagal");
  }
  return data.url as string;
}
