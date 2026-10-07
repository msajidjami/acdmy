import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "@/app/lib/dbConnect";
import AIDesignReference from "@/models/AIDesignReference";
import { getSessionFromRequest } from "@/app/lib/aiDesignAuth";

import {
  buildAdvertisementPrompt,
  chooseReferenceKeywords,
} from "@/app/lib/aiDesignEngine";

/* ============================================================
   RUNTIME
============================================================ */

export const runtime = "nodejs";
export const maxDuration = 120;

/* ============================================================
   TYPES
============================================================ */

type AspectRatio =
  | "1:1"
  | "1:4"
  | "1:8"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:1"
  | "4:3"
  | "4:5"
  | "5:4"
  | "8:1"
  | "9:16"
  | "16:9"
  | "21:9";

type ImageSize = "512" | "1K" | "2K" | "4K";

/* ============================================================
   VALID OPTIONS
============================================================ */

const VALID_ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "1:4",
  "1:8",
  "2:3",
  "3:2",
  "3:4",
  "4:1",
  "4:3",
  "4:5",
  "5:4",
  "8:1",
  "9:16",
  "16:9",
  "21:9",
];

const VALID_IMAGE_SIZES: ImageSize[] = ["512", "1K", "2K", "4K"];

/* ============================================================
   🎨 POLLINATIONS.AI — DIMENSIONS MAP
   aspectRatio → [width, height]
============================================================ */

const ASPECT_DIMENSIONS: Record<AspectRatio, [number, number]> = {
  "1:1": [1024, 1024],
  "1:4": [512, 2048],
  "1:8": [384, 3072],
  "2:3": [832, 1248],
  "3:2": [1248, 832],
  "3:4": [896, 1152],
  "4:1": [2048, 512],
  "4:3": [1152, 896],
  "4:5": [896, 1120],
  "5:4": [1120, 896],
  "8:1": [3072, 384],
  "9:16": [768, 1344],
  "16:9": [1344, 768],
  "21:9": [1536, 640],
};

/* ============================================================
   🖼️ IMAGE SIZE MULTIPLIER
   (imageSize کے مطابق dimensions بڑھائیں)
============================================================ */

function applyImageSize(
  dims: [number, number],
  size: ImageSize
): [number, number] {
  const factor: Record<ImageSize, number> = {
    "512": 0.5,
    "1K": 1.0,
    "2K": 1.5,
    "4K": 2.0,
  };

  const f = factor[size];

  // زیادہ سے زیادہ 2048 تک (Pollinations کی حد)
  return [
    Math.min(Math.round(dims[0] * f), 2048),
    Math.min(Math.round(dims[1] * f), 2048),
  ];
}

/* ============================================================
   CLOUDINARY
============================================================ */

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary environment variables are not configured."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

/* ============================================================
   UPLOAD BUFFER TO CLOUDINARY
============================================================ */

function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    try {
      const client = getCloudinaryConfig();

      const uploadStream = client.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result?.secure_url || !result?.public_id) {
            reject(
              new Error(
                "Cloudinary did not return a valid uploaded image."
              )
            );
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    } catch (error) {
      reject(error);
    }
  });
}

/* ============================================================
   NORMALIZE ASPECT RATIO
============================================================ */

function normalizeAspectRatio(value: unknown): AspectRatio {
  const ratio = String(value || "3:4").trim();

  if (VALID_ASPECT_RATIOS.includes(ratio as AspectRatio)) {
    return ratio as AspectRatio;
  }

  return "3:4";
}

/* ============================================================
   NORMALIZE IMAGE SIZE
============================================================ */

function normalizeImageSize(value: unknown): ImageSize {
  const size = String(value || "1K").trim();

  if (VALID_IMAGE_SIZES.includes(size as ImageSize)) {
    return size as ImageSize;
  }

  return "1K";
}

/* ============================================================
   FETCH REFERENCE IMAGE
   (Cloudinary سے تصویر لا کر base64 میں بدلیں)
============================================================ */

async function fetchReference(
  url: string
): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Reference image could not be fetched: ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "image/png";

  const mimeType = contentType
    .split(";")[0]
    .trim()
    .toLowerCase();

  const allowedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ];

  const finalMimeType = allowedMimeTypes.includes(mimeType)
    ? mimeType
    : "image/png";

  const buffer = Buffer.from(await response.arrayBuffer());

  // Reference image maximum size: 7 MB
  if (buffer.length > 7 * 1024 * 1024) {
    throw new Error("Reference image is too large.");
  }

  return {
    data: buffer.toString("base64"),
    mimeType: finalMimeType,
  };
}

/* ============================================================
   🚀 GENERATE IMAGE — Pollinations.ai (مفت، بغیر API key)
============================================================ */

interface GenerateSuccess {
  base64: string;
  mimeType: string;
  modelUsed: string;
}

async function generateImagePollinations(
  fullPrompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize
): Promise<GenerateSuccess> {
  // Dimensions نکالیں اور image size لاگو کریں
  const baseDims = ASPECT_DIMENSIONS[aspectRatio];
  const [width, height] = applyImageSize(baseDims, imageSize);

  // Prompt کو URL-safe بنائیں
  const encoded = encodeURIComponent(fullPrompt.slice(0, 1800));

  // ہر بار نیا seed → مختلف نتیجہ
  const seed = Math.floor(Math.random() * 1_000_000);

  // Pollinations URL (flux ماڈل — بہترین مفت آپشن)
  const url =
    `https://image.pollinations.ai/prompt/${encoded}` +
    `?width=${width}&height=${height}` +
    `&seed=${seed}&model=flux&nologo=true&enhance=true`;

  console.log(
    `🎨 Pollinations → ${width}x${height} | seed=${seed} | prompt chars=${fullPrompt.length}`
  );

  const response = await fetch(url, {
    signal: AbortSignal.timeout(110000), // 110 سیکنڈ
  });

  if (!response.ok) {
    throw new Error(
      `Pollinations.ai failed with status ${response.status}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length === 0) {
    throw new Error("Pollinations.ai returned empty image data.");
  }

  if (buffer.length < 1000) {
    throw new Error(
      "Pollinations.ai returned an invalid/too-small image."
    );
  }

  console.log(
    `✅ Pollinations → image received (${(buffer.length / 1024).toFixed(1)} KB)`
  );

  const mimeType =
    response.headers.get("content-type")?.split(";")[0] ||
    "image/jpeg";

  return {
    base64: buffer.toString("base64"),
    mimeType,
    modelUsed: "pollinations-flux",
  };
}

/* ============================================================
   POST HANDLER
============================================================ */

export async function POST(request: NextRequest) {
  /* ==========================================================
     AUTHENTICATION
  ========================================================== */

  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Please login first." },
      { status: 401 }
    );
  }

  try {
    /* ========================================================
       REQUEST BODY
    ======================================================== */

    const body = await request.json();

    const prompt = String(body?.prompt || "").trim();

    const referenceIds = Array.isArray(body?.referenceIds)
      ? body.referenceIds
          .map((id: unknown) => String(id))
          .filter(Boolean)
          .slice(0, 4)
      : [];

    const aspectRatio = normalizeAspectRatio(body?.aspectRatio);
    const imageSize = normalizeImageSize(body?.imageSize);

    /* ========================================================
       VALIDATE PROMPT
    ======================================================== */

    if (!prompt || prompt.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Please describe the advertisement.",
        },
        { status: 400 }
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Prompt is too long. Maximum 5000 characters.",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectDB();

    /* ========================================================
       FIND REFERENCES
    ======================================================== */

    let references: any[] = [];

    if (referenceIds.length > 0) {
      references = await AIDesignReference.find({
        _id: { $in: referenceIds },
        isActive: true,
      })
        .limit(4)
        .lean();
    } else {
      const keywords = chooseReferenceKeywords(prompt);

      references = await AIDesignReference.find({
        isActive: true,
        assetType: { $in: keywords },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
    }

    /* ========================================================
       BUILD PROMPT
    ======================================================== */

    const fullPrompt = buildAdvertisementPrompt(
      prompt,
      references,
      { aspectRatio, imageSize }
    );

    /* ========================================================
       🚀 GENERATE IMAGE — Pollinations.ai
    ======================================================== */

    const generated = await generateImagePollinations(
      fullPrompt,
      aspectRatio,
      imageSize
    );

    /* ========================================================
       BASE64 → BUFFER
    ======================================================== */

    const generatedBuffer = Buffer.from(
      generated.base64,
      "base64"
    );

    if (generatedBuffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Generated image data was empty.",
        },
        { status: 502 }
      );
    }

    /* ========================================================
       CLOUDINARY UPLOAD
    ======================================================== */

    const uploaded = await uploadBufferToCloudinary(
      generatedBuffer,
      "ilmora786/ai-generated-posters"
    );

    /* ========================================================
       SUCCESS
    ======================================================== */

    return NextResponse.json({
      success: true,

      imageUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
      mimeType: generated.mimeType,

      aspectRatio,
      imageSize,

      model: generated.modelUsed,

      referencesUsed: references.map((item) => ({
        id: String(item._id),
        title: item.title,
        assetType: item.assetType,
      })),
    });
  } catch (error: any) {
    /* ========================================================
       ERROR HANDLING
    ======================================================== */

    console.error("AI Studio generation error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Advertisement generation failed.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}