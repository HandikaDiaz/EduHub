import type { Metadata } from "next";
import { AdminLatihanClient } from "@/components/admin/AdminLatihanClient";

export const metadata: Metadata = {
  title: "Manajemen Latihan | EduHub Admin",
  description: "Kelola latihan, atur akses tier free/pro per latihan",
};

export default function AdminLatihanPage() {
  return <AdminLatihanClient />;
}
