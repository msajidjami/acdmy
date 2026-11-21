import { z } from "zod";
import {
  clearSocialSessionCookie,
  createSocialSessionCookie,
  socialAuthStatus,
  verifySocialPassword,
} from "@/app/lib/social-auth";

const loginSchema = z.object({ password: z.string().min(1).max(500) });
const attempts = new Map<string, { count: number; resetAt: number }>();

// اس endpoint کے ذریعے UI جانتی ہے کہ owner login ضروری ہے یا preview mode چل رہا ہے۔
export async function GET(request: Request) {
  return Response.json(socialAuthStatus(request), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);
  if (current && current.resetAt > now && current.count >= 8) {
    return Response.json(
      { error: "بہت زیادہ کوششیں ہو گئیں؛ چند منٹ بعد دوبارہ کوشش کریں۔" },
      { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "درخواست درست نہیں۔" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "پاس ورڈ درج کریں۔" }, { status: 400 });
  }

  if (!verifySocialPassword(parsed.data.password)) {
    const resetAt = current && current.resetAt > now ? current.resetAt : now + 15 * 60 * 1000;
    const count = current && current.resetAt > now ? current.count + 1 : 1;
    attempts.set(ip, { count, resetAt });
    return Response.json(
      { error: "پاس ورڈ درست نہیں۔" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  attempts.delete(ip);
  return Response.json(
    { authenticated: true, protected: true, previewMode: false },
    {
      headers: {
        "Set-Cookie": createSocialSessionCookie(),
        "Cache-Control": "no-store",
      },
    },
  );
}

// لاگ آؤٹ پر browser کا owner session فوراً ختم کریں۔
export async function DELETE() {
  return Response.json(
    { authenticated: false },
    { headers: { "Set-Cookie": clearSocialSessionCookie(), "Cache-Control": "no-store" } },
  );
}
