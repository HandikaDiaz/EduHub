import type { Metadata } from "next";
import { AdminMateriClient } from "@/components/admin/AdminMateriClient";

export const metadata: Metadata = {
  title: "Manajemen Materi | EduHub Admin",
  description: "Kelola materi pembelajaran EduHub",
};

export default function AdminMateriPage() {
  return <AdminMateriClient />;
}
