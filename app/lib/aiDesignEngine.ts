export type DesignReferenceForAI = {
  title: string;
  assetType: string;
  imageUrl: string;
  tags: string[];
  styleDescription?: string;
  aiInstructions?: string;
};

const STYLE_RULES = `
You are ILMORA786's Islamic Advertisement Design Director.

Your job is to create a premium Islamic advertisement composition from the user's brief.

IMPORTANT:
- Treat supplied reference images as visual/style references, not as content to copy blindly.
- Preserve the user's exact names, dates, locations, phone numbers and other supplied facts.
- Do not invent event details.
- Do not invent Quran verses, Hadith, Arabic quotations, scholars' names or religious claims.
- Never replace exact user text with made-up text.
- Prefer elegant Pakistani/Indian Islamic poster aesthetics.
- Use strong visual hierarchy, ornamental Islamic borders, balanced negative space,
  tasteful gold/green/red/cream/black palettes where appropriate, and professional typography.
- If Urdu is requested, use a refined Nastaliq-inspired typographic treatment.
- Avoid generic Western corporate poster layouts unless the user asks for them.
- The result should look intentionally designed by a professional Islamic graphic designer.
- Keep important text away from edges and leave safe margins for printing.
- Do not put watermarks on the design unless the user asks.
`;

function clean(text: string, max = 6000) {
  return text.trim().slice(0, max);
}

export function buildAdvertisementPrompt(
  userPrompt: string,
  references: DesignReferenceForAI[],
  options?: {
    aspectRatio?: string;
    imageSize?: string;
  }
) {
  const refs = references
    .map(
      (ref, index) => `
REFERENCE ${index + 1}
Title: ${ref.title}
Type: ${ref.assetType}
Tags: ${ref.tags.join(", ")}
Style notes: ${ref.styleDescription || "Not specified"}
AI instructions: ${ref.aiInstructions || "Use this reference for visual guidance only."}
`
    )
    .join("\n");

  return `${STYLE_RULES}

USER DESIGN BRIEF:
${clean(userPrompt)}

OUTPUT:
Create one finished high-quality Islamic advertisement image.

CANVAS:
Aspect ratio: ${options?.aspectRatio || "3:4"}
Target quality: ${options?.imageSize || "2K"}

REFERENCE LIBRARY:
${refs || "No reference was selected. Use the ILMORA Islamic design direction above."}

LAYOUT REQUIREMENTS:
1. Establish a clear primary headline.
2. Create secondary information blocks according to the brief.
3. Use a coherent ornamental frame/background.
4. Maintain readable spacing and visual hierarchy.
5. Use the supplied references as style/composition guidance.
6. Do not add information that is absent from the brief.
7. If the user supplied exact Urdu text, preserve it as faithfully as possible.
8. Produce a complete poster, not a rough concept or wireframe.
`;
}

export function chooseReferenceKeywords(userPrompt: string) {
  const text = userPrompt.toLowerCase();

  const keywords: string[] = [];

  const map: Record<string, string[]> = {
    calligraphy: ["خطاط", "خطاطی", "calligraphy", "نستعلیق", "عنوان"],
    poster: ["پوسٹر", "اشتہار", "poster", "advertisement", "جلسہ"],
    frame: ["فریم", "بارڈر", "border", "frame", "حاشیہ"],
    background: ["پس منظر", "background", "بیک گراؤنڈ"],
    ornament: ["نقش", "ornament", "اسلامی نقش", "decoration"],
    logo: ["لوگو", "logo", "برانڈ"],
    template: ["ٹیمپلیٹ", "template", "نمونہ"],
  };

  for (const [type, words] of Object.entries(map)) {
    if (words.some((word) => text.includes(word.toLowerCase()))) {
      keywords.push(type);
    }
  }

  if (!keywords.length) {
    keywords.push("poster", "calligraphy", "frame");
  }

  return keywords;
}
