"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Settings,
  Globe,
  BookOpen,
  CreditCard,
  FolderTree,
  Save,
  ToggleLeft,
  ToggleRight,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultContentSettings,
  defaultPaymentSettings,
  defaultPlatformSettings,
  parseContentSettings,
  parsePaymentSettings,
  parsePlatformSettings,
  validateContentSettings,
  validatePaymentSettings,
  validatePlatformSettings,
  type ContentSettings,
  type PaymentSettings,
  type PlatformSettings,
} from "@/lib/settings-schema";

const TABS = [
  { key: "umum", label: "Umum", icon: Globe },
  { key: "konten", label: "Konten", icon: BookOpen },
  { key: "pembayaran", label: "Pembayaran", icon: CreditCard },
  { key: "kategori", label: "Kategori CPNS", icon: FolderTree },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function AdminPengaturanClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("umum");

  const settings = useQuery(api.settings.getAllSettings);
  const categories = useQuery(api.categories.listCategoriesAdmin);
  const saveSettings = useMutation(api.settings.saveSettings);

  // Local form state per tab, hydrated from Convex when settings load
  const [platform, setPlatform] = useState<PlatformSettings>(
    defaultPlatformSettings,
  );
  const [content, setContent] = useState<ContentSettings>(
    defaultContentSettings,
  );
  const [payment, setPayment] = useState<PaymentSettings>(
    defaultPaymentSettings,
  );

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Hydrate from Convex once loaded
  useEffect(() => {
    if (!settings) return;
    setPlatform(parsePlatformSettings(settings.platform?.value ?? null));
    setContent(parseContentSettings(settings.content?.value ?? null));
    setPayment(parsePaymentSettings(settings.payment?.value ?? null));
  }, [settings]);

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");

    try {
      if (activeTab === "umum") {
        const err = validatePlatformSettings(platform);
        if (err) throw new Error(err);
        await saveSettings({ key: "platform", value: JSON.stringify(platform) });
      } else if (activeTab === "konten") {
        const err = validateContentSettings(content);
        if (err) throw new Error(err);
        await saveSettings({ key: "content", value: JSON.stringify(content) });
      } else if (activeTab === "pembayaran") {
        const err = validatePaymentSettings(payment);
        if (err) throw new Error(err);
        await saveSettings({ key: "payment", value: JSON.stringify(payment) });
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Gagal menyimpan");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const isLoading = settings === undefined;
  const showSaveButton = activeTab !== "kategori";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-slate-400 mt-1">
            Konfigurasi platform, konten, pembayaran, dan kategori.
          </p>
        </div>
        {showSaveButton && (
          <Button
            className={cn(
              "text-white gap-2 shrink-0",
              status === "error"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-brand-sky hover:bg-brand-sky/90",
            )}
            onClick={handleSave}
            disabled={isLoading || status === "saving"}
          >
            {status === "saving" && (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan…
              </>
            )}
            {status === "saved" && (
              <>
                <CheckCircle2 className="size-4" />
                Tersimpan!
              </>
            )}
            {status === "error" && (
              <>
                <AlertTriangle className="size-4" />
                {errorMsg || "Gagal"}
              </>
            )}
            {status === "idle" && (
              <>
                <Save className="size-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ── */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 bg-slate-800/50" />
          <Skeleton className="h-48 bg-slate-800/50" />
        </div>
      ) : (
        <>
          {activeTab === "umum" && (
            <UmumTab platform={platform} onChange={setPlatform} />
          )}
          {activeTab === "konten" && (
            <KontenTab content={content} onChange={setContent} />
          )}
          {activeTab === "pembayaran" && (
            <PembayaranTab payment={payment} onChange={setPayment} />
          )}
          {activeTab === "kategori" && <KategoriTab categories={categories} />}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle helper
// ---------------------------------------------------------------------------

function ToggleSwitch({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between gap-4 w-full text-left group"
    >
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      {enabled ? (
        <ToggleRight className="size-7 text-brand-sky shrink-0 transition-colors" />
      ) : (
        <ToggleLeft className="size-7 text-slate-600 shrink-0 group-hover:text-slate-500 transition-colors" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tab: Umum
// ---------------------------------------------------------------------------

function UmumTab({
  platform,
  onChange,
}: {
  platform: PlatformSettings;
  onChange: (v: PlatformSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="space-y-5 pt-1">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Globe className="size-4 text-brand-sky" />
            Informasi Platform
          </h3>

          <div className="space-y-4">
            <SettingField label="Nama Platform">
              <Input
                className="bg-slate-900/50 border-slate-700 text-white"
                value={platform.siteName}
                onChange={(e) =>
                  onChange({ ...platform, siteName: e.target.value })
                }
              />
            </SettingField>

            <SettingField label="Deskripsi">
              <Textarea
                className="bg-slate-900/50 border-slate-700 text-white min-h-[80px]"
                value={platform.siteDescription}
                onChange={(e) =>
                  onChange({ ...platform, siteDescription: e.target.value })
                }
              />
            </SettingField>

            <SettingField label="Email Kontak">
              <Input
                className="bg-slate-900/50 border-slate-700 text-white"
                type="email"
                value={platform.contactEmail}
                onChange={(e) =>
                  onChange({ ...platform, contactEmail: e.target.value })
                }
              />
            </SettingField>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="space-y-5 pt-1">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Settings className="size-4 text-brand-sky" />
            Sistem
          </h3>
          <div className="space-y-4">
            <ToggleSwitch
              enabled={platform.maintenanceMode}
              onToggle={() =>
                onChange({
                  ...platform,
                  maintenanceMode: !platform.maintenanceMode,
                })
              }
              label="Mode Maintenance"
              description="Nonaktifkan akses pengguna selama pemeliharaan sistem."
            />
            {platform.maintenanceMode && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Mode maintenance aktif — pengguna tidak dapat mengakses
                  platform.
                </p>
              </div>
            )}
            <Separator className="bg-slate-700/50" />
            <ToggleSwitch
              enabled={platform.registrationOpen}
              onToggle={() =>
                onChange({
                  ...platform,
                  registrationOpen: !platform.registrationOpen,
                })
              }
              label="Registrasi Terbuka"
              description="Izinkan pengguna baru untuk mendaftar."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Konten
// ---------------------------------------------------------------------------

function KontenTab({
  content,
  onChange,
}: {
  content: ContentSettings;
  onChange: (v: ContentSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="space-y-5 pt-1">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen className="size-4 text-brand-sky" />
            Default Quiz & Latihan
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingField
              label="Nilai Minimum Lulus"
              hint="Skor minimum untuk dinyatakan lulus (0-100)"
            >
              <div className="relative">
                <Input
                  className="bg-slate-900/50 border-slate-700 text-white pr-8"
                  type="number"
                  min={0}
                  max={100}
                  value={content.passingScore}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      passingScore: Number(e.target.value),
                    })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  %
                </span>
              </div>
            </SettingField>

            <SettingField
              label="Durasi Default Quiz"
              hint="Durasi default dalam menit untuk quiz baru"
            >
              <div className="relative">
                <Input
                  className="bg-slate-900/50 border-slate-700 text-white pr-12"
                  type="number"
                  min={1}
                  value={content.defaultQuizDuration}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      defaultQuizDuration: Number(e.target.value),
                    })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  menit
                </span>
              </div>
            </SettingField>

            <SettingField
              label="Jumlah Soal Default"
              hint="Jumlah soal default untuk latihan baru"
            >
              <Input
                className="bg-slate-900/50 border-slate-700 text-white"
                type="number"
                min={1}
                value={content.defaultMaxQuestions}
                onChange={(e) =>
                  onChange({
                    ...content,
                    defaultMaxQuestions: Number(e.target.value),
                  })
                }
              />
            </SettingField>

            <SettingField
              label="Durasi Trial"
              hint="Lama masa trial untuk pengguna baru"
            >
              <div className="relative">
                <Input
                  className="bg-slate-900/50 border-slate-700 text-white pr-10"
                  type="number"
                  min={1}
                  value={content.trialDurationDays}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      trialDurationDays: Number(e.target.value),
                    })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  hari
                </span>
              </div>
            </SettingField>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="space-y-4 pt-1">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Settings className="size-4 text-brand-sky" />
            Perilaku Quiz
          </h3>
          <ToggleSwitch
            enabled={content.showExplanationAfterQuiz}
            onToggle={() =>
              onChange({
                ...content,
                showExplanationAfterQuiz: !content.showExplanationAfterQuiz,
              })
            }
            label="Tampilkan Pembahasan Setelah Quiz"
            description="Pengguna dapat melihat pembahasan soal setelah menyelesaikan quiz."
          />
          <Separator className="bg-slate-700/50" />
          <ToggleSwitch
            enabled={content.allowRetake}
            onToggle={() =>
              onChange({ ...content, allowRetake: !content.allowRetake })
            }
            label="Izinkan Mengulang Quiz"
            description="Pengguna dapat mengulang quiz yang sudah dikerjakan."
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Pembayaran
// ---------------------------------------------------------------------------

function PembayaranTab({
  payment,
  onChange,
}: {
  payment: PaymentSettings;
  onChange: (v: PaymentSettings) => void;
}) {
  const formatRupiah = (n: number) => new Intl.NumberFormat("id-ID").format(n);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="space-y-5 pt-1">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <CreditCard className="size-4 text-brand-sky" />
            Harga Langganan
          </h3>
          <SettingField
            label="Harga Paket Pro (per bulan)"
            hint="Harga dalam Rupiah"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                Rp
              </span>
              <Input
                className="bg-slate-900/50 border-slate-700 text-white pl-9"
                type="number"
                min={0}
                step={1000}
                value={payment.proMonthlyPrice}
                onChange={(e) =>
                  onChange({
                    ...payment,
                    proMonthlyPrice: Number(e.target.value),
                  })
                }
              />
            </div>
          </SettingField>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 border border-slate-700/50 p-3">
            <Info className="size-4 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-400">
              Harga yang ditampilkan ke pengguna:{" "}
              <span className="font-semibold text-white">
                Rp {formatRupiah(payment.proMonthlyPrice)}
              </span>{" "}
              / bulan
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="space-y-5 pt-1">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Settings className="size-4 text-brand-sky" />
            Integrasi Midtrans
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4 space-y-2">
              <p className="text-xs text-slate-400">Status Koneksi</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    payment.midtransStatus === "connected"
                      ? "bg-emerald-400"
                      : "bg-red-400",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    payment.midtransStatus === "connected"
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {payment.midtransStatus === "connected"
                    ? "Terhubung"
                    : "Tidak Terhubung"}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4 space-y-2">
              <p className="text-xs text-slate-400">Mode</p>
              <Select
                value={payment.midtransMode}
                onValueChange={(v) =>
                  onChange({
                    ...payment,
                    midtransMode: v as "sandbox" | "production",
                  })
                }
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="sandbox" className="text-slate-200">
                    Sandbox (Testing)
                  </SelectItem>
                  <SelectItem value="production" className="text-slate-200">
                    Production
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {payment.midtransMode === "production" && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Mode Production aktif — transaksi akan menggunakan uang
                sungguhan.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-slate-900/50 border border-slate-700/50 p-3">
            <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              Server Key dan Client Key dikonfigurasi melalui environment
              variables (<code className="text-brand-sky">.env.local</code>).
              Jangan ubah di UI untuk alasan keamanan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Kategori CPNS
// ---------------------------------------------------------------------------

type CategoryRow = {
  _id: Id<"categories">;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  moduleCount: number;
};

function KategoriTab({
  categories,
}: {
  categories: CategoryRow[] | undefined;
}) {
  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "#0EA5E9",
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCat, setNewCat] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "#0EA5E9",
  });
  const [actionError, setActionError] = useState("");
  const [pendingId, setPendingId] = useState<Id<"categories"> | null>(null);

  const sortedCategories = useMemo(
    () => (categories ?? []).slice().sort((a, b) => a.order - b.order),
    [categories],
  );

  const handleEdit = (cat: CategoryRow) => {
    setEditingId(cat._id);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
    });
    setActionError("");
  };

  const handleSaveEdit = async (id: Id<"categories">) => {
    setActionError("");
    setPendingId(id);
    try {
      await updateCategory({ categoryId: id, patch: editForm });
      setEditingId(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal memperbarui");
    } finally {
      setPendingId(null);
    }
  };

  const handleAdd = async () => {
    setActionError("");
    try {
      await createCategory({
        ...newCat,
        order: sortedCategories.length + 1,
      });
      setNewCat({
        name: "",
        slug: "",
        description: "",
        icon: "",
        color: "#0EA5E9",
      });
      setIsAddOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal menambah");
    }
  };

  const handleDelete = async (id: Id<"categories">) => {
    if (!confirm("Hapus kategori ini?")) return;
    setActionError("");
    setPendingId(id);
    try {
      await deleteCategory({ categoryId: id });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setPendingId(null);
    }
  };

  const isLoading = categories === undefined;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="space-y-5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderTree className="size-4 text-brand-sky" />
              Kategori Materi CPNS
            </h3>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger
                render={
                  <Button
                    size="sm"
                    className="bg-brand-sky hover:bg-brand-sky/90 text-white gap-1.5"
                  />
                }
              >
                <Plus className="size-3.5" />
                Tambah Kategori
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white admin-dark-scroll">
                <DialogHeader>
                  <DialogTitle>Tambah Kategori Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <SettingField label="Nama Kategori">
                    <Input
                      className="bg-slate-900/50 border-slate-700 text-white"
                      placeholder="Tes Wawasan Kebangsaan"
                      value={newCat.name}
                      onChange={(e) =>
                        setNewCat({ ...newCat, name: e.target.value })
                      }
                    />
                  </SettingField>
                  <SettingField label="Slug (URL)">
                    <Input
                      className="bg-slate-900/50 border-slate-700 text-white"
                      placeholder="twk"
                      value={newCat.slug}
                      onChange={(e) =>
                        setNewCat({ ...newCat, slug: e.target.value })
                      }
                    />
                  </SettingField>
                  <SettingField label="Deskripsi">
                    <Textarea
                      className="bg-slate-900/50 border-slate-700 text-white min-h-[60px]"
                      value={newCat.description}
                      onChange={(e) =>
                        setNewCat({ ...newCat, description: e.target.value })
                      }
                    />
                  </SettingField>
                  <div className="grid grid-cols-2 gap-4">
                    <SettingField label="Icon (emoji)">
                      <Input
                        className="bg-slate-900/50 border-slate-700 text-white"
                        placeholder="🏛️"
                        value={newCat.icon}
                        onChange={(e) =>
                          setNewCat({ ...newCat, icon: e.target.value })
                        }
                      />
                    </SettingField>
                    <SettingField label="Warna">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="size-10 rounded border border-slate-700 cursor-pointer bg-transparent"
                          value={newCat.color}
                          onChange={(e) =>
                            setNewCat({ ...newCat, color: e.target.value })
                          }
                        />
                        <Input
                          className="bg-slate-900/50 border-slate-700 text-white flex-1"
                          value={newCat.color}
                          onChange={(e) =>
                            setNewCat({ ...newCat, color: e.target.value })
                          }
                        />
                      </div>
                    </SettingField>
                  </div>
                  {actionError && (
                    <p className="text-xs text-red-400">{actionError}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose
                      render={
                        <Button
                          variant="ghost"
                          className="text-slate-400 hover:text-white hover:bg-slate-700"
                        />
                      }
                    >
                      Batal
                    </DialogClose>
                    <Button
                      className="bg-brand-sky hover:bg-brand-sky/90 text-white"
                      onClick={handleAdd}
                      disabled={!newCat.name || !newCat.slug}
                    >
                      Tambah
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {actionError && !isAddOpen && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{actionError}</p>
            </div>
          )}

          <div className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-20 bg-slate-900/50" />
                <Skeleton className="h-20 bg-slate-900/50" />
              </>
            ) : sortedCategories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700/50 p-8 text-center">
                <FolderTree className="size-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  Belum ada kategori. Tambahkan kategori pertama.
                </p>
              </div>
            ) : (
              sortedCategories.map((cat) => {
                const isEditing = editingId === cat._id;
                const isPending = pendingId === cat._id;

                return (
                  <div
                    key={cat._id}
                    className="rounded-lg border border-slate-700/50 bg-slate-900/30 overflow-hidden transition-colors hover:border-slate-600/50"
                  >
                    <div
                      className="h-1"
                      style={{ backgroundColor: cat.color }}
                    />

                    {isEditing ? (
                      <div className="p-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SettingField label="Nama">
                            <Input
                              className="bg-slate-900/50 border-slate-700 text-white"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </SettingField>
                          <SettingField label="Slug">
                            <Input
                              className="bg-slate-900/50 border-slate-700 text-white"
                              value={editForm.slug}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  slug: e.target.value,
                                })
                              }
                            />
                          </SettingField>
                        </div>
                        <SettingField label="Deskripsi">
                          <Textarea
                            className="bg-slate-900/50 border-slate-700 text-white min-h-[60px]"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                          />
                        </SettingField>
                        <div className="grid grid-cols-2 gap-3">
                          <SettingField label="Icon">
                            <Input
                              className="bg-slate-900/50 border-slate-700 text-white"
                              value={editForm.icon}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  icon: e.target.value,
                                })
                              }
                            />
                          </SettingField>
                          <SettingField label="Warna">
                            <div className="flex gap-2">
                              <input
                                type="color"
                                className="size-10 rounded border border-slate-700 cursor-pointer bg-transparent"
                                value={editForm.color}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    color: e.target.value,
                                  })
                                }
                              />
                              <Input
                                className="bg-slate-900/50 border-slate-700 text-white flex-1"
                                value={editForm.color}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    color: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </SettingField>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                            onClick={() => setEditingId(null)}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="bg-brand-sky hover:bg-brand-sky/90 text-white"
                            onClick={() => handleSaveEdit(cat._id)}
                            disabled={isPending}
                          >
                            {isPending ? "Menyimpan…" : "Simpan"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4">
                        <GripVertical className="size-4 text-slate-600 shrink-0 cursor-grab" />
                        <span className="text-2xl shrink-0">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white truncate">
                              {cat.name}
                            </p>
                            <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-[10px]">
                              /{cat.slug}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {cat.description}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {cat.moduleCount} modul
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-slate-400 hover:text-white hover:bg-slate-700"
                            onClick={() => handleEdit(cat)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDelete(cat._id)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-component
// ---------------------------------------------------------------------------

function SettingField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-300">{label}</Label>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}
