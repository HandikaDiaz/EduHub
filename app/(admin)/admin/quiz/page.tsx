import type { Metadata } from "next";
import { AdminQuizClient } from "@/components/admin/AdminQuizClient";

export const metadata: Metadata = {
  title: "Manajemen Quiz | EduHub Admin",
  description: "Kelola daftar quiz EduHub",
};

export default function AdminQuizPage() {
  return <AdminQuizClient />;
}
