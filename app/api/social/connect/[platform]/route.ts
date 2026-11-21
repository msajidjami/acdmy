import { isSocialAuthenticated } from "@/app/lib/social-auth";
import { randomBytes } from "crypto";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ platform: string }> },
) {
  if (!isSocialAuthenticated(request)) {
    return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });
  }

  const { platform } = await ctx.params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const providers: Record<string, { authUrl: string; clientId: string; scope: string }> = {
    facebook: {
      authUrl: "https://www.facebook.com/v20.0/dialog/oauth",
      clientId: process.env.META_APP_ID!,
      scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
    },
    instagram: {
      authUrl: "https://www.facebook.com/v20.0/dialog/oauth",
      clientId: process.env.META_APP_ID!,
      scope: "instagram_basic,instagram_content_publish,pages_show_list",
    },
    // youtube, tiktok, linkedin بعد میں شامل کریں
  };

  const provider = providers[platform];
  if (!provider) {
    return Response.json({ error: "یہ پلیٹ فارم ابھی دستیاب نہیں۔" }, { status: 404 });
  }

  // CSRF protection: state کو HttpOnly cookie میں رکھیں
  const state = randomBytes(24).toString("hex");
  const cookie = [
    `oauth_state_${platform}=${state}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=600",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ].filter(Boolean).join("; ");

  const redirect = new URL(provider.authUrl);
  redirect.searchParams.set("client_id", provider.clientId);
  redirect.searchParams.set("redirect_uri", `${appUrl}/api/social/connect/${platform}/callback`);
  redirect.searchParams.set("state", state);
  redirect.searchParams.set("scope", provider.scope);
  redirect.searchParams.set("response_type", "code");

  return new Response(null, {
    status: 302,
    headers: { Location: redirect.toString(), "Set-Cookie": cookie },
  });
}