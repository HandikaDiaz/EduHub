import type { Metadata } from "next";
import { AdminPengaturanClient } from "@/components/admin/AdminPengaturanClient";

export const metadata: Metadata = {
  title: "Pengaturan | EduHub Admin",
};

export default function AdminPengaturanPage() {
  return <AdminPengaturanClient />;
}
