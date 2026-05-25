import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Cloudinary auth — singleton config
// ---------------------------------------------------------------------------

let _configured = false;

const ensureConfigured = () => {
  if (_configured) return;

  const url = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Mode 1: pakai CLOUDINARY_URL tunggal (format: cloudinary://key:secret@cloud)
  // Mode 2: tiga var terpisah
  if (url) {
    // SDK akan auto-baca CLOUDINARY_URL dari env, tidak perlu config manual.
    cloudinary.config({ secure: true });
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  } else {
    throw new Error(
      "Cloudinary belum dikonfigurasi. Set CLOUDINARY_URL atau " +
        "CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET di .env.local",
    );
  }

  _configured = true;
};

// ---------------------------------------------------------------------------
// Upload helper
// ---------------------------------------------------------------------------

export interface CloudinaryUploadResult {
  publicId: string;
  /** Direct URL — bisa langsung dipakai di <img src="..." />. Sudah HTTPS. */
  url: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Convert image buffer ke WebP via sharp (lossy q=82, ukuran maks 1600px sisi
 * terpanjang), lalu upload ke Cloudinary di folder `eduhub/`.
 *
 * Konversi WebP dilakukan di server SEBELUM upload — file yang tersimpan di
 * Cloudinary memang sudah WebP, bukan original yang di-transform di delivery.
 */
export const uploadImageToCloudinary = async (params: {
  buffer: Buffer;
  filenameHint: string;
}): Promise<CloudinaryUploadResult> => {
  ensureConfigured();

  // ---- 1. Magic byte check via sharp metadata ----
  // Defense in depth: client kirim Content-Type bisa di-spoof. Sharp baca
  // header file mentah dan throw kalau bukan format gambar valid. Selain itu
  // kita allowlist format dasar yang sharp kenal sebagai gambar.
  const ALLOWED_FORMATS = new Set([
    "jpeg",
    "jpg",
    "png",
    "webp",
    "gif",
    "avif",
    "heif",
    "tiff",
  ]);
  let detectedFormat: string | undefined;
  try {
    const metadata = await sharp(params.buffer).metadata();
    detectedFormat = metadata.format;
  } catch {
    throw new Error("File tidak valid sebagai gambar.");
  }
  if (!detectedFormat || !ALLOWED_FORMATS.has(detectedFormat)) {
    throw new Error(
      `Format gambar tidak didukung (terdeteksi: ${detectedFormat ?? "unknown"}).`,
    );
  }

  // ---- 2. Convert ke WebP via sharp ----
  const processed = await sharp(params.buffer)
    .rotate() // auto-orient via EXIF
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const webpBuffer = processed.data;
  const { width, height } = processed.info;

  // ---- 3. Sanitize filename → public_id ----
  const baseName = params.filenameHint
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^\w\-]/g, "_")
    .slice(0, 60);
  const publicId = `${baseName || "image"}-${Date.now()}`;

  // ---- 4. Upload via stream ----
  const uploadResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "eduhub",
          public_id: publicId,
          // resource_type "image" (default). Format WebP karena buffer sudah
          // WebP — Cloudinary tetap simpan sesuai input.
          format: "webp",
          // overwrite default true — public_id unik karena timestamp.
          overwrite: false,
          // Tagging memudahkan cleanup nanti.
          tags: ["eduhub", "soal-pembahasan"],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Cloudinary upload kosong"));
          resolve(result);
        },
      );
      stream.end(webpBuffer);
    },
  );

  return {
    publicId: uploadResult.public_id,
    // secure_url selalu HTTPS. Cloudinary CDN auto-cache di edge.
    url: uploadResult.secure_url,
    sizeBytes: webpBuffer.byteLength,
    width: width ?? uploadResult.width ?? 0,
    height: height ?? uploadResult.height ?? 0,
  };
};

/**
 * Hapus file dari Cloudinary. Dipanggil saat admin ganti/hapus gambar
 * supaya tidak ada orphan file menumpuk.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

/**
 * Ekstrak public_id Cloudinary dari URL hasil upload.
 *
 * URL pattern Cloudinary:
 *   https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{public_id}.{ext}
 *   https://res.cloudinary.com/{cloud}/image/upload/{folder}/{public_id}.{ext}
 *   https://res.cloudinary.com/{cloud}/image/upload/{transforms}/v{version}/{folder}/{public_id}.{ext}
 *
 * public_id MENCAKUP folder, contoh: "eduhub/soal-1234567890"
 *
 * Returns null jika URL bukan Cloudinary URL.
 */
export const extractCloudinaryPublicId = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("cloudinary.com")) return null;

    // Path: /{cloud}/image/upload/[transforms/]v{version}/{folder}/{public_id}.{ext}
    // atau: /{cloud}/image/upload/{folder}/{public_id}.{ext}
    const parts = u.pathname.split("/").filter(Boolean);
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return null;

    // Skip segments setelah "upload" yang merupakan transformasi atau version.
    let i = uploadIdx + 1;
    while (i < parts.length) {
      const seg = parts[i];
      // version: v1234567890
      if (/^v\d+$/.test(seg)) {
        i++;
        break;
      }
      // transformasi (mengandung _ atau koma)
      if (/^[a-z]_/.test(seg) || seg.includes(",")) {
        i++;
        continue;
      }
      // bukan version/transform → ini bagian dari public_id
      break;
    }

    const remainingParts = parts.slice(i);
    if (remainingParts.length === 0) return null;

    // Gabungkan + buang ekstensi dari segment terakhir.
    const last = remainingParts[remainingParts.length - 1];
    const lastNoExt = last.replace(/\.[a-z0-9]+$/i, "");
    remainingParts[remainingParts.length - 1] = lastNoExt;

    return remainingParts.join("/");
  } catch {
    return null;
  }
};
