import { learnBrandEverything } from "@/app/lib/brand-learner";
import { isSocialAuthenticated } from "@/app/lib/social-auth";

export async function POST(request: Request) {
  // 1. سیکیورٹی چیک
  if (!isSocialAuthenticated(request)) {
    return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });
  }

  try {
    // ✅ آپ کی ویب سائٹ کا اصل ڈومین
    const websiteUrl = "https://quranandislamic.com/";

    // فنکشن کو کال کریں
    const analysis = await learnBrandEverything("ILMORA Academy", websiteUrl);

    // ✅ ڈائنامک پیغام بنائیں کہ کون کون سے سورسز کامیاب رہے
    const sources = (analysis as any)._sources as {
      facebook: boolean;
      website: boolean;
      codebase: boolean;
    } | undefined;

    let sourceMsg = "آپ کا برانڈ";
    
    if (sources) {
      const successfulSources = [
        sources.facebook && "فیس بک",
        sources.website && "ویب سائٹ",
        sources.codebase && "کوڈ بیس",
      ].filter(Boolean);

      if (successfulSources.length > 0) {
        sourceMsg = successfulSources.join(" + ");
      }
    }

    // 2. کامیابی کا جواب
    return Response.json({
      success: true,
      message: `AI نے ${sourceMsg} سے آپ کا برانڈ کامیابی سے سیکھ لیا ہے!`,
      brandProfile: analysis,
      sources: sources,
    });

  } catch (error: any) {
    console.error("Brand learn error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "برانڈ سیکھنے کے دوران کوئی خرابی پیش آئی۔",
      },
      { status: 500 }
    );
  }
}