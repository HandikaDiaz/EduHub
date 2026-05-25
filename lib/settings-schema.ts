export interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  contactEmail: string;
}

export interface ContentSettings {
  passingScore: number;
  defaultQuizDuration: number;
  defaultMaxQuestions: number;
  trialDurationDays: number;
  showExplanationAfterQuiz: boolean;
  allowRetake: boolean;
}

export interface PaymentSettings {
  proMonthlyPrice: number;
  midtransMode: "sandbox" | "production";
  midtransStatus: "connected" | "disconnected";
}

export const defaultPlatformSettings: PlatformSettings = {
  siteName: "EduHub CPNS",
  siteDescription:
    "Platform persiapan ujian CPNS terlengkap dengan materi video, latihan soal, dan ujian simulasi.",
  maintenanceMode: false,
  registrationOpen: true,
  contactEmail: "admin@eduhub.id",
};

export const defaultContentSettings: ContentSettings = {
  passingScore: 70,
  defaultQuizDuration: 30,
  defaultMaxQuestions: 10,
  trialDurationDays: 7,
  showExplanationAfterQuiz: true,
  allowRetake: true,
};

export const defaultPaymentSettings: PaymentSettings = {
  proMonthlyPrice: 199000,
  midtransMode: "sandbox",
  midtransStatus: "connected",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const parsePlatformSettings = (
  raw: string | null,
): PlatformSettings => {
  if (!raw) return defaultPlatformSettings;
  try {
    const v = JSON.parse(raw);
    if (!isRecord(v)) return defaultPlatformSettings;
    return {
      siteName:
        typeof v.siteName === "string" && v.siteName.length > 0
          ? v.siteName
          : defaultPlatformSettings.siteName,
      siteDescription:
        typeof v.siteDescription === "string"
          ? v.siteDescription
          : defaultPlatformSettings.siteDescription,
      maintenanceMode:
        typeof v.maintenanceMode === "boolean"
          ? v.maintenanceMode
          : defaultPlatformSettings.maintenanceMode,
      registrationOpen:
        typeof v.registrationOpen === "boolean"
          ? v.registrationOpen
          : defaultPlatformSettings.registrationOpen,
      contactEmail:
        typeof v.contactEmail === "string" && EMAIL_RE.test(v.contactEmail)
          ? v.contactEmail
          : defaultPlatformSettings.contactEmail,
    };
  } catch {
    return defaultPlatformSettings;
  }
};

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
};

export const parseContentSettings = (raw: string | null): ContentSettings => {
  if (!raw) return defaultContentSettings;
  try {
    const v = JSON.parse(raw);
    if (!isRecord(v)) return defaultContentSettings;
    return {
      passingScore: clampInt(
        v.passingScore,
        0,
        100,
        defaultContentSettings.passingScore,
      ),
      defaultQuizDuration: clampInt(
        v.defaultQuizDuration,
        1,
        300,
        defaultContentSettings.defaultQuizDuration,
      ),
      defaultMaxQuestions: clampInt(
        v.defaultMaxQuestions,
        1,
        200,
        defaultContentSettings.defaultMaxQuestions,
      ),
      trialDurationDays: clampInt(
        v.trialDurationDays,
        0,
        365,
        defaultContentSettings.trialDurationDays,
      ),
      showExplanationAfterQuiz:
        typeof v.showExplanationAfterQuiz === "boolean"
          ? v.showExplanationAfterQuiz
          : defaultContentSettings.showExplanationAfterQuiz,
      allowRetake:
        typeof v.allowRetake === "boolean"
          ? v.allowRetake
          : defaultContentSettings.allowRetake,
    };
  } catch {
    return defaultContentSettings;
  }
};

export const parsePaymentSettings = (raw: string | null): PaymentSettings => {
  if (!raw) return defaultPaymentSettings;
  try {
    const v = JSON.parse(raw);
    if (!isRecord(v)) return defaultPaymentSettings;
    return {
      proMonthlyPrice: clampInt(
        v.proMonthlyPrice,
        0,
        Number.MAX_SAFE_INTEGER,
        defaultPaymentSettings.proMonthlyPrice,
      ),
      midtransMode:
        v.midtransMode === "sandbox" || v.midtransMode === "production"
          ? v.midtransMode
          : defaultPaymentSettings.midtransMode,
      midtransStatus:
        v.midtransStatus === "connected" || v.midtransStatus === "disconnected"
          ? v.midtransStatus
          : defaultPaymentSettings.midtransStatus,
    };
  } catch {
    return defaultPaymentSettings;
  }
};

export const validatePlatformSettings = (
  v: PlatformSettings,
): string | null => {
  if (!v.siteName.trim()) return "Nama platform harus diisi";
  if (!EMAIL_RE.test(v.contactEmail)) return "Format email tidak valid";
  return null;
};

export const validateContentSettings = (v: ContentSettings): string | null => {
  if (v.passingScore < 0 || v.passingScore > 100)
    return "Nilai minimum lulus harus 0-100";
  if (v.defaultQuizDuration < 1) return "Durasi default minimal 1 menit";
  if (v.defaultMaxQuestions < 1) return "Jumlah soal default minimal 1";
  if (v.trialDurationDays < 0) return "Durasi trial tidak boleh negatif";
  return null;
};

export const validatePaymentSettings = (v: PaymentSettings): string | null => {
  if (v.proMonthlyPrice < 0) return "Harga tidak boleh negatif";
  return null;
};
