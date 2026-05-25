import type { Metadata } from "next";
import { UjianClient } from "@/components/ujian/UjianClient";

export const metadata: Metadata = {
  title: "Ujian Simulasi CPNS — EduHub",
  description:
    "Simulasi ujian CPNS dengan kondisi sesungguhnya. Khusus pengguna Pro.",
};

export default function UjianPage() {
  return <UjianClient />;
}
