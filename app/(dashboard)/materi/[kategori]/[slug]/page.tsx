import type { Metadata } from "next";
import { MateriDetailClient } from "@/components/materi/MateriDetailClient";

export const metadata: Metadata = {
  title: "Materi | EduHub",
  description: "Pelajari materi CPNS lengkap dengan video dan soal latihan.",
};

export default async function MateriDetailPage({
  params,
}: {
  params: Promise<{ kategori: string; slug: string }>;
}) {
  const { kategori, slug } = await params;
  return <MateriDetailClient slug={slug} kategori={kategori} />;
}
