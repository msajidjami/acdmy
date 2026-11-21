import dbConnect from "@/app/lib/dbConnect";
import SocialPost from "@/models/SocialPost";
import SocialConnection from "@/models/SocialConnection";
import SocialActivity from "@/models/SocialActivity";
import { decryptToken } from "@/app/lib/social-crypto";

export async function publishPostToFacebook(postId: string) {
  await dbConnect();
  
  // 1. پوسٹ تلاش کریں
  const post = await SocialPost.findById(postId);
  if (!post) throw new Error("پوسٹ نہیں ملی");

  // 2. فیس بک اکاؤنٹ اور ٹوکن تلاش کریں
  const connection = await SocialConnection.findOne({ platform: post.platform, status: "connected" });
  if (!connection) throw new Error("فیس بک اکاؤنٹ منسلک نہیں ہے۔ پہلے کنکشن مکمل کریں۔");

  // 3. ٹوکن ڈکرپٹ کریں
  const accessToken = decryptToken(connection.accessToken);
  
  // 4. کیپشن اور ہیش ٹیگز کو ملا کر فائنل میسج بنائیں
  const message = `${post.caption}${post.hashtags?.length ? "\n\n" + post.hashtags.join(" ") : ""}`;

  // 5. فیس بک API پر بھیجیں
  const res = await fetch(`https://graph.facebook.com/v20.0/${connection.accountId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });

  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || "فیس بک پر پوسٹ نہیں ہو سکی۔");
  }

  // 6. کامیابی پر ڈیٹا بیس اپڈیٹ کریں
  post.status = "published";
  post.publishedAt = new Date();
  await post.save();

  // 7. ایکٹیویٹی لاگ میں درج کریں
  await SocialActivity.create({
    postId: post._id,
    action: "published",
    message: `آٹو میٹک پوسٹ فیس بک پر شائع ہوگئی (ID: ${data.id})`,
  });

  return data.id; // فیس بک کی طرف سے دی گئی پوسٹ آئی ڈی واپس کریں
}