/* ============================================================
   RECOMMENDATION ENGINE
   YouTube جیسا algorithm — user کی دلچسپی کے مطابق articles
   ============================================================ */

export type UserProfile = {
  categories: Record<string, number>;
  languages: Record<string, number>;
  readSlugs: string[];
  lastUpdated: number;
};

export const PROFILE_COOKIE = 'user_interests';
const MAX_READ_SLUGS = 30;

/* ============================================================
   PROFILE MANAGEMENT
   ============================================================ */

export function emptyProfile(): UserProfile {
  return {
    categories: {},
    languages: {},
    readSlugs: [],
    lastUpdated: Date.now(),
  };
}

export function parseProfile(raw?: string | null): UserProfile {
  if (!raw) return emptyProfile();
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      categories:
        parsed && typeof parsed.categories === 'object'
          ? parsed.categories
          : {},
      languages:
        parsed && typeof parsed.languages === 'object'
          ? parsed.languages
          : {},
      readSlugs: Array.isArray(parsed.readSlugs) ? parsed.readSlugs : [],
      lastUpdated:
        typeof parsed.lastUpdated === 'number'
          ? parsed.lastUpdated
          : Date.now(),
    };
  } catch {
    return emptyProfile();
  }
}

export function serializeProfile(profile: UserProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export function updateProfile(
  profile: UserProfile,
  opts: { category: string; language: string; slug: string }
): UserProfile {
  const next: UserProfile = {
    categories: { ...profile.categories },
    languages: { ...profile.languages },
    readSlugs: [...profile.readSlugs],
    lastUpdated: Date.now(),
  };

  // Category count
  if (opts.category) {
    next.categories[opts.category] =
      (next.categories[opts.category] || 0) + 1;
  }

  // Language count
  if (opts.language) {
    next.languages[opts.language] =
      (next.languages[opts.language] || 0) + 1;
  }

  // Read slugs — dedupe + cap
  next.readSlugs = [
    opts.slug,
    ...next.readSlugs.filter((s) => s !== opts.slug),
  ].slice(0, MAX_READ_SLUGS);

  return next;
}

/* ============================================================
   SCORING
   ============================================================ */

type LeanArticle = {
  _id: unknown;
  slug: string;
  category: string;
  language: string;
  uniqueViews?: number;
  views?: number;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
};

export type ScoreOptions = {
  trending?: boolean;
  weightOverrides?: Partial<{
    recency: number;
    popularity: number;
    interest: number;
    language: number;
    readPenalty: number;
    trendingBonus: number;
  }>;
};

export function scoreArticle(
  article: LeanArticle,
  profile: UserProfile,
  options: ScoreOptions = {}
): number {
  const w = {
    recency: 0.25,
    popularity: 0.22,
    interest: 0.28,
    language: 0.15,
    readPenalty: -0.35,
    trendingBonus: 0.15,
    ...options.weightOverrides,
  };

  const now = Date.now();
  const createdTs = new Date(
    article.publishedAt || article.createdAt
  ).getTime();
  const daysOld = Math.max(0, (now - createdTs) / (1000 * 60 * 60 * 24));

  /* 1️⃣ Recency — 30 دن کی half-life */
  const recency = Math.max(0, 1 - daysOld / 30);

  /* 2️⃣ Popularity — log scale (1000+ views = max) */
  const views = article.uniqueViews || article.views || 0;
  const popularity = Math.min(1, Math.log10(views + 1) / 3);

  /* 3️⃣ Interest — user کی category history */
  const totalCat = Object.values(profile.categories).reduce(
    (a, b) => a + b,
    0
  );
  const catHits = profile.categories[article.category] || 0;
  const interest = totalCat
    ? Math.min(1, catHits / Math.max(1, totalCat / 2))
    : 0;

  /* 4️⃣ Language preference */
  const totalLang = Object.values(profile.languages).reduce(
    (a, b) => a + b,
    0
  );
  const langHits = profile.languages[article.language] || 0;
  const language = totalLang
    ? Math.min(1, langHits / Math.max(1, totalLang / 2))
    : 0;

  /* 5️⃣ Already read — penalty */
  const readPenalty = profile.readSlugs.includes(article.slug)
    ? w.readPenalty
    : 0;

  /* 6️⃣ Trending bonus */
  const trendingBonus = options.trending ? w.trendingBonus : 0;

  return (
    recency * w.recency +
    popularity * w.popularity +
    interest * w.interest +
    language * w.language +
    trendingBonus +
    readPenalty
  );
}

/* ============================================================
   SORT + DIVERSITY
   ============================================================ */

export function sortByScore<T extends LeanArticle>(
  articles: T[],
  profile: UserProfile,
  options: ScoreOptions = {}
): Array<T & { _score: number }> {
  const scored = articles.map((a) => ({
    ...a,
    _score: scoreArticle(a, profile, options),
  }));

  scored.sort((a, b) => b._score - a._score);

  // ✅ Diversity: same category ایک ساتھ زیادہ نہ آئے
  const result: typeof scored = [];
  const recentCategories: string[] = [];
  const remaining = [...scored];

  while (remaining.length > 0) {
    // پہلے 3 میں سے کوئی ایسا نکالیں جس کا category recent میں نہ ہو
    const recentSet = new Set(recentCategories.slice(0, 3));
    let pickIndex = 0;

    for (let i = 0; i < Math.min(5, remaining.length); i++) {
      if (!recentSet.has(remaining[i].category)) {
        pickIndex = i;
        break;
      }
    }

    const [picked] = remaining.splice(pickIndex, 1);
    result.push(picked);
    recentCategories.unshift(picked.category);

    if (recentCategories.length > 5) recentCategories.pop();
  }

  return result;
}