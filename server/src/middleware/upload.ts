import multer from "multer";
import { AppError } from "../utils/AppError.js";

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const documentMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function hasAllowedExtension(filename: string, allowed: string[]): boolean {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return allowed.includes(extension);
}

function createUploader(
  allowedMimeTypes: Set<string>,
  allowedExtensions: string[],
  maxSizeBytes: number
) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeBytes, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!allowedMimeTypes.has(file.mimetype) || !hasAllowedExtension(file.originalname, allowedExtensions)) {
        callback(new AppError(400, "Unsupported file type."));
        return;
      }

      callback(null, true);
    }
  });
}

const imageUploader = createUploader(imageMimeTypes, [".jpg", ".jpeg", ".png", ".webp"], 5 * 1024 * 1024);
const documentUploader = createUploader(documentMimeTypes, [".pdf", ".doc", ".docx"], 10 * 1024 * 1024);

export const uploadAvatar = imageUploader.single("avatar");
export const uploadLogo = imageUploader.single("logo");
export const uploadResume = documentUploader.single("resume");
export const uploadAttachment = documentUploader.single("attachment");
