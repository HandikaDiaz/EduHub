import type { Metadata } from "next";
import { MateriListClient } from "@/components/materi/MateriListClient";

export const metadata: Metadata = {
  title: "Materi CPNS | EduHub",
  description:
    "Semua materi pembelajaran CPNS: TWK, TIU, dan TKP dalam satu tempat.",
};

export default function MateriIndexPage() {
  return <MateriListClient />;
}
