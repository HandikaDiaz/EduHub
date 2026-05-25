import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  uploadImageToCloudinary,
  deleteFromCloudinary,
  extractCloudinaryPublicId,
} from "@/lib/cloudinary";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Image upload limit — 8 MB raw input. Setelah convert ke WebP biasanya turun
// drastis. Cukup untuk foto 4K dari kamera HP.
const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export async function POST(request: NextRequest) {
  try {
    // ---- 1. Auth: harus login + role admin ----
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await convex.query(api.users.getUserByClerkId, { clerkId });
    if (!user || user.isDeleted) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat upload gambar" },
        { status: 403 },
      );
    }

    // ---- 2. Parse multipart form ----
    const formData = await request.formData();
    const file = formData.get("file");
    const replaceUrl = formData.get("replaceUrl");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Field 'file' wajib dan harus berupa file" },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Ukuran file melebihi batas ${MAX_BYTES / 1024 / 1024}MB` },
        { status: 413 },
      );
    }

    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${file.type}` },
        { status: 415 },
      );
    }

    // ---- 3. Convert (sharp WebP) + upload via Cloudinary ----
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageToCloudinary({
      buffer,
      filenameHint: file.name,
    });

    // ---- 4. Replace flow: hapus gambar lama jika diberi replaceUrl ----
    if (typeof replaceUrl === "string" && replaceUrl.length > 0) {
      const oldPublicId = extractCloudinaryPublicId(replaceUrl);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (err) {
          // Non-fatal — yang penting upload baru sudah sukses.
          console.warn("Failed to delete old Cloudinary file:", err);
          Sentry.captureException(err, {
            tags: { route: "admin/upload-image", phase: "cleanup" },
            extra: { oldPublicId },
          });
        }
      }
    }

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      sizeBytes: result.sizeBytes,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    Sentry.captureException(error, {
      tags: { route: "admin/upload-image" },
    });
    const msg = error instanceof Error ? error.message : "Upload gagal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Disable Next.js default body parser — gunakan FormData native dari request.
export const runtime = "nodejs";
export const maxDuration = 30;
