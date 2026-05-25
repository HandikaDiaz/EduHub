import type { Metadata } from "next";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | EduHub",
  description: "Manajemen konten dan pengguna EduHub",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
