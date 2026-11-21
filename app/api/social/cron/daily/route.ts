import { generateSocialDraft } from "@/app/lib/social-agent";
import { publishPostToFacebook } from "@/app/lib/auto-publisher";
import dbConnect from "@/app/lib/dbConnect";
import SocialPost from "@/models/SocialPost";
import BrandProfile from "@/models/BrandProfile";
import SocialActivity from "@/models/SocialActivity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // سیکیورٹی چیک
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // ✅ حل: اب ہم مخصوص نام کے بجائے، سب سے حال ہی میں سیکھا گیا برانڈ اٹھائیں گے
    const brand = await BrandProfile.findOne().sort({ lastLearnedAt: -1 });
    
    if (!brand) {
      throw new Error("برانڈ پروفائل نہیں ملا۔ پہلے ڈیش بورڈ سے 'برانڈ سیکھیں' کا بٹن دبائیں۔");
    }

    // 2. موضوع منتخب کریں
    const randomTopic = brand.contentPillars[
      Math.floor(Math.random() * brand.contentPillars.length)
    ];

    // 3. AI سے پوسٹ بنوائیں (برانڈ کا سیاق و سباق پاس کریں)
    const generated = await generateSocialDraft({
      topic: randomTopic,
      platform: "facebook",
      language: "ur",
      goal: "awareness",
      tone: brand.tone as any,
      callToAction: "مزید جاننے کے لیے ہماری ویب سائٹ دیکھیں",
      brandContext: `آپ ${brand.brandName} کے لیے لکھ رہے ہیں۔ آپ کا بنیادی وعدہ (Value Proposition) یہ ہے: ${brand.valueProposition}۔ آپ کا ہدف (Audience) یہ ہے: ${brand.targetAudience}۔`,
    });

    // 4. پوسٹ کو ڈیٹا بیس میں محفوظ کریں (سٹیٹس: approved)
    const newPost = await SocialPost.create({
      title: generated.content.title,
      topic: randomTopic,
      platform: "facebook",
      language: "ur",
      goal: "awareness",
      tone: brand.tone,
      caption: generated.content.caption,
      hashtags: generated.content.hashtags,
      callToAction: generated.content.callToAction,
      visualDirection: generated.content.visualDirection,
      status: "approved",
      aiMode: generated.mode,
    });

    // 5. فیس بک پر شائع کریں
    const externalId = await publishPostToFacebook(newPost._id.toString());

    // 6. ایکٹیویٹی لاگ
    await SocialActivity.create({
      postId: newPost._id,
      action: "published",
      message: `آٹو میٹک پوسٹ فیس بک پر شائع ہوگئی (ID: ${externalId})`,
    });

    return Response.json({ 
      success: true, 
      message: "آج کی خودکار پوسٹ بن گئی اور فیس بک پر شائع ہو گئی!",
      topic: randomTopic,
      fbPostId: externalId
    });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}