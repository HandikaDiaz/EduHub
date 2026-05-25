"use client";

import { useMemo, useState } from "react";
import { Search, Download, Calendar, Loader2 } from "lucide-react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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

type TxnStatus = "pending" | "success" | "failed" | "expired";

const STATUS_STYLE: Record<TxnStatus, { badge: string; label: string }> = {
  success: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    label: "Sukses",
  },
  pending: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    label: "Pending",
  },
  failed: {
    badge: "bg-red-500/10 text-red-400 border-red-500/30",
    label: "Gagal",
  },
  expired: {
    badge: "bg-gray-500/10 text-gray-400 border-gray-600/30",
    label: "Expired",
  },
};

const FILTER_TABS = [
  { key: "all", label: "Semua" },
  { key: "success", label: "Sukses" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Gagal" },
  { key: "expired", label: "Expired" },
] as const;

type FilterTab = (typeof FILTER_TABS)[number]["key"];

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const formatDateTime = (ts: number) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));

const parseLocalDate = (value: string): number | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.getTime();
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function AdminTransaksiClient() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filterArg = useMemo(() => {
    const f: {
      status?: Exclude<FilterTab, "all">;
      fromDate?: number;
      toDate?: number;
    } = {};
    if (activeTab !== "all") f.status = activeTab;
    const from = parseLocalDate(dateFrom);
    if (from !== undefined) f.fromDate = from;
    const to = parseLocalDate(dateTo);
    if (to !== undefined) {
      // include entire end-day
      f.toDate = to + 24 * 60 * 60 * 1000 - 1;
    }
    return Object.keys(f).length > 0 ? f : undefined;
  }, [activeTab, dateFrom, dateTo]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.transactions.listTransactionsAdmin,
    { filter: filterArg },
    { initialNumItems: 25 },
  );
  const stats = useQuery(api.transactions.getTransactionStats);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter(
      (t) =>
        t.userName.toLowerCase().includes(q) ||
        t.midtransOrderId.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q),
    );
  }, [results, searchQuery]);

  const totalFilteredSuccess = useMemo(
    () =>
      filtered.reduce(
        (sum, t) => (t.status === "success" ? sum + t.amount : sum),
        0,
      ),
    [filtered],
  );

  const pendingCount = useMemo(
    () => filtered.filter((t) => t.status === "pending").length,
    [filtered],
  );

  const isLoadingInitial = status === "LoadingFirstPage";

  const handleExport = () => {
    const csv = [
      "ID Transaksi,User,Email,Nominal,Metode,Status,Tanggal",
      ...filtered.map((t) =>
        [
          t.midtransOrderId,
          t.userName,
          t.userEmail,
          t.amount,
          t.paymentMethod ?? "-",
          STATUS_STYLE[t.status].label,
          formatDateTime(t.createdAt),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaksi-eduhub-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Transaksi</h1>
          <p className="text-gray-400 text-sm mt-1">
            Pantau pembayaran dan unduh laporan.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={filtered.length === 0}
          className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white w-full sm:w-auto"
          onClick={handleExport}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 bg-gray-900 p-4 border border-gray-800 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
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
              placeholder="Cari user, email, atau ID..."
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-brand-sky/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Date range */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Calendar className="size-4 text-slate-500 shrink-0 hidden sm:block" />
          <Input
            type="date"
            className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-sky/50 w-full sm:w-auto"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-slate-500 text-sm">s/d</span>
          <Input
            type="date"
            className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-sky/50 w-full sm:w-auto"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-slate-500">Ditampilkan</p>
          <p className="text-2xl font-bold text-white">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-slate-500">Total Sukses (filter)</p>
          <p className="text-xl font-bold text-emerald-400">
            {formatRupiah(totalFilteredSuccess)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-slate-500">Revenue Total</p>
          <p className="text-xl font-bold text-emerald-400">
            {stats ? (
              formatRupiah(stats.totalRevenue)
            ) : (
              <Skeleton className="h-7 w-24 bg-gray-800" />
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-800/50">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">ID Transaksi</TableHead>
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Nominal</TableHead>
                <TableHead className="text-gray-400 hidden sm:table-cell">
                  Metode
                </TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell text-right">
                  Tanggal
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingInitial ? (
                Array.from({ length: 5 }).map((_, i) => (
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
                    Tidak ada transaksi yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((trx) => {
                  const statusInfo = STATUS_STYLE[trx.status];
                  return (
                    <TableRow
                      key={trx._id}
                      className="border-gray-800 hover:bg-gray-800/50"
                    >
                      <TableCell className="font-mono text-xs text-gray-400">
                        {trx.midtransOrderId}
                      </TableCell>
                      <TableCell className="font-medium text-gray-200">
                        <div>{trx.userName}</div>
                        <div className="text-xs text-gray-500">
                          {trx.userEmail}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-200 tabular-nums">
                        {formatRupiah(trx.amount)}
                      </TableCell>
                      <TableCell className="text-gray-400 hidden sm:table-cell">
                        {trx.paymentMethod ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.badge}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-right hidden md:table-cell">
                        {formatDateTime(trx.createdAt)}
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
