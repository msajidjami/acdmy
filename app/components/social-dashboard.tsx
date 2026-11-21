"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  GOAL_LABELS,
  LANGUAGE_LABELS,
  SOCIAL_PLATFORMS,
  TONE_LABELS,
  type SocialPlatform,
} from "@/app/lib/social-types";

// ─── اردو نستعلیق فونٹ ───
const URDU_FONT_STACK =
  "'Jameel Noori Nastaleeq', 'Jameel Noori Nastaleeq Regular', 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif";

type SocialPost = {
  id: string;
  title: string;
  topic: string;
  platform: string;
  language: string;
  goal: string;
  tone: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  visualDirection: string;
  status: string;
  aiMode: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Activity = {
  id: string;
  postId: string | null;
  action: string;
  message: string;
  createdAt: string;
};

type Stats = {
  total: number;
  drafts: number;
  approved: number;
  scheduled: number;
  published: number;
  thisWeek: number;
  connectedChannels: number;
};

type SocialConnection = {
  platform: string;
  accountId: string;
  accountName: string | null;
  status: string;
  tokenExpiresAt: string | null;
};

type AuthState = {
  authenticated: boolean;
  protected: boolean;
  previewMode: boolean;
};

type DashboardData = {
  posts: SocialPost[];
  activities: Activity[];
  stats: Stats;
};

type FilterKey = "all" | "draft" | "approved" | "scheduled";
type IconName =
  | "grid" | "pen" | "calendar" | "chart" | "link" | "settings"
  | "search" | "bell" | "arrow" | "plus" | "spark" | "check"
  | "clock" | "copy" | "share" | "trash" | "close" | "target"
  | "image" | "shield" | "chevron" | "message" | "refresh"
  | "menu" | "external" | "play" | "book" | "eye" | "zap";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shapes: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    pen: <><path d="m4 16.5-.8 4.3 4.3-.8L19.6 7.9a2.1 2.1 0 0 0-3-3L4 16.5Z" /><path d="m14.8 6.7 3 3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 6-7" /><path d="M17 6h4v4" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2.4-2.4a5 5 0 0 0-7.1-7.1l-1.4 1.4" /><path d="M14 11a5 5 0 0 0-7.1 0l-2.4 2.4a5 5 0 0 0 7.1 7.1l1.4-1.4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2A1.7 1.7 0 0 0 8 17.4l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4.2a1.7 1.7 0 0 1 0-3.4h.2A1.7 1.7 0 0 0 5.6 6l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.2a1.7 1.7 0 0 1 3.4 0v.2A1.7 1.7 0 0 0 17.2 4l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.4 2.3Z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.5-2.6L20 12M4 12l2.9 5.6A7 7 0 0 0 18.4 15" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    external: <><path d="M14 3h7v7M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    play: <><path d="m8 5 12 7-12 7V5Z" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {shapes[name]}
    </svg>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ur-PK", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi",
  }).format(new Date(value));
}
function formatDay(value: Date) {
  return new Intl.DateTimeFormat("ur-PK", {
    weekday: "short", day: "numeric", timeZone: "Asia/Karachi",
  }).format(value);
}
function toLocalDateTimeInput(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
function postText(post: SocialPost) {
  return `${post.caption}${post.hashtags.length ? `\n\n${post.hashtags.join(" ")}` : ""}`;
}
function platformFor(id: string) {
  return SOCIAL_PLATFORMS.find((platform) => platform.id === id) ?? SOCIAL_PLATFORMS[0];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { text: string; cls: string; dot: string }> = {
    draft:     { text: "جائزہ درکار", cls: "bg-amber-50 text-amber-800 ring-amber-200",       dot: "bg-amber-500" },
    approved:  { text: "منظور شدہ",  cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-600" },
    scheduled: { text: "کیلنڈر میں", cls: "bg-green-50 text-green-800 ring-green-200",       dot: "bg-green-600" },
    published: { text: "شائع شدہ",   cls: "bg-black text-white ring-black",                  dot: "bg-emerald-400" },
  };
  const item = styles[status] ?? styles.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${item.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.text}
    </span>
  );
}

type PostCardProps = {
  post: SocialPost; busy: boolean;
  canPublish: boolean;
  onCopy: (post: SocialPost) => void;
  onWhatsApp: (post: SocialPost) => void;
  onApprove: (post: SocialPost) => void;
  onSchedule: (post: SocialPost) => void;
  onRestore: (post: SocialPost) => void;
  onDelete: (post: SocialPost) => void;
  onPublish: (post: SocialPost) => void;
};

function PostCard({
  post, busy, canPublish, onCopy, onWhatsApp, onApprove, onSchedule, onRestore, onDelete, onPublish,
}: PostCardProps) {
  const platform = platformFor(post.platform);
  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-emerald-100/60 hover:border-emerald-200 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
            style={{ backgroundColor: platform.color }}
          >
            {platform.short}
          </span>
          <div className="min-w-0">
            <strong className="block text-sm text-slate-900">{platform.name}</strong>
            <span className="block text-xs text-slate-500 truncate">
              {formatDateTime(post.createdAt)} · {post.language === "en" ? "English" : post.language === "both" ? "اردو + English" : "اردو"}
            </span>
          </div>
        </div>
        <StatusBadge status={post.status} />
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-slate-900 leading-loose">{post.title}</h3>
          {post.aiMode === "template" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">قابلِ ترمیم نمونہ</span>
          )}
        </div>
        <p className="text-sm text-slate-700 leading-loose whitespace-pre-wrap" dir="auto">{post.caption}</p>
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" dir="auto">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-100">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
          <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Icon name="image" size={15} />
          </span>
          <div className="min-w-0">
            <b className="text-xs font-semibold text-emerald-900 block">کری ایٹو ہدایت</b>
            <p className="text-xs text-slate-700 mt-0.5 leading-loose" dir="auto">{post.visualDirection}</p>
          </div>
        </div>
      </div>

      {post.status === "scheduled" && post.scheduledAt && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-800 text-xs border border-green-200">
          <Icon name="clock" size={14} />
          <span>{formatDateTime(post.scheduledAt)} · اندرونی کیلنڈر؛ خودکار اشاعت ابھی منسلک نہیں</span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={() => onCopy(post)} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 transition">
            <Icon name="copy" size={14} /> کاپی
          </button>
          <button onClick={() => onWhatsApp(post)} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition">
            <Icon name="message" size={14} /> WhatsApp
          </button>
        </div>
        <div className="flex items-center gap-1">
          {post.status === "approved" && canPublish && (
            <button onClick={() => onPublish(post)} disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white disabled:opacity-50 transition shadow-sm shadow-emerald-500/20">
              <Icon name="external" size={13} /> شائع کریں
            </button>
          )}
          {post.status === "draft" && (
            <button onClick={() => onApprove(post)} disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition">
              <Icon name="check" size={13} /> منظور کریں
            </button>
          )}
          {post.status !== "scheduled" ? (
            <button onClick={() => onSchedule(post)} disabled={busy} aria-label="شیڈول کریں" title="کیلنڈر میں رکھیں"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 transition">
              <Icon name="calendar" size={15} />
            </button>
          ) : (
            <button onClick={() => onRestore(post)} disabled={busy}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition">
              شیڈول منسوخ
            </button>
          )}
          <button onClick={() => onDelete(post)} disabled={busy} aria-label="پوسٹ حذف کریں" title="حذف کریں"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition">
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

const defaultStats: Stats = {
  total: 0, drafts: 0, approved: 0, scheduled: 0, published: 0, thisWeek: 0, connectedChannels: 0,
};

const navItems = [
  { id: "overview",  label: "ڈیش بورڈ",       sub: "Overview",        icon: "grid"     as const },
  { id: "studio",    label: "کنٹینٹ اسٹوڈیو",  sub: "Content studio",  icon: "pen"      as const },
  { id: "calendar",  label: "پوسٹنگ کیلنڈر",   sub: "Calendar",        icon: "calendar" as const },
  { id: "analytics", label: "کارکردگی",        sub: "Analytics",       icon: "chart"    as const },
  { id: "channels",  label: "اکاؤنٹس",         sub: "Connections",     icon: "link"     as const },
];

const activityLabels: Record<string, string> = {
  draft_created: "نیا ڈرافٹ تیار ہوا",
  approved: "پوسٹ منظور ہوئی",
  scheduled: "پوسٹ کیلنڈر میں رکھی گئی",
  draft_restored: "پوسٹ دوبارہ ڈرافٹ بنی",
  post_deleted: "ایک ڈرافٹ حذف کیا گیا",
  published: "پوسٹ شائع ہوگئی",
};

const channelGuides: Record<string, { title: string; steps: string[]; note: string }> = {
  facebook: { title: "Facebook Page connection",
    steps: ["Meta for Developers میں business app بنائیں۔", "Facebook Page اور مطلوبہ publish permissions کی owner منظوری لیں۔", "OAuth flow اور encrypted server-side token storage شامل کریں۔"],
    note: "Facebook پر خودکار پوسٹنگ کے لیے Page access اور Meta کی موجودہ اجازت ضروری ہے؛ عام share dialog پوسٹ کو خود publish نہیں کرتا۔" },
  instagram: { title: "Instagram professional account",
    steps: ["Instagram account کو Professional بنائیں اور Facebook Page سے link کریں۔", "Meta OAuth اور Content Publishing API permissions حاصل کریں۔", "تصویر/ویڈیو، caption اور container processing کو backend میں handle کریں۔"],
    note: "ذاتی Instagram accounts اور تمام media formats پر publishing یکساں دستیاب نہیں ہوتی۔" },
  whatsapp: { title: "WhatsApp Business connection",
    steps: ["Meta Business Manager میں WhatsApp Business Platform (Cloud API) ترتیب دیں۔", "Business phone number، verified webhook اور opt-in audience جوڑیں۔", "سرور پر access token محفوظ رکھیں اور approved templates استعمال کریں۔"],
    note: "Official Cloud API عام WhatsApp groups میں خودکار پوسٹنگ کی اجازت نہیں دیتی۔ یہ بٹن صرف آپ کے لیے share window کھولتا ہے؛ گروپ منتخب کرکے Send آپ خود کریں گے۔" },
  youtube: { title: "YouTube channel connection",
    steps: ["Google Cloud میں YouTube Data API فعال کریں۔", "OAuth consent screen اور channel owner کی اجازت ترتیب دیں۔", "Upload endpoint، privacy selection اور quota monitoring backend میں شامل کریں۔"],
    note: "اکاؤنٹ token کبھی browser میں نہ رکھیں؛ OAuth credentials صرف server-side رہیں۔" },
  tiktok: { title: "TikTok account connection",
    steps: ["TikTok for Developers میں Content Posting API کے لیے درخواست دیں۔", "OAuth scopes اور creator authorization کا عمل مکمل کریں۔", "ویڈیو upload، moderation status اور publishing response محفوظ کریں۔"],
    note: "API access اور publishing modes اکاؤنٹ، app review اور platform policy پر منحصر ہیں۔" },
  linkedin: { title: "LinkedIn Page connection",
    steps: ["LinkedIn Developer app اور organization/Page admin access بنائیں۔", "درکار Community Management permissions کے لیے review حاصل کریں۔", "OAuth callback اور محفوظ token refresh server-side نافذ کریں۔"],
    note: "ذاتی پروفائل اور Organization/Page publishing کے permissions مختلف ہو سکتے ہیں۔" },
};

export default function SocialDashboard() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [activeSection, setActiveSection] = useState("overview");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [language, setLanguage] = useState<"ur" | "en" | "both">("ur");
  const [goal, setGoal] = useState<"enrollment" | "awareness" | "engagement" | "traffic" | "launch">("enrollment");
  const [tone, setTone] = useState<"warm" | "professional" | "energetic" | "concise">("warm");
  const [callToAction, setCallToAction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [busyPostId, setBusyPostId] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [schedulePost, setSchedulePost] = useState<SocialPost | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");
  const [connection, setConnection] = useState<SocialPlatform | null>(null);
  const [toast, setToast] = useState("");
  const [connections, setConnections] = useState<SocialConnection[]>([]);

  // ✅ نیا: آٹو پائلٹ سٹیٹس
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [isLearningBrand, setIsLearningBrand] = useState(false);

  function connectionFor(platformId: string): SocialConnection | null {
    return connections.find((c) => c.platform === platformId && c.status === "connected") ?? null;
  }

  async function refreshConnections() {
    try {
      const res = await fetch("/api/social/connections", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { connections?: SocialConnection[] };
      setConnections(data.connections ?? []);
    } catch { }
  }

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const authResponse = await fetch("/api/social/auth", { cache: "no-store" });
        const authData = (await authResponse.json()) as AuthState;
        if (!active) return;
        setAuth(authData);
        if (!authData.authenticated) { setLoading(false); return; }
        const response = await fetch("/api/social/posts", { cache: "no-store" });
        const payload = (await response.json()) as DashboardData & { error?: string };
        if (!active) return;
        if (!response.ok) throw new Error(payload.error || "پوسٹس لوڈ نہیں ہو سکیں۔");
        setPosts(payload.posts ?? []);
        setActivities(payload.activities ?? []);
        setStats(payload.stats ?? defaultStats);
        void refreshConnections();
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "سرور سے رابطہ نہیں ہو سکا۔");
      } finally {
        if (active) setLoading(false);
      }
    }
    void bootstrap();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connect = params.get("connect");
    if (!connect) return;
    if (connect === "success") {
      setToast(`${params.get("platform") ?? "اکاؤنٹ"} کامیابی سے منسلک ہو گیا!`);
      void refreshConnections();
    } else if (connect === "error") {
      setToast(`کنکشن ناکام: ${params.get("reason") ?? "نامعلوم وجہ"}`);
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return posts.filter((post) => {
      const statusMatches = filter === "all" || post.status === filter;
      const queryMatches = !query || `${post.title} ${post.topic} ${post.caption}`.toLocaleLowerCase().includes(query);
      return statusMatches && queryMatches;
    });
  }, [posts, filter, search]);

  const previewPost = posts.find((post) => post.id === selectedPostId) ?? posts[0] ?? null;

  async function refreshPosts() {
    const response = await fetch("/api/social/posts", { cache: "no-store" });
    const payload = (await response.json()) as DashboardData & { error?: string };
    if (!response.ok) throw new Error(payload.error || "پوسٹس دوبارہ لوڈ نہیں ہو سکیں۔");
    setPosts(payload.posts ?? []);
    setActivities(payload.activities ?? []);
    setStats(payload.stats ?? defaultStats);
  }

  function jumpTo(section: string) {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true); setLoadError("");
    try {
      const response = await fetch("/api/social/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      const payload = (await response.json()) as AuthState & { error?: string };
      if (!response.ok) throw new Error(payload.error || "لاگ اِن نہیں ہو سکا۔");
      setAuth(payload);
      setLoginPassword("");
      await refreshPosts();
      void refreshConnections();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "لاگ اِن نہیں ہو سکا۔");
    } finally {
      setLoginBusy(false); setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/social/auth", { method: "DELETE" }).catch(() => undefined);
    setAuth({ authenticated: false, protected: true, previewMode: false });
    setPosts([]); setActivities([]); setStats(defaultStats); setConnections([]);
  }

  // ✅ نیا فنکشن: برانڈ سیکھنا
  async function handleLearnBrand() {
    setIsLearningBrand(true);
    try {
      const res = await fetch("/api/social/brand/learn", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "برانڈ سیکھنے میں ناکامی");
      setToast("AI نے آپ کی ویب سائٹ، کوڈ اور فیس بک سے برانڈ سیکھ لیا ہے!");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "برانڈ سیکھنے میں ناکامی");
    } finally {
      setIsLearningBrand(false);
    }
  }

  // ✅ نیا فنکشن: آٹو پوسٹ ٹرگر کرنا
  async function handleRunAutoPost() {
    setIsAutoPilotRunning(true);
    try {
      const res = await fetch("/api/social/cron/daily");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "آٹو پوسٹ ناکام رہی");
      setToast("آٹو پائلٹ: آج کی پوسٹ بن گئی اور فیس بک پر شائع ہو گئی!");
      void refreshPosts();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "آٹو پوسٹ ناکام رہی");
    } finally {
      setIsAutoPilotRunning(false);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topic.trim().length < 3) { setToast("پوسٹ کے لیے کم از کم تین حروف کا موضوع لکھیں۔"); return; }
    setGenerating(true); setLoadError("");
    try {
      const response = await fetch("/api/social/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, language, goal, tone, callToAction }),
      });
      const payload = (await response.json()) as { post?: SocialPost; notice?: string | null; error?: string };
      if (!response.ok || !payload.post) throw new Error(payload.error || "ڈرافٹ تیار نہیں ہوا۔");
      setPosts((current) => [payload.post!, ...current.filter((post) => post.id !== payload.post!.id)]);
      setSelectedPostId(payload.post.id);
      setStats((current) => ({ ...current, total: current.total + 1, drafts: current.drafts + 1, thisWeek: current.thisWeek + 1 }));
      setTopic(""); setCallToAction("");
      setToast(payload.notice || "ڈرافٹ محفوظ ہوگیا — شائع کرنے سے پہلے اس کا جائزہ لیں۔");
      void refreshPosts().catch(() => undefined);
      document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "ڈرافٹ تیار نہیں ہو سکا۔");
    } finally { setGenerating(false); }
  }

  async function updatePost(post: SocialPost, action: Record<string, string>) {
    setBusyPostId(post.id);
    try {
      const response = await fetch(`/api/social/posts/${post.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action),
      });
      const payload = (await response.json()) as { post?: SocialPost; error?: string };
      if (!response.ok || !payload.post) throw new Error(payload.error || "پوسٹ اپ ڈیٹ نہیں ہو سکی۔");
      setPosts((current) => current.map((item) => item.id === post.id ? payload.post! : item));
      setToast(action.action === "schedule"
        ? "پوسٹ اندرونی کیلنڈر میں محفوظ ہوئی؛ اصل اشاعت کے لیے پلیٹ فارم کنکشن درکار ہے۔"
        : action.action === "approve"
          ? "پوسٹ منظور ہوگئی۔ اب اسے خود share یا schedule کر سکتے ہیں۔"
          : "پوسٹ دوبارہ drafts میں منتقل ہوگئی۔");
      setSchedulePost(null);
      void refreshPosts().catch(() => undefined);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "پوسٹ اپ ڈیٹ نہیں ہو سکی۔");
    } finally { setBusyPostId(""); }
  }

  async function handlePublish(post: SocialPost) {
    const platformName = platformFor(post.platform).name;
    if (!window.confirm(`${platformName} پر یہ پوسٹ ابھی شائع کریں؟`)) return;
    setBusyPostId(post.id);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const payload = (await res.json()) as { ok?: boolean; externalId?: string; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "اشاعت ناکام");
      setToast(`${platformName} پر پوسٹ شائع ہوگئی!`);
      void refreshPosts().catch(() => undefined);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "اشاعت ناکام");
    } finally {
      setBusyPostId("");
    }
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schedulePost || !scheduleValue) return;
    await updatePost(schedulePost, { action: "schedule", scheduledAt: new Date(scheduleValue).toISOString() });
  }

  async function handleDelete(post: SocialPost) {
    if (!window.confirm("کیا آپ یہ ڈرافٹ مستقل طور پر حذف کرنا چاہتے ہیں؟")) return;
    setBusyPostId(post.id);
    try {
      const response = await fetch(`/api/social/posts/${post.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "پوسٹ حذف نہیں ہوئی۔");
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setToast("ڈرافٹ حذف کردیا گیا۔");
      void refreshPosts().catch(() => undefined);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "پوسٹ حذف نہیں ہوئی۔");
    } finally { setBusyPostId(""); }
  }

  async function copyPost(post: SocialPost) {
    try {
      await navigator.clipboard.writeText(postText(post));
      setToast("کیپشن اور hashtags کاپی ہوگئے۔");
    } catch { setToast("کاپی کی اجازت نہیں ملی؛ متن منتخب کرکے کاپی کریں۔"); }
  }

  function shareWhatsApp(post: SocialPost) {
    window.open(`https://wa.me/?text=${encodeURIComponent(postText(post))}`, "_blank", "noopener,noreferrer");
    setToast("WhatsApp کھل رہا ہے؛ گروپ منتخب کرکے Send آپ خود کریں۔");
  }

  function openSchedule(post: SocialPost) {
    setSchedulePost(post);
    setScheduleValue(toLocalDateTimeInput(new Date(Date.now() + 45 * 60 * 1000)));
  }

  function loadCampaignIdea() {
    setTopic("طلبہ کے لیے روزانہ سیکھنے کی عادت بنانے کے آسان طریقے");
    setPlatform("facebook"); setGoal("engagement"); setLanguage("ur");
    jumpTo("studio");
    setToast("مہم کا آئیڈیا کمپوزر میں شامل ہوگیا — اپنی معلومات کے مطابق اسے تبدیل کریں۔");
  }

  const sectionLabels: Record<string, string> = {
    overview: "ڈیش بورڈ", studio: "کنٹینٹ اسٹوڈیو", calendar: "پوسٹنگ کیلنڈر",
    analytics: "کارکردگی", channels: "اکاؤنٹس",
  };

  if (loading) {
    return (
      <main style={{ fontFamily: URDU_FONT_STACK }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 gap-5" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/25">IL</div>
        <div className="w-40 h-1 rounded-full bg-emerald-100 overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-emerald-400 to-green-600 animate-pulse rounded-full" />
        </div>
        <p className="text-sm text-slate-700 leading-loose">ILMORA AI Social Team تیار ہو رہی ہے…</p>
      </main>
    );
  }

  if (auth && !auth.authenticated) {
    return (
      <main style={{ fontFamily: URDU_FONT_STACK }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6 relative overflow-hidden" dir="rtl">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-300/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-green-300/40 blur-3xl" />
        <section className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl shadow-emerald-100/50 p-8 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/25">
            <span>IL</span>
          </div>
          <div className="text-[10px] font-bold tracking-widest text-emerald-700">ILMORA786 · OWNER ACCESS</div>
          <h1 className="text-2xl font-bold text-slate-900 leading-loose">اپنی سوشل ٹیم میں داخل ہوں</h1>
          <p className="text-sm text-slate-700 leading-loose">
            یہ ڈیش بورڈ owner کے لیے ہے۔ آگے بڑھنے کے لیے اپنا dashboard password درج کریں۔
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <label htmlFor="owner-password" className="block text-sm font-medium text-slate-800">Owner password</label>
            <input
              id="owner-password" type="password" autoComplete="current-password"
              value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="پاس ورڈ درج کریں" required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
            {loadError && <p className="text-sm text-rose-600 leading-loose">{loadError}</p>}
            <button
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-60 transition"
              disabled={loginBusy}>
              {loginBusy ? "تصدیق ہو رہی ہے…" : "محفوظ لاگ اِن"}
              <Icon name="arrow" size={16} />
            </button>
          </form>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Icon name="shield" size={15} />
            <span className="leading-loose">Session ایک HttpOnly cookie میں محفوظ رہتا ہے۔</span>
          </div>
        </section>
        <footer className="relative mt-8 text-[10px] tracking-widest text-slate-500 font-semibold">
          ILMORA AI SOCIAL TEAM <span className="mx-2">·</span> PRIVATE WORKSPACE
        </footer>
      </main>
    );
  }

  const filters: { id: FilterKey; label: string; count: number }[] = [
    { id: "all", label: "سبھی", count: posts.length },
    { id: "draft", label: "جائزہ درکار", count: stats.drafts },
    { id: "approved", label: "منظور شدہ", count: stats.approved },
    { id: "scheduled", label: "شیڈول", count: stats.scheduled },
  ];

  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const count = posts.filter((post) => {
      const postKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(post.createdAt));
      return key === postKey;
    }).length;
    return { date, count };
  });
  const maxChartCount = Math.max(...chartDays.map((day) => day.count), 1);
  const selectedConnection = connection ? platformFor(connection) : null;
  const activeGuide = connection ? channelGuides[connection] : null;
  const selectedIsConnected = connection ? connectionFor(connection) : null;

  return (
    <main style={{ fontFamily: URDU_FONT_STACK }}
      className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      <div className="flex min-h-screen">
        {/* ─── SIDEBAR ─── */}
        <aside className="w-64 shrink-0 bg-white border-l border-slate-200 flex flex-col p-4 sticky top-0 h-screen overflow-y-auto">
          <div className="flex items-center gap-2.5 px-1 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/25">
              <span>IL</span>
            </div>
            <div className="leading-tight">
              <strong className="block text-sm font-bold text-slate-900">ILMORA<span className="text-emerald-700">786</span></strong>
              <small className="text-[10px] tracking-widest text-slate-500 font-semibold">AI SOCIAL TEAM</small>
            </div>
          </div>

          <button onClick={() => jumpTo("overview")}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 transition text-right">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white text-xs font-bold flex items-center justify-center shrink-0">I</span>
            <span className="flex-1 min-w-0">
              <small className="block text-[9px] tracking-widest text-slate-500 font-semibold">WORKSPACE</small>
              <b className="block text-xs text-slate-900 truncate">ILMORA Academy</b>
            </span>
            <Icon name="chevron" size={13} />
          </button>

          <p className="mt-5 mb-2 px-2 text-[10px] tracking-widest text-slate-500 font-semibold">مین مینو</p>
          <nav aria-label="مرکزی نیویگیشن" className="space-y-0.5">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => jumpTo(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition ${
                  activeSection === item.id
                    ? "bg-emerald-50 text-emerald-800 font-medium border border-emerald-100"
                    : "text-slate-700 hover:bg-emerald-50/60"
                }`}>
                <span className="shrink-0"><Icon name={item.icon} size={17} /></span>
                <span className="flex-1 text-right leading-tight">
                  {item.label}
                  <small className="block text-[10px] text-slate-500 font-normal mt-0.5">{item.sub}</small>
                </span>
                {item.id === "calendar" && stats.scheduled > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full px-1.5 py-0.5">{stats.scheduled}</span>
                )}
                {item.id === "channels" && connections.length > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-600 text-white rounded-full px-1.5 py-0.5">{connections.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="my-4 border-t border-slate-100" />
          <p className="mb-2 px-2 text-[10px] tracking-widest text-slate-500 font-semibold">ٹیم کی حیثیت</p>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
            <div className="w-8 h-8 rounded-lg bg-white text-emerald-700 flex items-center justify-center shadow-sm">
              <Icon name="spark" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-xs text-slate-900">Content Agent</strong>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 mt-0.5">
                <i className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> ڈرافٹ کے لیے تیار
              </span>
            </div>
          </div>

          <div className="mt-auto pt-4 space-y-2">
            <button onClick={() => jumpTo("channels")}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-slate-700 hover:bg-emerald-50 transition">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">?</span>
              <span className="flex-1 text-right leading-tight">
                کنکشن مدد
                <small className="block text-[10px] text-slate-500">Setup guide دیکھیں</small>
              </span>
              <Icon name="chevron" size={13} />
            </button>
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-50">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-black text-white text-[10px] font-bold flex items-center justify-center shrink-0">IL</div>
              <div className="flex-1 min-w-0">
                <strong className="block text-xs text-slate-900 truncate">ILMORA786</strong>
                <small className="block text-[10px] text-slate-500 truncate">
                  {auth?.protected ? "Owner workspace" : "Preview workspace"}
                </small>
              </div>
              {auth?.protected && (
                <button onClick={handleLogout} aria-label="لاگ آؤٹ" title="لاگ آؤٹ"
                  className="w-6 h-6 rounded-lg text-slate-500 hover:bg-emerald-100 hover:text-emerald-800 flex items-center justify-center transition">
                  <Icon name="external" size={13} />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ─── MAIN PANEL ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">ILMORA786</span>
              <i className="text-slate-300">/</i>
              <b className="text-slate-900">{sectionLabels[activeSection]}</b>
            </div>
            <div className="flex items-center gap-2">
              <label className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition">
                <Icon name="search" size={15} />
                <input value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder="پوسٹ، موضوع تلاش کریں…"
                  className="bg-transparent outline-none text-sm w-48 text-slate-800 placeholder:text-slate-400" />
                <kbd className="text-[10px] text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">⌘ K</kbd>
              </label>
              <button aria-label="اطلاعات"
                className="relative w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 flex items-center justify-center transition">
                <Icon name="bell" size={16} />
                <i className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
              </button>
              <button onClick={() => auth?.protected ? handleLogout() : setToast("Preview موڈ میں پاس ورڈ مقرر نہیں ہے۔")}
                className="flex items-center gap-1.5 h-9 px-2 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 hover:bg-emerald-50 transition">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white text-[10px] font-bold flex items-center justify-center">I</span>
                <span>Owner</span>
                <Icon name="chevron" size={12} />
              </button>
            </div>
          </header>

          <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
            {loadError && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                <Icon name="shield" size={16} />
                <span className="flex-1 leading-loose">{loadError}</span>
                <button onClick={() => { setLoadError(""); void refreshPosts().catch((error) => setLoadError(error.message)); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 transition text-xs font-medium">
                  <Icon name="refresh" size={13} /> دوبارہ کوشش
                </button>
              </div>
            )}

            {/* WELCOME */}
            <section id="overview" className="flex items-end justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[10px] tracking-widest font-semibold text-emerald-700">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Icon name="spark" size={12} />
                  </span>
                  SOCIAL HQ <i className="w-0.5 h-0.5 rounded-full bg-emerald-400" /> ILMORA AI TEAM
                </div>
                <h1 className="text-3xl font-bold text-slate-900 leading-loose">
                  السلام علیکم، <span className="text-emerald-700">ILMORA team!</span>
                </h1>
                <p className="text-sm text-slate-700 leading-loose">
                  آج کے تعلیمی مواد کو ایک جگہ سے بنائیں، دیکھیں اور اپنے اگلے قدم کی منصوبہ بندی کریں۔
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => jumpTo("calendar")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
                  <Icon name="calendar" size={15} /> کیلنڈر دیکھیں
                </button>
                <button onClick={() => jumpTo("studio")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 transition">
                  <Icon name="plus" size={15} /> نئی پوسٹ بنائیں
                </button>
              </div>
            </section>

            {/* ✅ نیا: AUTO-PILOT CONTROL SECTION */}
            <section className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 border border-emerald-800/50 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-widest">
                    <Icon name="zap" size={14} /> AUTO-PILOT MODE
                  </div>
                  <h2 className="text-2xl font-bold text-white">آٹو پائلٹ کنٹرول</h2>
                  <p className="text-sm text-emerald-100/70 leading-loose max-w-xl">
                    AI کو اپنی ویب سائٹ اور کوڈ بیس سکھائیں، پھر ایک کلک سے آج کی خودکار پوسٹ بنوا کر دیکھیں۔ (پروڈکشن میں یہ ہر روز خود بخود چلے گا)۔
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                  <button onClick={handleLearnBrand} disabled={isLearningBrand || isAutoPilotRunning}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition disabled:opacity-50">
                    {isLearningBrand ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon name="book" size={16} />}
                    برانڈ سیکھیں
                  </button>
                  <button onClick={handleRunAutoPost} disabled={isAutoPilotRunning || isLearningBrand}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition disabled:opacity-50">
                    {isAutoPilotRunning ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon name="spark" size={16} />}
                    آج کی خودکار پوسٹ بنائیں
                  </button>
                </div>
              </div>
            </section>

            {/* STATS */}
            <section aria-label="سوشل میڈیا خلاصہ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "CONTENT LIBRARY",    value: stats.total, unit: "پوسٹس",       foot: `اس ہفتے ${stats.thisWeek} نئے drafts`, icon: "pen"      as IconName, cls: "from-emerald-50 to-green-50 border-emerald-100 text-emerald-700" },
                { label: "OWNER REVIEW",       value: stats.drafts, unit: "جائزے کے لیے", foot: "منظوری آپ کے کنٹرول میں",                icon: "eye"      as IconName, cls: "from-orange-50 to-amber-50 border-orange-100 text-orange-700" },
                { label: "CONTENT CALENDAR",   value: stats.scheduled, unit: "شیڈول",    foot: "اندرونی queue میں",                     icon: "calendar" as IconName, cls: "from-green-50 to-emerald-50 border-green-100 text-green-700" },
                { label: "CONNECTED CHANNELS", value: connections.length, unit: "منسلک", foot: connections.length > 0 ? "OAuth فعال ہے" : "official setup درکار", icon: "link" as IconName, cls: "from-slate-50 to-slate-100 border-slate-200 text-slate-800" },
              ].map((s) => (
                <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 border bg-gradient-to-br ${s.cls}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shadow-sm">
                      <Icon name={s.icon} size={16} />
                    </span>
                    <span className="text-[9px] tracking-widest font-bold text-slate-600">{s.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900">{s.value}</span>
                    <small className="text-xs text-slate-600 font-medium">{s.unit}</small>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-700">
                    <i className="w-1.5 h-1.5 rounded-full bg-current opacity-60" /> {s.foot}
                  </div>
                  <span className="absolute -bottom-3 -left-3 opacity-10">
                    <Icon name={s.icon} size={56} />
                  </span>
                </div>
              ))}
            </section>

            {/* CAMPAIGN + TEAM */}
            <section className="grid lg:grid-cols-3 gap-4">
              <article className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="relative h-40 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/15 blur-2xl" />
                  <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-green-300/30 blur-2xl" />
                  <div className="absolute top-6 right-6 text-white/70 text-lg">✦ <span className="text-xs">✧</span> ✦</div>
                  <div className="absolute bottom-4 right-6 text-[10px] tracking-widest text-white/90 font-semibold">LEARN · GROW · LEAD</div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100">
                      <Icon name="target" size={12} /> مہم کی تجویز
                    </span>
                    <span className="text-[10px] tracking-widest text-slate-500 font-semibold">WEEKLY PLAN</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 leading-loose">ہر دن، ایک نیا تعلیمی قدم</h2>
                  <p className="text-sm text-slate-700 leading-loose">
                    مختصر تعلیمی insights، اساتذہ کی رہنمائی اور طلبہ کے لیے قابلِ عمل learning tips سے ILMORA786 کی پہچان بڑھائیں۔
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "برانڈ آگاہی", dot: "bg-emerald-600" },
                      { label: "مفید مواد",   dot: "bg-green-600" },
                      { label: "گفتگو",        dot: "bg-teal-600" },
                    ].map((p) => (
                      <span key={p.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-xs text-slate-800 border border-slate-100">
                        <i className={`w-1.5 h-1.5 rounded-full ${p.dot}`} /> {p.label}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    {[["01","Insight"],["02","Tip"],["03","سوال"],["04","دعوت"]].map(([n, t], i) => (
                      <div key={n} className="flex items-center gap-2">
                        {i > 0 && <i className="w-3 h-px bg-slate-200" />}
                        <div className="flex items-center gap-1">
                          <b className="text-slate-900 font-bold">{n}</b>
                          <span className="text-[11px]">{t}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={loadCampaignIdea}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-medium transition">
                    اس مہم سے پوسٹ بنائیں <Icon name="arrow" size={14} />
                  </button>
                  <small className="block text-[11px] text-slate-500 leading-loose">
                    AI کی تیار کردہ حکمتِ عملی کا مسودہ — پوسٹ سے پہلے حقائق کی جانچ کریں۔
                  </small>
                </div>
              </article>

              <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] tracking-widest text-slate-500 font-semibold">YOUR DIGITAL TEAM</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5 leading-loose">آپ کی AI ٹیم</h2>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                    <i className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> تیار
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-loose">
                  ہر role کا دائرہ واضح ہے؛ اصل اشاعت ابھی owner کے اختیار میں ہے۔
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "target" as IconName, title: "Marketing Manager", sub: "مہم کا مقصد اور ہفتہ وار پلان", tag: "IDEAS",  tagCls: "bg-emerald-50 text-emerald-800 border border-emerald-100", iconCls: "bg-emerald-100 text-emerald-700" },
                    { icon: "book"   as IconName, title: "Research Agent",    sub: "موضوع سے وابستہ مفید زاویے",    tag: "READY",  tagCls: "bg-slate-100 text-slate-700",                                  iconCls: "bg-green-100 text-green-700" },
                    { icon: "spark"  as IconName, title: "Content Agent",     sub: "اردو/انگریزی میں پوسٹ ڈرافٹ",   tag: "ACTIVE", tagCls: "bg-emerald-600 text-white",                                    iconCls: "bg-teal-100 text-teal-700" },
                    { icon: "image"  as IconName, title: "Creative Agent",    sub: "تصویر کے لیے visual direction", tag: "READY",  tagCls: "bg-slate-100 text-slate-700",                                  iconCls: "bg-green-100 text-green-700" },
                  ].map((a) => (
                    <div key={a.title} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.iconCls}`}>
                        <Icon name={a.icon} size={15} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <b className="block text-xs text-slate-900 truncate">{a.title}</b>
                        <small className="block text-[10px] text-slate-600 truncate">{a.sub}</small>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.tagCls}`}>{a.tag}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-700 bg-emerald-50/40 rounded-xl p-2.5 border border-emerald-100">
                  <Icon name="shield" size={13} />
                  <span className="leading-loose">Publishing اور Analytics، آفیشل اکاؤنٹ کنکشن کے بعد فعال ہوں گے۔</span>
                </div>
              </article>
            </section>

            {/* STUDIO */}
            <section id="studio" className="grid lg:grid-cols-3 gap-4">
              <article className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] tracking-widest text-emerald-700 font-semibold">
                      CONTENT STUDIO <i className="mx-1 text-slate-300">·</i> 01
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1 leading-loose">نئی پوسٹ تیار کریں</h2>
                    <p className="text-xs text-slate-600 mt-1 leading-loose">موضوع دیں — ایجنٹ ایک editable ڈرافٹ بنائے گا۔</p>
                  </div>
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <Icon name="spark" size={17} />
                  </span>
                </div>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label htmlFor="post-topic" className="block text-sm font-medium text-slate-800 mb-1.5 leading-loose">
                      آپ کس موضوع پر بات کرنا چاہتے ہیں؟ <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <textarea id="post-topic" value={topic} onChange={(event) => setTopic(event.target.value)}
                        maxLength={220} rows={3}
                        placeholder="مثلاً: طلبہ کے لیے روزانہ مطالعے کی عادت کیسے بنائیں؟"
                        className="w-full px-3.5 py-3 pb-7 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm resize-none leading-loose" />
                      <span className="absolute bottom-2 left-3 text-[10px] text-slate-500">{topic.length}/220</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "پلیٹ فارم", value: platform, setter: (v: string) => setPlatform(v as SocialPlatform), options: SOCIAL_PLATFORMS.map((i) => [i.id, i.name] as const) },
                      { label: "زبان",      value: language, setter: (v: string) => setLanguage(v as typeof language), options: Object.entries(LANGUAGE_LABELS) },
                      { label: "مہم کا مقصد", value: goal,   setter: (v: string) => setGoal(v as typeof goal),     options: Object.entries(GOAL_LABELS) },
                      { label: "تحریر کا انداز", value: tone, setter: (v: string) => setTone(v as typeof tone),     options: Object.entries(TONE_LABELS) },
                    ].map((f) => (
                      <label key={f.label} className="block">
                        <span className="block text-xs text-slate-700 mb-1 font-medium leading-loose">{f.label}</span>
                        <select value={f.value} onChange={(event) => f.setter(event.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm">
                          {f.options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="post-cta" className="block text-sm font-medium text-slate-800 mb-1.5 leading-loose">
                      اختیاری دعوتِ عمل <small className="text-slate-500 font-normal">(اگر خالی چھوڑیں گے تو ایجنٹ تجویز کرے گا)</small>
                    </label>
                    <input id="post-cta" value={callToAction} onChange={(event) => setCallToAction(event.target.value)}
                      maxLength={160} placeholder="مثلاً: مزید جاننے کے لیے ویب سائٹ دیکھیں"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm" />
                  </div>
                  <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 leading-loose">
                      <Icon name="shield" size={14} /> محفوظ draft — ابھی شائع نہیں ہوگی
                    </span>
                    <button disabled={generating || topic.trim().length < 3}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition">
                      {generating ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> مواد تیار ہو رہا ہے…</>
                      ) : (
                        <><Icon name="spark" size={15} /> AI سے پوسٹ بنائیں <Icon name="arrow" size={14} /></>
                      )}
                    </button>
                  </div>
                </form>
              </article>

              <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] tracking-widest text-slate-500 font-semibold">LIVE PREVIEW</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5 leading-loose">کری ایٹو اسٹوڈیو</h2>
                  </div>
                  <button title="مزید معلومات"
                    onClick={() => setToast("Creative Agent visual direction دیتا ہے؛ اس build میں image-generation API منسلک نہیں۔")}
                    className="w-8 h-8 rounded-lg text-slate-600 hover:bg-emerald-50 flex items-center justify-center transition">
                    <Icon name="eye" size={15} />
                  </button>
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 via-green-700 to-teal-700 p-5 flex flex-col justify-between text-white">
                  <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
                  <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-green-300/25 blur-2xl" />
                  <div className="relative flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <i className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center text-[10px] font-black not-italic">IL</i>
                      <b className="text-xs font-bold">ILMORA<span className="text-green-200">786</span></b>
                    </span>
                    <span className="text-white/80">✦</span>
                  </div>
                  <div className="relative space-y-2">
                    <span className="block text-[9px] tracking-widest text-white/80 font-semibold">LEARN SOMETHING NEW</span>
                    <strong className="block text-lg font-bold leading-loose" dir="auto">
                      {(previewPost?.topic ?? topic) || "علم سے روشن ہو ہر قدم"}
                    </strong>
                    <i className="block text-[10px] text-white/80 not-italic">تعلیم · رہنمائی · ترقی</i>
                  </div>
                  <div className="relative flex items-center gap-2 text-[9px] tracking-widest text-white/70 font-semibold">
                    <span>ILMORA786</span>
                    <span className="flex-1 h-px bg-white/30" />
                    <span>GROW WITH KNOWLEDGE</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-white text-emerald-700 border border-emerald-200 flex items-center justify-center">
                    <Icon name="image" size={14} />
                  </span>
                  <div className="min-w-0">
                    <b className="block text-xs text-emerald-900 font-semibold">Visual direction</b>
                    <p className="text-xs text-slate-700 mt-0.5 leading-loose" dir="auto">
                      {previewPost?.visualDirection ?? "پوسٹ تیار ہونے پر آپ کے برانڈ کے مطابق تصویر کی ہدایت یہاں دکھائی دے گی۔"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> اردو متن</span>
                  <span className="inline-flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-green-600" /> برانڈ رنگ</span>
                  <span className="inline-flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-teal-600" /> موبائل کے لیے موزوں</span>
                </div>
              </aside>
            </section>

            {/* LIBRARY */}
            <section id="calendar" className="space-y-4">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] tracking-widest text-slate-500 font-semibold">
                    CONTENT LIBRARY <i className="mx-1 text-slate-300">·</i> APPROVAL QUEUE
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1 leading-loose">پوسٹس اور کیلنڈر</h2>
                  <p className="text-sm text-slate-700 mt-1 leading-loose">
                    ہر پوسٹ خود بخود نہیں شائع ہوگی؛ پہلے approve کریں یا WhatsApp پر دستی طور پر share کریں۔
                  </p>
                </div>
                <button onClick={() => void refreshPosts().then(() => setToast("پوسٹس تازہ ہوگئیں۔")).catch((error) => setToast(error.message))}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
                  <Icon name="refresh" size={15} /> تازہ کریں
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap p-2 rounded-2xl bg-white border border-slate-200">
                <div className="flex gap-1 p-1 rounded-xl bg-slate-50">
                  {filters.map((item) => (
                    <button key={item.id} onClick={() => setFilter(item.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        filter === item.id ? "bg-white text-emerald-800 shadow-sm border border-emerald-100" : "text-slate-600 hover:text-emerald-800"
                      }`}>
                      {item.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${filter === item.id ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition">
                  <Icon name="search" size={14} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)}
                    placeholder="موضوع تلاش کریں"
                    className="bg-transparent outline-none text-sm w-40 text-slate-800 placeholder:text-slate-400" />
                </label>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <Icon name="pen" size={22} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 leading-loose">
                    {posts.length === 0 ? "آپ کی پہلی پوسٹ کا انتظار ہے" : "اس فلٹر میں پوسٹ نہیں ملی"}
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-loose">
                    {posts.length === 0 ? "اوپر موضوع درج کرکے اپنا پہلا editable draft تیار کریں۔" : "مختلف filter منتخب کریں یا تلاش کے الفاظ تبدیل کریں۔"}
                  </p>
                  {posts.length === 0 && (
                    <button onClick={() => jumpTo("studio")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition">
                      <Icon name="plus" size={13} /> پوسٹ بنائیں
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} busy={busyPostId === post.id}
                      canPublish={!!connectionFor(post.platform)}
                      onCopy={copyPost} onWhatsApp={shareWhatsApp}
                      onApprove={(item) => void updatePost(item, { action: "approve" })}
                      onSchedule={openSchedule}
                      onRestore={(item) => void updatePost(item, { action: "back_to_draft" })}
                      onDelete={(item) => void handleDelete(item)}
                      onPublish={(item) => void handlePublish(item)} />
                  ))}
                </div>
              )}

              {posts.length > 0 && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-emerald-50 text-xs text-emerald-900 border border-emerald-100">
                  <Icon name="shield" size={14} />
                  <span className="leading-loose">شیڈول اس ایپ کے calendar میں محفوظ ہے۔ اصل auto-publishing کے لیے OAuth، platform approvals اور background scheduler اگلا مرحلہ ہیں۔</span>
                </div>
              )}
            </section>

            {/* WEEKLY CHART */}
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] tracking-widest text-slate-500 font-semibold">NEXT 7 DAYS</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1 leading-loose">اگلے سات دن</h2>
                  <p className="text-sm text-slate-700 mt-1 leading-loose">یہ چارٹ آپ کی drafts activity دکھاتا ہے — social engagement metrics نہیں۔</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <Icon name="clock" size={13} /> وقت: Asia/Karachi
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <b className="block text-sm text-slate-900">Draft activity</b>
                    <span className="text-xs text-slate-600">گزشتہ ہفتے میں بنائی گئی پوسٹس</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100">
                    <i className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> آپ کی library
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2 h-44" role="img" aria-label="روزانہ تیار ہونے والی پوسٹس کا چارٹ">
                  {chartDays.map((day, index) => (
                    <div key={`${index}-${day.date.toISOString()}`} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                      <span className="text-[10px] font-bold text-slate-800 h-4">{day.count || ""}</span>
                      <div className="flex-1 w-full flex items-end">
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-green-400 transition-all"
                          style={{ height: `${Math.max(day.count ? (day.count / maxChartCount) * 100 : 7, 7)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-600">{formatDay(day.date)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5"><i className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> تیار کردہ drafts</span>
                  <span>یہ حقیقی social-platform analytics نہیں ہے</span>
                </div>
              </div>
            </section>

            {/* ACTIVITY + ANALYTICS */}
            <section id="analytics" className="grid lg:grid-cols-2 gap-4">
              <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] tracking-widest text-slate-500 font-semibold">RECENT ACTIVITY</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5 leading-loose">حالیہ سرگرمی</h2>
                  </div>
                  <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full">{activities.length} حالیہ</span>
                </div>
                {activities.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-600">
                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <Icon name="clock" size={15} />
                    </span>
                    <div>
                      <b className="block text-xs text-slate-800 font-medium">ابھی کوئی سرگرمی نہیں</b>
                      <small className="text-[11px] leading-loose">آپ کا پہلا draft یہاں نظر آئے گا۔</small>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activities.slice(0, 6).map((activity, index) => {
                      const colorSets = [
                        { bg: "bg-emerald-100", text: "text-emerald-700" },
                        { bg: "bg-green-100",   text: "text-green-700" },
                        { bg: "bg-teal-100",    text: "text-teal-700" },
                        { bg: "bg-amber-100",   text: "text-amber-700" },
                      ];
                      const c = colorSets[index % colorSets.length];
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50/50 transition">
                          <span className={`w-8 h-8 shrink-0 rounded-lg ${c.bg} ${c.text} flex items-center justify-center`}>
                            <Icon name={
                              activity.action === "approved" ? "check"
                              : activity.action === "scheduled" ? "calendar"
                              : activity.action === "published" ? "external"
                              : "spark"
                            } size={13} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <b className="block text-xs text-slate-900 font-medium">{activityLabels[activity.action] ?? "ٹیم سرگرمی"}</b>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-loose">{activity.message}</p>
                          </div>
                          <time className="text-[10px] text-slate-500 shrink-0">{formatDateTime(activity.createdAt)}</time>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-6 text-white space-y-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <Icon name="chart" size={20} />
                </div>
                <span className="block text-[10px] tracking-widest text-white/70 font-semibold">ANALYTICS AGENT</span>
                <h2 className="text-xl font-bold leading-loose">نتائج سے سیکھیں</h2>
                <p className="text-sm text-white/80 leading-loose">
                  Reach، clicks اور sign-ups دکھانے کے لیے متعلقہ پلیٹ فارم کے analytics API اور آپ کی ویب سائٹ کے conversion events منسلک ہونے چاہییں۔
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/80">
                    <i className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Metrics connection pending
                  </span>
                  <button onClick={() => jumpTo("channels")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-white hover:text-emerald-200 transition">
                    کنکشن دیکھیں <Icon name="arrow" size={12} />
                  </button>
                </div>
              </article>
            </section>

            {/* CHANNELS */}
            <section id="channels" className="space-y-4">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] tracking-widest text-slate-500 font-semibold">OFFICIAL CHANNELS ONLY</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1 leading-loose">اکاؤنٹس اور کنکشن</h2>
                  <p className="text-sm text-slate-700 mt-1 leading-loose">کنکشن دستیاب نہیں تو ایجنٹ مواد تیار کرے گا، مگر آپ کی طرف سے شائع نہیں کرے گا۔</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
                  connections.length > 0
                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                    : "text-slate-700 bg-white border-slate-200"
                }`}>
                  <i className={`w-1.5 h-1.5 rounded-full ${connections.length > 0 ? "bg-emerald-600" : "bg-slate-400"}`} />
                  {connections.length} اکاؤنٹس منسلک
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SOCIAL_PLATFORMS.map((channel) => {
                  const conn = connectionFor(channel.id);
                  return (
                    <article key={channel.id} className={`bg-white border rounded-2xl p-4 space-y-3 transition ${
                      conn ? "border-emerald-300 shadow-sm shadow-emerald-100/60" : "border-slate-200 hover:shadow-md hover:shadow-emerald-100/50 hover:border-emerald-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
                          style={{ backgroundColor: channel.color }}>
                          {channel.short}
                        </span>
                        {conn ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <i className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> منسلک
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                            <i className="w-1.5 h-1.5 rounded-full bg-slate-400" /> کنکشن درکار
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 leading-loose">{channel.name}</h3>
                        {conn && conn.accountName && (
                          <p className="text-[11px] text-emerald-700 mt-0.5 truncate">{conn.accountName}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-loose">
                        {channel.id === "whatsapp" ? "Business API؛ گروپ میں خودکار ارسال نہیں۔"
                          : channel.id === "facebook" || channel.id === "instagram" ? "Meta OAuth اور Page/Professional اجازت۔"
                          : "OAuth اور آفیشل publishing API۔"}
                      </p>
                      <button onClick={() => setConnection(channel.id)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          conn
                            ? "border border-emerald-200 text-emerald-800 bg-emerald-50/40 hover:bg-emerald-50"
                            : "border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200"
                        }`}>
                        <Icon name={conn ? "settings" : "link"} size={13} />
                        {conn ? "انتظام دیکھیں" : "کنکشن گائیڈ"}
                        <Icon name="chevron" size={12} />
                      </button>
                    </article>
                  );
                })}
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 text-white">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon name="shield" size={16} />
                </span>
                <div className="flex-1">
                  <b className="block text-sm font-semibold">ٹوکَنز محفوظ رکھیں</b>
                  <p className="text-xs text-white/80 mt-1 leading-loose">
                    OAuth access tokens صرف server-side encrypted storage میں رکھیں۔ انہیں browser، posts یا GitHub میں کبھی شامل نہ کریں۔
                  </p>
                </div>
                <span className="text-[9px] tracking-widest text-white/60 font-semibold shrink-0 self-start mt-1">SECURE BY DESIGN</span>
              </div>
            </section>

            <footer className="flex items-center justify-between gap-3 flex-wrap text-xs text-slate-600 pt-4 border-t border-slate-200">
              <span>© ILMORA786 AI Social Team</span>
              <span className="inline-flex items-center gap-1.5 leading-loose">
                <i className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Draft mode <b className="text-slate-300">·</b> کوئی پوسٹ خودکار طور پر شائع نہیں ہوئی
              </span>
              <button onClick={() => setToast("اس build میں صرف approved پوسٹوں کو دستی طور پر شائع کیا جا سکتا ہے — خودکار شیڈولنگ بعد میں۔")}
                className="inline-flex items-center gap-1 hover:text-emerald-800">
                <Icon name="shield" size={12} /> سیکیورٹی نوٹ
              </button>
            </footer>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm shadow-2xl shadow-slate-900/30 max-w-md border border-emerald-500/30">
          <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Icon name="check" size={13} />
          </span>
          <span className="flex-1 leading-loose">{toast}</span>
          <button onClick={() => setToast("")} aria-label="بند کریں"
            className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition">
            <Icon name="close" size={13} />
          </button>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {schedulePost && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSchedulePost(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="schedule-heading"
            className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Icon name="calendar" size={18} />
              </span>
              <button onClick={() => setSchedulePost(null)} aria-label="بند کریں"
                className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition">
                <Icon name="close" size={16} />
              </button>
            </div>
            <span className="text-[10px] tracking-widest text-slate-500 font-semibold">INTERNAL CONTENT CALENDAR</span>
            <h2 id="schedule-heading" className="text-xl font-bold text-slate-900 leading-loose">پوسٹ شیڈول کریں</h2>
            <p className="text-sm text-slate-600 leading-loose">
              یہ وقت آپ کے calendar میں محفوظ ہوگا۔ پلیٹ فارم سے کنکشن کے بغیر پوسٹ خود publish نہیں ہوگی۔
            </p>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label htmlFor="schedule-at" className="block text-sm font-medium text-slate-800 mb-1.5 leading-loose">تاریخ اور وقت</label>
                <input id="schedule-at" type="datetime-local" value={scheduleValue}
                  onChange={(event) => setScheduleValue(event.target.value)}
                  min={toLocalDateTimeInput(new Date(Date.now() + 60_000))} required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: platformFor(schedulePost.platform).color }}>
                  {platformFor(schedulePost.platform).short}
                </span>
                <div className="min-w-0">
                  <b className="block text-sm text-slate-900 truncate">{schedulePost.title}</b>
                  <small className="text-xs text-slate-600">
                    {platformFor(schedulePost.platform).name} · {schedulePost.status === "approved" ? "منظور شدہ" : "draft"}
                  </small>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setSchedulePost(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 hover:bg-slate-50 transition">
                  واپس
                </button>
                <button disabled={busyPostId === schedulePost.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-sm font-medium disabled:opacity-50 transition">
                  <Icon name="calendar" size={14} /> کیلنڈر میں محفوظ کریں
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* CONNECTION MODAL */}
      {selectedConnection && activeGuide && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setConnection(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="connection-heading"
            className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: selectedConnection.color }}>
                {selectedConnection.short}
              </span>
              <button onClick={() => setConnection(null)} aria-label="بند کریں"
                className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition">
                <Icon name="close" size={16} />
              </button>
            </div>
            <span className="text-[10px] tracking-widest text-slate-500 font-semibold">OFFICIAL API SETUP GUIDE</span>
            <h2 id="connection-heading" className="text-xl font-bold text-slate-900 leading-loose">{activeGuide.title}</h2>

            {selectedIsConnected ? (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
                <Icon name="check" size={16} />
                <p className="flex-1 leading-loose">
                  <b className="block font-semibold">یہ اکاؤنٹ منسلک ہے</b>
                  <span className="text-xs">{selectedIsConnected.accountName ?? selectedIsConnected.accountId}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 leading-loose">
                یہ checklist اگلے مرحلے کی مکمل رہنمائی ہے۔ "ابھی Connect کریں" دبانے پر آپ {selectedConnection.name} کی اجازت کے صفحے پر جائیں گے — منظوری کے بعد آپ کا Page خود بخود محفوظ ہو جائے گا۔
              </p>
            )}

            <ol className="space-y-2">
              {activeGuide.steps.map((step) => (
                <li key={step} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/50 text-sm text-slate-800 border border-emerald-100">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mt-0.5">
                    <Icon name="check" size={13} />
                  </span>
                  <span className="leading-loose">{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <Icon name="shield" size={15} />
              <p className="flex-1 leading-loose">{activeGuide.note}</p>
            </div>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <button onClick={() => setConnection(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 hover:bg-slate-50 transition">
                بند کریں
              </button>
              <button onClick={() => {
                void navigator.clipboard?.writeText(activeGuide.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")).catch(() => undefined);
                setToast("Setup checklist کاپی کرنے کی کوشش کی گئی۔");
              }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-50 transition">
                Checklist کاپی <Icon name="copy" size={13} />
              </button>
              <a href={`/api/social/connect/${selectedConnection.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 transition">
                <Icon name="link" size={14} /> {selectedIsConnected ? "دوبارہ منسلک کریں" : "ابھی Connect کریں"}
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}