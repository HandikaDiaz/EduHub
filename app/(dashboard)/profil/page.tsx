import type { Metadata } from "next";
import { ProfilClient } from "@/components/profil/ProfilClient";

export const metadata: Metadata = {
  title: "Profil Saya — EduHub",
  description:
    "Kelola akun, lihat ringkasan belajar, dan riwayat transaksi.",
};

export default function ProfilPage() {
  return <ProfilClient />;
}
