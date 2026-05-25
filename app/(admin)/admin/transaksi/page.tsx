import type { Metadata } from "next";
import { AdminTransaksiClient } from "@/components/admin/AdminTransaksiClient";

export const metadata: Metadata = {
  title: "Riwayat Transaksi | EduHub Admin",
};

export default function AdminTransaksiPage() {
  return <AdminTransaksiClient />;
}
