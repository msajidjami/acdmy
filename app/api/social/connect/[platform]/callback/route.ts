import { cookies } from "next/headers";
import dbConnect from "@/app/lib/dbConnect";
import SocialConnection from "@/models/SocialConnection"; // ✅ Mongoose Model
import { encryptToken } from "@/app/lib/social-crypto";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ platform: string }> },
) {
  const { platform } = await ctx.params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error_description");

  const jar = await cookies();
  const cookieName = `oauth_state_${platform}`;
  const storedState = jar.get(cookieName)?.value;
  jar.delete(cookieName);

  const fail = (msg: string) =>
    Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/ai-social-team?connect=error&reason=${encodeURIComponent(msg)}`);

  if (errorParam) return fail(errorParam);
  if (!code) return fail("code_missing");
  if (!state || state !== storedState) return fail("state_mismatch");

  try {
    // ─── 1. code → short-lived token ───
    const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_APP_URL}/api/social/connect/${platform}/callback`);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl);
    const tokenJson = await tokenRes.json() as { access_token?: string; error?: { message: string } };
    if (!tokenRes.ok || !tokenJson.access_token) {
      return fail(tokenJson.error?.message ?? "token_exchange_failed");
    }

    // ─── 2. short → long-lived token (60 days) ───
    const longUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    longUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    longUrl.searchParams.set("fb_exchange_token", tokenJson.access_token);

    const longRes = await fetch(longUrl);
    const longJson = await longRes.json() as { access_token: string; expires_in?: number };
    const userToken = longJson.access_token ?? tokenJson.access_token;

    // ─── 3. صارف کے Pages کی فہرست لائیں ───
    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${userToken}&fields=id,name,access_token`,
    );
    const pagesJson = await pagesRes.json() as {
      data?: { id: string; name: string; access_token: string }[];
      error?: { message: string };
    };
    if (!pagesRes.ok || !pagesJson.data?.length) {
      return fail("کوئی Facebook Page نہیں ملی — پہلے Page بنائیں۔");
    }

    // ─── 4. Mongoose کے ذریعے ڈیٹا بیس میں محفوظ کریں ───
    await dbConnect();

    const expiresAt = longJson.expires_in
      ? new Date(Date.now() + longJson.expires_in * 1000)
      : null;

    for (const page of pagesJson.data) {
      // findOneAndUpdate کے ساتھ upsert: true استعمال کریں تاکہ نیا بنے یا پرانا اپڈیٹ ہو
      await SocialConnection.findOneAndUpdate(
        { platform, accountId: page.id }, // کنڈیشن (کہاں ڈھونڈنا ہے)
        {
          platform,
          accountId: page.id,
          accountName: page.name,
          accessToken: encryptToken(page.access_token),
          refreshToken: null,
          tokenExpiresAt: expiresAt,
          scopes: ["pages_manage_posts", "pages_show_list"],
          status: "connected",
        }, // نئی ویلیوز
        { upsert: true, new: true } // اپشنز (اگر نہ ملے تو نیا بنائیں)
      );
    }

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/ai-social-team?connect=success&platform=${platform}`,
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return fail("سرور میں خرابی — دوبارہ کوشش کریں۔");
  }
}