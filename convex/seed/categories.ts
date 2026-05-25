// Spec 3 kategori CPNS — sesuai SKD resmi BKN.

export interface CategorySpec {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

export const CATEGORIES: CategorySpec[] = [
  {
    slug: "twk",
    name: "TWK — Tes Wawasan Kebangsaan",
    description:
      "Mengukur penguasaan pengetahuan tentang Pancasila, UUD 1945, Bhinneka Tunggal Ika, dan NKRI.",
    color: "#EF4444",
    icon: "flag",
    order: 0,
  },
  {
    slug: "tiu",
    name: "TIU — Tes Intelegensi Umum",
    description:
      "Menguji kemampuan verbal, numerik, figural, dan logika untuk problem solving.",
    color: "#0EA5E9",
    icon: "brain",
    order: 1,
  },
  {
    slug: "tkp",
    name: "TKP — Tes Karakteristik Pribadi",
    description:
      "Mengukur sikap kerja, integritas, profesionalisme, dan kemampuan beradaptasi di lingkungan ASN.",
    color: "#A855F7",
    icon: "users",
    order: 2,
  },
];
