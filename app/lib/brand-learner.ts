import dbConnect from "@/app/lib/dbConnect";
import SocialConnection from "@/models/SocialConnection";
import BrandProfile from "@/models/BrandProfile";
import { decryptToken } from "@/app/lib/social-crypto";
import { readCodebaseContext } from "./codebase-reader";
import { scrapeWebsite } from "./website-scraper";

// ✅ Timeout کے ساتھ سادہ fetch (اب کسی پروکسی کی ضرورت نہیں)
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function learnBrandEverything(brandName: string, websiteUrl: string) {
  await dbConnect();

  // ─── 1. Facebook ───
  let pastPosts = "";
  let facebookOk = false;
  try {
    const connection = await SocialConnection.findOne({ platform: "facebook", status: "connected" });
    if (connection) {
      const accessToken = decryptToken(connection.accessToken);
      const fbRes = await fetchWithTimeout(
        `https://graph.facebook.com/v20.0/${connection.accountId}/posts?fields=message&limit=10&access_token=${accessToken}`,
        {},
        30_000,
      );
      const fbData = await fbRes.json();
      if (fbData.data?.length) {
        pastPosts = fbData.data.map((p: any) => p.message).filter(Boolean).join("\n---\n");
        facebookOk = true;
      }
    }
  } catch (fbErr) {
    console.warn("⚠️ Facebook fetch ناکام (نظر انداز):", fbErr instanceof Error ? fbErr.message : fbErr);
  }

  // ─── 2. ویب سائٹ ───
  let websiteText = "";
  let websiteOk = false;
  try {
    websiteText = await scrapeWebsite(websiteUrl);
    websiteOk = !!websiteText && websiteText.length > 50;
  } catch (webErr) {
    console.warn("⚠️ ویب سائٹ scrape ناکام (نظر انداز):", webErr);
  }

  // ─── 3. کوڈ بیس ───
  let codeContext = "";
  let codebaseOk = false;
  try {
    codeContext = await readCodebaseContext();
    codebaseOk = !!codeContext && codeContext.length > 100;
  } catch (codeErr) {
    console.warn("⚠️ کوڈ بیس read ناکام (نظر انداز):", codeErr);
  }

  if (!facebookOk && !websiteOk && !codebaseOk) {
    throw new Error("کوئی بھی ڈیٹا سورس دستیاب نہیں ہو سکا — نیٹ ورک یا Facebook کنکشن چیک کریں۔");
  }

  // ─── 4. Groq کی کلید ───
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error("GROQ_API_KEY ماحول میں موجود نہیں ہے۔ console.groq.com سے مفت کلید حاصل کریں۔");
  }

  // ─── 5. پرامپٹ ───
  const prompt = `
    آپ ایک ماہر مارکیٹنگ ایجنٹ ہیں۔ میں آپ کو مختلف ذرائع سے معلومات دے رہا ہوں:

    (A) فیس بک کی پرانی پوسٹس:
    "${pastPosts || "دستیاب نہیں"}"

    (B) ویب سائٹ کا متن:
    "${websiteText || "دستیاب نہیں"}"

    (C) کوڈ بیس (ایپ فیچرز):
    "${codeContext.substring(0, 12000) || "دستیاب نہیں"}"

    ان معلومات کی بنیاد پر ایک مکمل برانڈ پروفائل بنائیں۔ 
    آپ کو لازمی طور پر صرف ایک درست JSON آبجیکٹ واپس کرنا ہے (کوئی اضافی متن نہیں)، جس کا فارمیٹ یہ ہوگا:
    {
      "brandName": "برانڈ کا نام",
      "tone": "لہجہ (جیسے دوستانہ، سنجیدہ، پرجوش)",
      "targetAudience": "ہدف کون ہے؟",
      "valueProposition": "بنیادی وعدہ ایک جملے میں",
      "contentPillars": ["موضوع 1", "موضوع 2", "موضوع 3", "موضوع 4", "موضوع 5"]
    }
  `;

  // ─── 6. Groq API کال (ری ٹرائی کے ساتھ) ───
  let responseText = "";
  let lastError: any = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Groq API کال (کوشش: ${attempt})...`);
      
      const res = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b", // ✅ نیا اور دستیاب ماڈل
            messages: [
              {
                role: "system",
                content: "آپ ایک ماہر مارکیٹنگ ایجنٹ ہیں جو صرف درست JSON میں جواب دیتے ہیں۔"
              },
              { 
                role: "user", 
                content: prompt 
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000,
          }),
        },
        45_000 // 45 سیکنڈ ٹائم آؤٹ
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody.substring(0, 200)}`);
      }

      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || "";
      
      if (!responseText) throw new Error("Groq نے خالی جواب دیا۔");
      
      console.log("✅ Groq سے برانڈ کا ڈیٹا موصول ہو گیا!");
      break; // کامیابی پر لوپ سے باہر نکلیں
      
    } catch (err: any) {
      lastError = err;
      console.warn(`⚠️ کوشش ${attempt} ناکام: ${err.message}`);
      
      if (attempt < 3) {
        // دوبارہ کوشش سے پہلے 2 سیکنڈ انتظار کریں
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  if (!responseText) {
    throw new Error(`Groq API ناکام: ${lastError?.message || "نیٹ ورک کا مسئلہ ہے"}`);
  }

  // ─── 7. پارس اور محفوظ ───
  const analysis = JSON.parse(responseText);

  await BrandProfile.findOneAndUpdate(
    { brandName: analysis.brandName },
    {
      brandName: analysis.brandName,
      tone: analysis.tone,
      targetAudience: analysis.targetAudience,
      valueProposition: analysis.valueProposition,
      contentPillars: analysis.contentPillars,
      lastLearnedAt: new Date(),
    },
    { 
      upsert: true, 
      returnDocument: "after" // وارننگ سے بچنے کے لیے نیا طریقہ
    }
  );

  return {
    ...analysis,
    _sources: { facebook: facebookOk, website: websiteOk, codebase: codebaseOk },
  };
}