import { v2 as cloudinary } from "cloudinary";

/* ============================================================
   Cloudinary Configuration
   ============================================================ */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/* ============================================================
   Types
   ============================================================ */

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
  resourceType: "image" | "video" | "raw";
}

export interface UploadedImageResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
}

/* ============================================================
   Helper 1 — Generic buffer upload
   ============================================================ */

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "image" | "video" | "raw";
    transformation?: any[];
    publicId?: string;
  } = {}
): Promise<UploadResult> {
  const {
    folder = "uploads",
    resourceType = "image",
    transformation,
    publicId,
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
    };

    if (transformation) uploadOptions.transformation = transformation;
    if (publicId) uploadOptions.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          resourceType: result.resource_type as "image" | "video" | "raw",
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/* ============================================================
   Helper 2 — Buffer upload (AI Design routes کے لیے)
   ============================================================ */

export async function uploadImageBuffer(
  buffer: Buffer,
  options: { folder?: string } = {}
): Promise<UploadedImageResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "uploads",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed."));
        }
        resolve(result as UploadedImageResult);
      }
    );

    uploadStream.end(buffer);
  });
}

/* ============================================================
   Helper 3 — Cloudinary delete
   ============================================================ */

export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}