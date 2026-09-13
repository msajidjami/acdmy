import { v2 as cloudinary } from 'cloudinary';

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
   Helper — Buffer سے Cloudinary پر upload
   ============================================================ */

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
  resourceType: 'image' | 'video' | 'raw';
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw';
    transformation?: any[];
    publicId?: string;
  } = {}
): Promise<UploadResult> {
  const {
    folder = 'uploads',
    resourceType = 'image',
    transformation,
    publicId,
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
    };

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          resourceType: result.resource_type as
            | 'image'
            | 'video'
            | 'raw',
        });
      }
    );

    uploadStream.end(buffer);
  });
}