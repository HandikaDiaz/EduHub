"use client";

import {
  Users,
  UserCheck,
  CreditCard,
  BookOpen,
  PlusCircle,
  FileEdit,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TxnStatus = "pending" | "success" | "failed" | "expired";

const STATUS_LABEL: Record<TxnStatus, string> = {
  pending: "Pending",
  success: "Sukses",
  failed: "Gagal",
  expired: "Expired",
};

const STATUS_CLASS: Record<TxnStatus, string> = {
  success: "text-emerald-400 border-emerald-500/30",
  pending: "text-amber-400 border-amber-500/30",
  failed: "text-red-400 border-red-500/30",
  expired: "text-slate-400 border-slate-500/30",
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const formatCompactIDR = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
};

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ts));

export function AdminDashboardClient() {
  const data = useQuery(api.admin.getDashboardStats);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-gray-400 text-sm mt-1">
            Selamat datang kembali! Berikut ringkasan platform EduHub saat ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-brand-sky hover:bg-brand-sky/90 text-white shadow-lg shadow-sky-500/20"
            render={<Link href="/admin/materi" />}
          >
            <PlusCircle className="mr-2" size={16} />
            Tambah Materi Baru
          </Button>
          <Button
            className="bg-brand-purple hover:bg-brand-purple/90 text-white shadow-lg shadow-purple-500/20"
            render={<Link href="/admin/quiz" />}
          >
            <FileEdit className="mr-2" size={16} />
            Buat Quiz Baru
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {data ? (
          <>
            <StatCard
              title="Total Users"
              value={data.users.total.toLocaleString("id-ID")}
              icon={<Users size={24} className="text-sky-500" />}
              trend={`${data.users.admin} admin • ${data.users.free} free`}
            />
            <StatCard
              title="Users Pro Aktif"
              value={data.users.pro.toLocaleString("id-ID")}
              icon={<UserCheck size={24} className="text-emerald-500" />}
              trend={`${data.users.trial} trial aktif`}
            />
            <StatCard
              title="Pendapatan 30 Hari"
              value={formatCompactIDR(data.revenue.last30DaysIDR)}
              icon={<CreditCard size={24} className="text-purple-500" />}
              trend={`Total: ${formatCompactIDR(data.revenue.totalIDR)}`}
            />
            <StatCard
              title="Materi & Quiz"
              value={`${data.content.modules}`}
              icon={<BookOpen size={24} className="text-amber-500" />}
              trend={`${data.content.publishedModules} terbit • ${data.content.quizzes} quiz`}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-2xl" />
          ))
        )}
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Transaksi Terbaru</h2>
          <Link
            href="/admin/transaksi"
            className="text-sm text-brand-sky hover:underline"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-800/50">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Nama User</TableHead>
                <TableHead className="text-gray-400">Order ID</TableHead>
                <TableHead className="text-gray-400">Tanggal</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400 text-right">
                  Nominal
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data ? (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full bg-gray-800" />
                  </TableCell>
                </TableRow>
              ) : data.recentTransactions.length === 0 ? (
                <TableRow className="border-gray-800">
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-8"
                  >
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                data.recentTransactions.map((trx) => (
                  <TableRow
                    key={trx._id}
                    className="border-gray-800 hover:bg-gray-800/50"
                  >
                    <TableCell className="font-medium text-gray-200">
                      {trx.userName}
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono text-xs">
                      {trx.orderId}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {formatDate(trx.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`bg-transparent ${STATUS_CLASS[trx.status as TxnStatus]}`}
                      >
                        {STATUS_LABEL[trx.status as TxnStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-200">
                      {formatIDR(trx.amount)}
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

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{trend}</p>
      </div>
    </div>
  );
}
