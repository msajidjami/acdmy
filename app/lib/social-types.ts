import { z } from "zod";

// دستیاب چینلز کی فہرست؛ کنکشن صرف سرکاری API/OAuth کے بعد فعال ہوگا۔
export const SOCIAL_PLATFORMS = [
  { id: "facebook", name: "Facebook", short: "FB", color: "#1977f3" },
  { id: "instagram", name: "Instagram", short: "IG", color: "#d84e9a" },
  { id: "whatsapp", name: "WhatsApp", short: "WA", color: "#25a366" },
  { id: "youtube", name: "YouTube", short: "YT", color: "#ed4245" },
  { id: "tiktok", name: "TikTok", short: "TT", color: "#20242b" },
  { id: "linkedin", name: "LinkedIn", short: "in", color: "#0a66c2" },
] as const;

export const platformSchema = z.enum([
  "facebook",
  "instagram",
  "whatsapp",
  "youtube",
  "tiktok",
  "linkedin",
]);

export const languageSchema = z.enum(["ur", "en", "both"]);
export const goalSchema = z.enum([
  "enrollment",
  "awareness",
  "engagement",
  "traffic",
  "launch",
]);
export const toneSchema = z.enum(["warm", "professional", "energetic", "concise"]);

// صارف کی درخواست پہلے validate ہوتی ہے؛ پھر ہی AI یا مقامی ایجنٹ اسے استعمال کرتا ہے۔
export const socialDraftInputSchema = z.object({
  topic: z.string().trim().min(3).max(220),
  platform: platformSchema,
  language: languageSchema,
  goal: goalSchema,
  tone: toneSchema,
  callToAction: z.string().trim().max(160).optional().default(""),
});

// ماڈل کا نتیجہ بھی schema سے گزارا جاتا ہے تاکہ نامکمل/غلط پوسٹ محفوظ نہ ہو۔
export const generatedContentSchema = z.object({
  title: z.string().trim().min(3).max(180),
  hook: z.string().trim().min(2).max(220),
  caption: z.string().trim().min(10).max(3500),
  hashtags: z.array(z.string().trim().min(2).max(48)).max(12),
  callToAction: z.string().trim().max(220),
  visualDirection: z.string().trim().min(3).max(700),
});

export const updatePostSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("schedule"),
    scheduledAt: z.string().datetime({ offset: true }),
  }),
  z.object({ action: z.literal("back_to_draft") }),
]);

export type SocialPlatform = z.infer<typeof platformSchema>;
export type SocialDraftInput = z.infer<typeof socialDraftInputSchema>;
export type GeneratedContent = z.infer<typeof generatedContentSchema>;
export type PostAction = z.infer<typeof updatePostSchema>;

// ایک جگہ labels رکھنے سے تمام dashboard cards میں نام یکساں رہتے ہیں۔
export const GOAL_LABELS: Record<z.infer<typeof goalSchema>, string> = {
  enrollment: "نئے اندراجات",
  awareness: "برانڈ آگاہی",
  engagement: "سامعین سے رابطہ",
  traffic: "ویب سائٹ وزٹس",
  launch: "نئی مہم کا آغاز",
};

export const LANGUAGE_LABELS: Record<z.infer<typeof languageSchema>, string> = {
  ur: "اردو",
  en: "English",
  both: "اردو + English",
};

export const TONE_LABELS: Record<z.infer<typeof toneSchema>, string> = {
  warm: "دوستانہ",
  professional: "پیشہ ورانہ",
  energetic: "پُرجوش",
  concise: "مختصر",
};
