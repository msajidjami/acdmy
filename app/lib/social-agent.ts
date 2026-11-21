import {
  generatedContentSchema,
  type GeneratedContent,
  type SocialDraftInput,
  type SocialPlatform,
} from "@/app/lib/social-types"; // ✅ آپ کے پروجیکٹ کا درست پاتھ

// یہ ڈیفالٹ برانڈ کانٹیکسٹ ہے (اگر ڈیٹا بیس سے کچھ نہ ملے تو یہ استعمال ہوگا)
const DEFAULT_BRAND_CONTEXT = {
  brand: "ILMORA786",
  purpose: "تعلیم، سیکھنے اور تدریسی ترقی کے لیے مفید، باوقار مواد بنانا۔",
  audience: "طلبہ، والدین، اساتذہ اور اکیڈمی/تعلیمی اداروں کے منتظمین۔",
  voice: "واضح، بااعتماد، مددگار اور احترام پر مبنی؛ غیر مصدقہ کامیابی کے دعوے نہ کریں۔",
  guardrails: [
    "جھوٹی ضمانت، فرضی اعداد، جعلی testimonials یا غیر مصدقہ دینی دعوے شامل نہ کریں۔",
    "صارف کے دیے گئے موضوع سے باہر قیمت، کورس، نتیجہ یا رابطہ معلومات ایجاد نہ کریں۔",
  ],
};

// ✅ نیا: انپٹ ٹائپ میں brandContext شامل کریں
type ExtendedSocialDraftInput = SocialDraftInput & {
  brandContext?: string;
};

const PLATFORM_GUIDANCE: Record<SocialPlatform, string> = {
  facebook: "فیس بک کے لیے گفتگو شروع کرنے والا مختصر hook، واضح فائدہ اور ایک CTA لکھیں۔",
  instagram: "انسٹاگرام کے لیے پہلے جملے کو بصری hook بنائیں، مختصر پیراگراف اور قابلِ دریافت hashtags دیں۔",
  whatsapp: "واٹس ایپ کے لیے قدرتی، مختصر، ذاتی انداز کا پیغام لکھیں؛ گروپ میں خودکار ارسال نہ کریں۔",
  youtube: "یوٹیوب کے لیے عنوان اور مختصر description لکھیں؛ غیر متعلق hashtags سے گریز کریں۔",
  tiktok: "ٹک ٹاک کے لیے پہلے دو سیکنڈ کا hook اور مختصر ویڈیو/اسکرین direction دیں۔",
  linkedin: "لنکڈ اِن کے لیے پیشہ ورانہ insight، واضح نکتہ اور نرم CTA رکھیں۔",
};

const campaignGuidance = (goal: SocialDraftInput["goal"], platform: SocialPlatform) => {
  const goalNotes: Record<SocialDraftInput["goal"], string> = {
    enrollment: "اندراج کی دعوت نرم اور واضح ہو؛ کوئی فرضی داخلہ deadline نہ بنائیں۔",
    awareness: "برانڈ کا فائدہ ایک سادہ تعلیمی insight سے سمجھائیں۔",
    engagement: "ایک آسان، احترام والا سوال شامل کریں جس کا جواب دینا آسان ہو۔",
    traffic: "ویب سائٹ دیکھنے کی دعوت دیں؛ URL صرف تب لکھیں جب صارف نے دیا ہو۔",
    launch: "اعلان پُرجوش ہو مگر غیر فراہم کردہ launch date یا offer ایجاد نہ کریں۔",
  };

  return {
    platform,
    goal,
    platformAdvice: PLATFORM_GUIDANCE[platform],
    campaignAdvice: goalNotes[goal],
  };
};

const tools = [
  {
    type: "function",
    name: "get_ilmora_brand_context",
    description: "ILMORA786 کی تصدیق شدہ برانڈ معلومات اور حفاظتی اصول حاصل کریں۔",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    type: "function",
    name: "get_campaign_guidance",
    description: "منتخب پلیٹ فارم اور مہم کے مقصد کے مطابق تحریری رہنمائی لیں۔",
    parameters: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["facebook", "instagram", "whatsapp", "youtube", "tiktok", "linkedin"],
        },
        goal: {
          type: "string",
          enum: ["enrollment", "awareness", "engagement", "traffic", "launch"],
        },
      },
      required: ["platform", "goal"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const outputFormat = {
  format: {
    type: "json_schema",
    name: "ilmora_social_post",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        hook: { type: "string" },
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
        callToAction: { type: "string" },
        visualDirection: { type: "string" },
      },
      required: ["title", "hook", "caption", "hashtags", "callToAction", "visualDirection"],
      additionalProperties: false,
    },
  },
};

type OpenAIOutputItem = {
  type?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  content?: Array<{ type?: string; text?: string }>;
};

type OpenAIResponse = {
  id?: string;
  output?: OpenAIOutputItem[];
  output_text?: string;
  error?: { message?: string };
};

export type GeneratedDraft = {
  content: GeneratedContent;
  mode: "openai" | "template";
  notice?: string;
};

const campaignGoalSet = new Set(["enrollment", "awareness", "engagement", "traffic", "launch"]);

// بغیر key کے بھی demo چلتا ہے؛ یہ fallback کوئی بیرونی API استعمال نہیں کرتا۔
function buildTemplate(input: SocialDraftInput): GeneratedContent {
  const urdu = input.language !== "en";
  const bilingual = input.language === "both";
  const topic = input.topic.trim();
  const hook = urdu
    ? `کیا آپ ${topic} کے بارے میں مزید جاننا چاہتے ہیں؟`
    : `Ready to take the next step with ${topic}?`;
  const extraHook = bilingual ? `\n\nLearn more about ${topic} with ILMORA786.` : "";
  const goalLines: Record<SocialDraftInput["goal"], string> = {
    enrollment: urdu ? "اپنے تعلیمی سفر کا اگلا قدم ILMORA786 کے ساتھ طے کریں۔" : "Explore your next learning step with ILMORA786.",
    awareness: urdu ? "بامقصد سیکھنے اور بہتر تدریس کے لیے مفید معلومات سے جڑے رہیں۔" : "Stay connected for practical ideas that support learning and teaching.",
    engagement: urdu ? "آپ کے خیال میں اس موضوع کا سب سے اہم پہلو کون سا ہے؟ اپنی رائے بتائیں۔" : "What matters most to you about this topic? Share your thoughts.",
    traffic: urdu ? "مزید تفصیل کے لیے ہماری ویب سائٹ ملاحظہ کریں۔" : "Visit our website to explore more details.",
    launch: urdu ? "نئی تعلیمی پیش رفت کے لیے ILMORA786 کے ساتھ رہیں۔" : "Follow ILMORA786 for more learning updates.",
  };
  const callToAction = input.callToAction || goalLines[input.goal];
  const caption = urdu
    ? `${hook}\n\n${topic} سیکھنے، سمجھنے اور آگے بڑھنے کا ایک موقع ہے۔ ILMORA786 پر ہمارا مقصد مفید تعلیمی رہنمائی کو آسان اور قابلِ رسائی بنانا ہے۔${extraHook}\n\n${callToAction}`
    : `${hook}\n\nExplore ${topic} with practical, learner-focused guidance from ILMORA786. Our goal is to make useful educational ideas easier to discover and apply.\n\n${callToAction}`;
  const hashtags = urdu
    ? ["#ILMORA786", "#تعلیم", "#سیکھنا", "#تعلیمی_ترقی"]
    : ["#ILMORA786", "#Education", "#Learning", "#Teaching"];

  return {
    title: `${topic} — ILMORA786`,
    hook,
    caption,
    hashtags,
    callToAction,
    visualDirection: urdu
      ? `صاف اور جدید تعلیمی پوسٹر؛ عنوان «${topic}»، نمایاں ILMORA786 wordmark، نرم سبز رنگ، موبائل پر پڑھنے کے قابل اردو متن۔`
      : `A clean, modern education poster about “${topic}”, with ILMORA786 wordmark, soft green accents, and mobile-readable typography.`,
  };
}

function instructionsFor(input: ExtendedSocialDraftInput) {
  // ✅ اگر ڈیٹا بیس سے برانڈ کانٹیکسٹ آیا ہے تو اسے استعمال کریں، ورنہ ڈیفالٹ
  const brandRules = input.brandContext
    ? `DYNAMIC BRAND CONTEXT (LEARNED FROM WEBSITE, FACEBOOK & CODE):\n${input.brandContext}`
    : `Brand rules: ${JSON.stringify(DEFAULT_BRAND_CONTEXT)}`;

  return [
    "You are ILMORA786's careful social content agent. Do not publish or contact anyone.",
    "You MUST call get_ilmora_brand_context and get_campaign_guidance before writing.",
    "Return only the requested structured JSON. Keep claims factual and use only supplied details.",
    "Write naturally in Urdu script for ur, in English for en, and a concise mix for both.",
    brandRules, // ✅ ڈائنامک کانٹیکسٹ یہاں انجیکٹ کیا گیا
    `User brief: ${JSON.stringify(input)}`,
  ].join("\n");
}

async function requestOpenAI(input: ExtendedSocialDraftInput, apiKey: string): Promise<GeneratedContent> {
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const instructions = instructionsFor(input);
  let previousResponseId: string | undefined;
  let requestInput: string | Array<Record<string, string>> =
    `Create one helpful social media post for this brief: ${JSON.stringify(input)}`;

  for (let step = 0; step < 4; step += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input: requestInput,
        tools,
        tool_choice: "auto",
        parallel_tool_calls: false,
        text: outputFormat,
        ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });

    const result = (await response.json().catch(() => ({}))) as OpenAIResponse;
    if (!response.ok) {
      throw new Error(result.error?.message || `OpenAI request failed (${response.status})`);
    }

    const calls = (result.output ?? []).filter((item) => item.type === "function_call");
    if (calls.length === 0) {
      const text =
        result.output_text ??
        (result.output ?? [])
          .flatMap((item) => item.content ?? [])
          .filter((item) => item.type === "output_text")
          .map((item) => item.text ?? "")
          .join("\n");
      if (!text) throw new Error("AI نے خالی جواب دیا۔");
      return generatedContentSchema.parse(JSON.parse(text));
    }

    if (!result.id) throw new Error("AI response id موصول نہیں ہوئی۔");
    previousResponseId = result.id;
    
    requestInput = calls.map((call) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.arguments ?? "{}") as Record<string, unknown>;
      } catch {}

      let output: unknown;
      if (call.name === "get_ilmora_brand_context") {
        // ✅ ٹول کو کال کرنے پر ڈائنامک برانڈ کانٹیکسٹ واپس کریں
        output = input.brandContext 
          ? { learned_brand_profile: input.brandContext } 
          : DEFAULT_BRAND_CONTEXT;
      } else if (call.name === "get_campaign_guidance") {
        const platform = args.platform;
        const goal = args.goal;
        if (
          typeof platform === "string" &&
          typeof goal === "string" &&
          Object.prototype.hasOwnProperty.call(PLATFORM_GUIDANCE, platform) &&
          campaignGoalSet.has(goal)
        ) {
          output = campaignGuidance(goal as SocialDraftInput["goal"], platform as SocialPlatform);
        } else {
          output = { error: "Invalid campaign arguments" };
        }
      } else {
        output = { error: "Unknown tool" };
      }

      return {
        type: "function_call_output",
        call_id: call.call_id ?? "",
        output: JSON.stringify(output),
      };
    });
  }

  throw new Error("ایجنٹ نے مقررہ tool-call حد پوری کر دی۔");
}

// کلائنٹ کو ایک واضح mode ملتا ہے تاکہ demo fallback کو حقیقی AI نہ سمجھا جائے۔
export async function generateSocialDraft(input: ExtendedSocialDraftInput): Promise<GeneratedDraft> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      content: buildTemplate(input),
      mode: "template",
      notice: "OPENAI_API_KEY نہیں ملی؛ مقامی نمونہ استعمال ہوا ہے۔",
    };
  }

  try {
    return { content: await requestOpenAI(input, apiKey), mode: "openai" };
  } catch (error) {
    console.error("ILMORA social agent fallback:", error instanceof Error ? error.message : "unknown error");
    return {
      content: buildTemplate(input),
      mode: "template",
      notice: "AI سروس ابھی دستیاب نہیں؛ قابلِ ترمیم مقامی ڈرافٹ تیار کیا گیا ہے۔",
    };
  }
}