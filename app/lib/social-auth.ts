import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "ilmora_social_session";
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function configuredPassword() {
  return process.env.ILMORA_SOCIAL_PASSWORD?.trim() || "";
}

function sign(payload: string, password: string) {
  return createHmac("sha256", password).update(payload).digest("base64url");
}

function safeStringEqual(received: string, expected: string) {
  // مختلف طوالت کے strings پر timingSafeEqual چلانے کے لیے دونوں کو hash کرتے ہیں۔
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

function cookieValue(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return pair?.slice(COOKIE_NAME.length + 1) ?? "";
}

// مقامی demo میں لاگ اِن کے بغیر صرف draft tools دستیاب ہیں؛ production میں پاس ورڈ رکھیں۔
export function isSocialAuthenticated(request: Request) {
  const password = configuredPassword();
  if (!password) return true;

  const token = cookieValue(request);
  const [expiryText, nonce, signature] = token.split(".");
  if (!expiryText || !nonce || !signature) return false;

  const expiry = Number(expiryText);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const payload = `${expiryText}.${nonce}`;
  return safeStringEqual(signature, sign(payload, password));
}

export function socialAuthStatus(request: Request) {
  const protectedDashboard = Boolean(configuredPassword());
  return {
    authenticated: isSocialAuthenticated(request),
    protected: protectedDashboard,
    previewMode: !protectedDashboard,
  };
}

export function createSocialSessionCookie() {
  const password = configuredPassword();
  if (!password) throw new Error("ILMORA_SOCIAL_PASSWORD is not configured");

  const expiry = Date.now() + SESSION_LIFETIME_MS;
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${expiry}.${nonce}`;
  const token = `${payload}.${sign(payload, password)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_LIFETIME_MS / 1000)}${secure}`;
}

export function clearSocialSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
}

export function verifySocialPassword(received: string) {
  const expected = configuredPassword();
  return Boolean(expected) && safeStringEqual(received, expected);
}
