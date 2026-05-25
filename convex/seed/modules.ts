// Spec ~11 modul, 3-4 per kategori.
// Modul pertama tiap kategori `isFree: true` supaya user free bisa preview konten.

export interface ModuleSpec {
  categorySlug: "twk" | "tiu" | "tkp";
  slug: string;
  title: string;
  description: string;
  videoUrl: string;
  isFree: boolean;
  order: number;
  /** Filename di `convex/seed/questions/` (tanpa `.ts`). */
  questionsKey: string;
}

const PLACEHOLDER_VIDEO = "https://www.youtube.com/embed/dQw4w9WgXcQ";

export const MODULES: ModuleSpec[] = [
  // ---- TWK ----
  {
    categorySlug: "twk",
    slug: "pancasila",
    title: "Pancasila — Dasar Negara",
    description:
      "Memahami sejarah perumusan, makna sila-sila, dan implementasi Pancasila dalam kehidupan berbangsa.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: true,
    order: 0,
    questionsKey: "twk_pancasila",
  },
  {
    categorySlug: "twk",
    slug: "uud-1945",
    title: "UUD 1945 — Konstitusi Republik Indonesia",
    description:
      "Pembukaan, batang tubuh, amandemen, dan lembaga-lembaga negara berdasarkan UUD 1945.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 1,
    questionsKey: "twk_uud_1945",
  },
  {
    categorySlug: "twk",
    slug: "bhinneka-tunggal-ika",
    title: "Bhinneka Tunggal Ika — Persatuan dalam Keberagaman",
    description:
      "Konsep multikulturalisme, toleransi, dan integrasi nasional dalam konteks Indonesia modern.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 2,
    questionsKey: "twk_bhinneka",
  },
  {
    categorySlug: "twk",
    slug: "nkri-bela-negara",
    title: "NKRI & Bela Negara",
    description:
      "Wawasan Nusantara, ketahanan nasional, dan kewajiban warga negara dalam membela NKRI.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 3,
    questionsKey: "twk_nkri",
  },

  // ---- TIU ----
  {
    categorySlug: "tiu",
    slug: "verbal-analogi",
    title: "Verbal — Analogi & Sinonim/Antonim",
    description:
      "Latihan padanan kata, lawan kata, dan analogi pasangan kata untuk mengasah penalaran verbal.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: true,
    order: 0,
    questionsKey: "tiu_verbal",
  },
  {
    categorySlug: "tiu",
    slug: "numerik-deret",
    title: "Numerik — Aritmetika & Deret",
    description:
      "Operasi hitung, perbandingan, deret angka, dan soal cerita matematika tingkat dasar.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 1,
    questionsKey: "tiu_numerik",
  },
  {
    categorySlug: "tiu",
    slug: "figural-pola",
    title: "Figural — Pola & Penalaran Gambar",
    description:
      "Latihan mengenali pola gambar, persamaan bentuk, dan analogi visual.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 2,
    questionsKey: "tiu_figural",
  },
  {
    categorySlug: "tiu",
    slug: "logika",
    title: "Logika — Silogisme & Penarikan Kesimpulan",
    description:
      "Penalaran deduktif, silogisme, dan analisis pernyataan logika formal.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 3,
    questionsKey: "tiu_logika",
  },

  // ---- TKP ----
  {
    categorySlug: "tkp",
    slug: "pelayanan-publik",
    title: "Pelayanan Publik — Etika & Profesionalisme",
    description:
      "Sikap melayani masyarakat dengan integritas, transparansi, dan responsivitas tinggi.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: true,
    order: 0,
    questionsKey: "tkp_pelayanan_publik",
  },
  {
    categorySlug: "tkp",
    slug: "jejaring-kerja",
    title: "Jejaring Kerja — Kolaborasi & Komunikasi",
    description:
      "Kemampuan membangun relasi profesional, kerja tim, dan komunikasi efektif lintas unit.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 1,
    questionsKey: "tkp_jejaring_kerja",
  },
  {
    categorySlug: "tkp",
    slug: "sosial-budaya",
    title: "Sosial Budaya — Adaptasi & Toleransi",
    description:
      "Sikap inklusif, kepedulian sosial, dan adaptasi terhadap keberagaman budaya di Indonesia.",
    videoUrl: PLACEHOLDER_VIDEO,
    isFree: false,
    order: 2,
    questionsKey: "tkp_sosial_budaya",
  },
];
