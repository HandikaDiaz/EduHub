"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Eye,
  Loader2,
  AlertTriangle,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useMutation, usePaginatedQuery } from "convex/react";
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

type Tier = "free" | "trial" | "pro";
type Role = "user" | "admin";

type AdminUser = {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  email: string;
  role: Role;
  tier: Tier;
  trialUsed: boolean;
  trialExpiredAt: number | null;
  proExpiredAt: number | null;
  isDeleted: boolean;
  createdAt: number;
  attemptCount: number;
  totalSpent: number;
};

const TIER_STYLE: Record<Tier, { badge: string; label: string }> = {
  free: {
    badge: "bg-gray-500/10 text-gray-400 border-gray-600/30",
    label: "Free",
  },
  trial: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    label: "Trial",
  },
  pro: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    label: "Pro",
  },
};

const ROLE_STYLE: Record<Role, { badge: string; label: string }> = {
  user: {
    badge: "bg-slate-500/10 text-slate-400 border-slate-600/30",
    label: "User",
  },
  admin: {
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    label: "Admin",
  },
};

const FILTER_TABS = [
  { key: "all", label: "Semua" },
  { key: "free", label: "Free" },
  { key: "pro", label: "Pro" },
  { key: "trial", label: "Trial" },
] as const;

type FilterTab = (typeof FILTER_TABS)[number]["key"];

const formatDate = (ts: number | null) => {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ts));
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

// ---------------------------------------------------------------------------
// User Detail Dialog — tier / role / delete mutations
// ---------------------------------------------------------------------------

function UserDetailDialog({ user }: { user: AdminUser }) {
  const [selectedTier, setSelectedTier] = useState<Tier>(user.tier);
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const updateTier = useMutation(api.users.updateUserTier);
  const updateRole = useMutation(api.users.updateUserRole);
  const softDelete = useMutation(api.users.softDeleteUserAdmin);

  const tierInfo = TIER_STYLE[user.tier];
  const roleInfo = ROLE_STYLE[user.role];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (selectedTier !== user.tier) {
        await updateTier({ userId: user._id, tier: selectedTier });
      }
      if (selectedRole !== user.role) {
        await updateRole({ userId: user._id, role: selectedRole });
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Hapus akun ${user.name}? Akun akan ditandai terhapus (soft delete).`,
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await softDelete({ userId: user._id });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus akun");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSelectedTier(user.tier);
      setSelectedRole(user.role);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-sky-400 hover:bg-sky-400/10"
          />
        }
      >
        <Eye className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm bg-gray-900 border-gray-800 text-white p-0 gap-0 admin-dark-scroll">
        <DialogHeader className="p-6 pb-4 border-b border-gray-800">
          <DialogTitle>Detail Pengguna</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-sky/20 text-lg font-bold text-brand-sky">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate">{user.name}</p>
              <p className="text-sm text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Current status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-800 p-3">
              <p className="text-[11px] text-slate-500">Tier Saat Ini</p>
              <Badge className={tierInfo.badge}>{tierInfo.label}</Badge>
            </div>
            <div className="rounded-lg bg-slate-800 p-3">
              <p className="text-[11px] text-slate-500">Role</p>
              <Badge className={roleInfo.badge}>{roleInfo.label}</Badge>
            </div>
            <div className="rounded-lg bg-slate-800 p-3">
              <p className="text-[11px] text-slate-500">Bergabung</p>
              <p className="text-sm text-slate-200">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800 p-3">
              <p className="text-[11px] text-slate-500">
                {user.tier === "pro" ? "Pro Berakhir" : "Trial Berakhir"}
              </p>
              <p className="text-sm text-slate-200">
                {user.tier === "pro"
                  ? formatDate(user.proExpiredAt)
                  : formatDate(user.trialExpiredAt)}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-800 p-3 text-center">
              <p className="text-[11px] text-slate-500">Total Quiz</p>
              <p className="text-xl font-bold text-white">
                {user.attemptCount}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800 p-3 text-center">
              <p className="text-[11px] text-slate-500">Total Spending</p>
              <p className="text-lg font-bold text-white">
                {formatIDR(user.totalSpent)}
              </p>
            </div>
          </div>

          {/* Tier picker */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Ubah Tier</p>
            <div className="grid grid-cols-3 gap-2">
              {(["free", "trial", "pro"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`rounded-lg border p-2 text-center text-sm capitalize transition-colors ${
                    selectedTier === t
                      ? "border-brand-sky bg-brand-sky/10 text-brand-sky"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Role picker */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="size-4" /> Ubah Role
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`rounded-lg border p-2 text-center text-sm capitalize transition-colors ${
                    selectedRole === r
                      ? "border-purple-500 bg-purple-500/10 text-purple-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-2">
            <p className="text-sm font-medium text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="size-4" /> Danger Zone
            </p>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={saving || user.isDeleted}
              className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="mr-2 size-4" />
              {user.isDeleted ? "Sudah Dihapus" : "Hapus Akun"}
            </Button>
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
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              />
            }
          >
            Tutup
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              (selectedTier === user.tier && selectedRole === user.role)
            }
            className="bg-brand-sky hover:bg-brand-sky/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function AdminUsersClient() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filterArg = useMemo(() => {
    if (activeTab === "all") return undefined;
    return { tier: activeTab as Tier };
  }, [activeTab]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.users.listUsersAdmin,
    { filter: filterArg },
    { initialNumItems: 25 },
  );

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [results, searchQuery]);

  const isLoadingInitial = status === "LoadingFirstPage";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Manajemen Users</h1>
        <p className="text-gray-400 text-sm mt-1">
          Kelola pengguna, ubah tier, dan lihat progress belajar.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-900 p-4 border border-gray-800 rounded-xl">
        <div className="flex bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none ${
                activeTab === tab.key
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4" />
          <Input
            placeholder="Cari nama atau email..."
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
                <TableHead className="text-gray-400">Nama</TableHead>
                <TableHead className="text-gray-400 hidden sm:table-cell">
                  Email
                </TableHead>
                <TableHead className="text-gray-400">Tier</TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">
                  Role
                </TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">
                  Bergabung
                </TableHead>
                <TableHead className="text-gray-400 hidden lg:table-cell">
                  Quiz
                </TableHead>
                <TableHead className="text-gray-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingInitial ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-800">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full bg-gray-800" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-gray-500"
                  >
                    Tidak ada pengguna yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => {
                  const tierInfo = TIER_STYLE[user.tier];
                  const roleInfo = ROLE_STYLE[user.role];
                  return (
                    <TableRow
                      key={user._id}
                      className="border-gray-800 hover:bg-gray-800/50"
                    >
                      <TableCell className="font-medium text-gray-200">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-gray-400 hidden sm:table-cell">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={tierInfo.badge}>
                          {tierInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={roleInfo.badge}>
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 hidden md:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-gray-400 hidden lg:table-cell">
                        {user.attemptCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserDetailDialog user={user} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {status === "CanLoadMore" && (
          <div className="p-4 border-t border-gray-800 flex justify-center">
            <Button
              variant="outline"
              onClick={() => loadMore(25)}
              className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Muat Lebih Banyak
            </Button>
          </div>
        )}
        {status === "LoadingMore" && (
          <div className="p-4 border-t border-gray-800 flex justify-center">
            <Loader2 className="size-5 animate-spin text-gray-500" />
          </div>
        )}
      </div>
    </div>
  );
}
