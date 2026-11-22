
import crypto from "node:crypto";

const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const rawKey = process.env.SOCIAL_TOKEN_KEY?.trim();

  if (!rawKey) {
    throw new Error(
      "SOCIAL_TOKEN_KEY is missing. Add a 64-character hexadecimal key to environment variables."
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    throw new Error(
      "SOCIAL_TOKEN_KEY must be exactly 64 hexadecimal characters (32 bytes)."
    );
  }

  const key = Buffer.from(rawKey, "hex");

  if (key.length !== KEY_LENGTH) {
    throw new Error("Invalid SOCIAL_TOKEN_KEY length.");
  }

  return key;
}

export function encryptToken(plain: string): string {
  if (!plain) {
    throw new Error("Token cannot be empty.");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptToken(payload: string): string {
  if (!payload) {
    throw new Error("Encrypted token cannot be empty.");
  }

  const parts = payload.split(".");

  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error("Invalid encrypted token format.");
  }

  const [ivB64, tagB64, dataB64] = parts;

  const key = getEncryptionKey();

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");

  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error("Invalid encrypted token data.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}
