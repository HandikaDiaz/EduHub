import type { Metadata } from "next";
import { LatihanClient } from "@/components/latihan/LatihanClient";

export const metadata: Metadata = {
  title: "Latihan Soal — EduHub",
  description:
    "Latihan soal CPNS dengan pembahasan lengkap. Asah kemampuan TWK, TIU, dan TKP.",
};

export default function LatihanPage() {
  return <LatihanClient />;
}
