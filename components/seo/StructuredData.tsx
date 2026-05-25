/**
 * JSON-LD structured data untuk EduHub.
 *
 * Schema yang dipakai:
 *   - Organization: identitas brand (nama, logo, sosial media)
 *   - WebSite: site search action (kalau ada search) — disable kalau belum
 *   - Course: produk inti EduHub (kursus persiapan CPNS) → memungkinkan
 *     rich snippet "Course" di Google Search
 *   - FAQPage: FAQ landing → rich snippet drop-down di SERP
 *
 * Render via <Script type="application/ld+json"> di server component supaya
 * crawler langsung lihat di HTML pertama.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://eduhub.id";

const ORG_ID = `${SITE_URL}#organization`;
const SITE_ID = `${SITE_URL}#website`;
const COURSE_ID = `${SITE_URL}#course`;

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": ORG_ID,
  name: "EduHub",
  alternateName: "EduHub Indonesia",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  description:
    "Platform persiapan CPNS terlengkap dengan video materi, latihan soal, dan ujian simulasi untuk TWK, TIU, dan TKP.",
  sameAs: [
    // Isi link sosial media saat sudah ada akun resmi:
    // "https://www.instagram.com/eduhub.id",
    // "https://www.tiktok.com/@eduhub.id",
    // "https://www.youtube.com/@eduhub.id",
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
    addressLocality: "Indonesia",
  },
};

// ---------------------------------------------------------------------------
// WebSite
// ---------------------------------------------------------------------------

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE_URL,
  name: "EduHub",
  description:
    "Platform belajar online untuk persiapan ujian CPNS di Indonesia.",
  publisher: { "@id": ORG_ID },
  inLanguage: "id-ID",
};

// ---------------------------------------------------------------------------
// Course (TWK + TIU + TKP) — schema "Course" untuk rich result Course
// ---------------------------------------------------------------------------

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": COURSE_ID,
  name: "Persiapan Ujian CPNS — TWK, TIU, & TKP",
  description:
    "Kursus persiapan SKD CPNS lengkap meliputi Tes Wawasan Kebangsaan (Pancasila, UUD 1945, Bhinneka Tunggal Ika, NKRI), Tes Intelegensi Umum (verbal, numerik, figural, logika), dan Tes Karakteristik Pribadi.",
  provider: { "@id": ORG_ID },
  url: SITE_URL,
  inLanguage: "id-ID",
  educationalLevel: "Profesional / Persiapan Karier",
  about: [
    "Tes Wawasan Kebangsaan",
    "Tes Intelegensi Umum",
    "Tes Karakteristik Pribadi",
    "Pancasila",
    "UUD 1945",
    "Bhinneka Tunggal Ika",
    "NKRI",
    "Bela Negara",
  ],
  // Course Instance — wajib untuk rich result Course di Google
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "PT2H", // ~2 jam per sesi (saran belajar harian)
    inLanguage: "id-ID",
  },
  // Offers — gratis untuk modul tertentu, ada paket Pro
  offers: [
    {
      "@type": "Offer",
      name: "Akses Free",
      price: "0",
      priceCurrency: "IDR",
      category: "Free",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "EduHub Pro — 1 Tahun",
      price: "199000",
      priceCurrency: "IDR",
      category: "Subscription",
      availability: "https://schema.org/InStock",
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ — pertanyaan umum CPNS yang sering dicari di Google
// ---------------------------------------------------------------------------

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Apa saja materi yang diuji dalam SKD CPNS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seleksi Kompetensi Dasar (SKD) CPNS terdiri dari tiga sub-tes: TWK (Tes Wawasan Kebangsaan) seputar Pancasila, UUD 1945, Bhinneka Tunggal Ika, dan NKRI; TIU (Tes Intelegensi Umum) yang mencakup penalaran verbal, numerik, figural, dan logika; serta TKP (Tes Karakteristik Pribadi) yang mengukur sikap kerja dan profesionalisme.",
      },
    },
    {
      "@type": "Question",
      name: "Berapa harga langganan EduHub Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paket EduHub Pro adalah Rp 199.000 untuk akses 1 tahun penuh ke semua materi, latihan tanpa batas, dan ujian simulasi CPNS lengkap. Tersedia juga trial 3 hari gratis tanpa kartu kredit.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah EduHub menyediakan latihan soal CPNS gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ya. Pengguna gratis bisa akses sebagian materi TWK, TIU, dan TKP plus 10 latihan soal per hari. Untuk akses penuh dengan latihan tanpa batas dan ujian simulasi, upgrade ke EduHub Pro.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah soal di EduHub mirip dengan ujian CPNS resmi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Soal di EduHub disusun mengikuti format dan tingkat kesulitan SKD CPNS resmi BKN, termasuk tipe soal pilihan ganda, multi-jawaban, dan tabel benar/salah. Ujian simulasi memakai durasi dan jumlah soal yang sama dengan ujian resmi.",
      },
    },
    {
      "@type": "Question",
      name: "Bisakah saya belajar di EduHub melalui handphone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ya, EduHub bisa diakses 24/7 melalui browser handphone, tablet, dan komputer. Tampilan dioptimalkan untuk semua perangkat sehingga kamu bisa belajar kapan saja dan di mana saja.",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StructuredDataProps {
  /** Sertakan FAQ schema (hanya di landing page, tidak duplikat di halaman lain). */
  includeFaq?: boolean;
  /** Sertakan Course schema (rich result Course). */
  includeCourse?: boolean;
}

/**
 * Render JSON-LD scripts di server (no client JS). Gunakan di halaman public
 * yang ingin di-index, mis. landing page.
 */
export function StructuredData({
  includeFaq = true,
  includeCourse = true,
}: StructuredDataProps) {
  const schemas: object[] = [organizationSchema, websiteSchema];
  if (includeCourse) schemas.push(courseSchema);
  if (includeFaq) schemas.push(faqSchema);

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
