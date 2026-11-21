import * as cheerio from "cheerio";

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    
    if (!response.ok) throw new Error("ویب سائٹ لوڈ نہیں ہو سکی");
    
    const html = await response.text();
    const $ = cheerio.load(html);

    // غیر ضروری ٹیگز ہٹا دیں
    $("script, style, noscript, iframe, img, svg").remove();

    // صرف اہم ٹیگز سے متن نکالیں
    const text = $("h1, h2, h3, p, li, a").map((_, el) => $(el).text().trim()).get().join("\n");

    // بہت زیادہ لمبا متن نہ لیں
    return text.slice(0, 5000); 
  } catch (error) {
    console.error("Website scrape error:", error);
    return "ویب سائٹ کا ڈیٹا حاصل نہیں ہو سکا۔";
  }
}