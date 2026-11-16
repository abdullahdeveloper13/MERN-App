import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { slugify } from "../utils/slug.js";

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

function assertConfigured(): void {
  if (!isConfigured) {
    throw new AppError(503, "File storage is not configured.");
  }
}

export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}

function uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(new AppError(502, "File upload failed. Please try again."));
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

export async function uploadImage(
  buffer: Buffer,
  folder: "avatars" | "company-logos"
): Promise<{ url: string; publicId: string }> {
  const result = await uploadBuffer(buffer, {
    folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
    resource_type: "image",
    transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }]
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function uploadPrivateDocument(
  buffer: Buffer,
  folder: "resumes" | "attachments",
  originalName: string
): Promise<{ publicId: string; fileName: string }> {
  const extensionMatch = /(\.[a-z0-9]+)$/i.exec(originalName);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? ".pdf";
  const baseName = slugify(originalName.replace(/\.[^.]+$/, "")) || "document";
  const publicId = `${Date.now()}-${baseName}${extension}`;

  const result = await uploadBuffer(buffer, {
    folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
    resource_type: "raw",
    type: "authenticated",
    public_id: publicId
  });

  return { publicId: result.public_id, fileName: originalName };
}

export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "raw" = "image",
  type: "upload" | "authenticated" = "upload"
): Promise<void> {
  if (!isConfigured) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type, invalidate: true });
  } catch {
    // Deleting a missing asset must not fail the surrounding operation.
  }
}

export function getPrivateDocumentUrl(publicId: string): string {
  assertConfigured();

  const dotIndex = publicId.lastIndexOf(".");
  const format = dotIndex > -1 ? publicId.slice(dotIndex + 1).toLowerCase() : "pdf";

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: "raw",
    type: "authenticated"
  });
}
