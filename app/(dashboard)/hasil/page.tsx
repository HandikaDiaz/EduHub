import type { Metadata } from "next";
import { HasilClient } from "@/components/hasil/HasilClient";

export const metadata: Metadata = {
  title: "Hasil Saya — EduHub",
  description:
    "Lihat statistik, tren nilai, dan riwayat lengkap latihan serta ujian CPNS kamu.",
};

export default function HasilPage() {
  return <HasilClient />;
}
