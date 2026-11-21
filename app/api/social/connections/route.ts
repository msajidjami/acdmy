import dbConnect from "@/app/lib/dbConnect";
import SocialConnection from "@/models/SocialConnection";
import { isSocialAuthenticated } from "@/app/lib/social-auth";

export async function GET(request: Request) {
  if (!isSocialAuthenticated(request)) return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });

  try {
    await dbConnect();
    const rows = await SocialConnection.find({}, "platform accountId accountName status tokenExpiresAt").lean();
    return Response.json({ connections: rows });
  } catch (error) {
    return Response.json({ error: "لوڈ نہیں ہو سکے۔" }, { status: 500 });
  }
}