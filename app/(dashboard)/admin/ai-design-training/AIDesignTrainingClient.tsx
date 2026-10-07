"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  Trash2,
  Power,
  Image as ImageIcon,
  Sparkles,
  Search,
  RefreshCw,
} from "lucide-react";

type Item = {
  _id: string;
  title: string;
  assetType: string;
  imageUrl: string;
  tags: string[];
  styleDescription?: string;
  aiInstructions?: string;
  isActive: boolean;
  width?: number;
  height?: number;
};

const TYPES = [
  ["calligraphy", "خطاطی"],
  ["poster", "مکمل اشتہار"],
  ["frame", "فریم / بارڈر"],
  ["background", "بیک گراؤنڈ"],
  ["ornament", "اسلامی نقش"],
  ["logo", "لوگو"],
  ["template", "ٹیمپلیٹ"],
  ["other", "دیگر"],
];

export default function AIDesignTrainingClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    assetType: "calligraphy",
    tags: "",
    styleDescription: "",
    aiInstructions: "",
  });

  async function loadItems() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/ai-designs?q=${encodeURIComponent(query)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (data.success) setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function upload() {
    if (!selectedFile) {
      alert("پہلے PNG/JPG/WebP فائل منتخب کریں۔");
      return;
    }

    if (!form.title.trim()) {
      alert("ڈیزائن کا نام لکھیں۔");
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();

      data.append("file", selectedFile);
      data.append("title", form.title);
      data.append("assetType", form.assetType);
      data.append("tags", form.tags);
      data.append("styleDescription", form.styleDescription);
      data.append("aiInstructions", form.aiInstructions);

      const response = await fetch("/api/admin/ai-designs", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed.");
      }

      setForm({
        title: "",
        assetType: "calligraphy",
        tags: "",
        styleDescription: "",
        aiInstructions: "",
      });

      setSelectedFile(null);

      const input = document.getElementById(
        "ai-reference-file"
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      await loadItems();
      alert("ڈیزائن AI لائبریری میں محفوظ ہوگیا۔");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function toggle(item: Item) {
    const response = await fetch(`/api/admin/ai-designs/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });

    if (response.ok) loadItems();
  }

  async function remove(item: Item) {
    if (!confirm(`"${item.title}" کو حذف کرنا چاہتے ہیں؟`)) return;

    const response = await fetch(`/api/admin/ai-designs/${item._id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.error || "Delete failed.");
      return;
    }

    loadItems();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                <Sparkles className="h-4 w-4" />
                ILMORA786 AI
              </div>

              <h1 className="text-2xl font-bold sm:text-4xl">
                AI Design Knowledge Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-50">
                یہاں اپنے بہترین اسلامی پوسٹر، خطاطی، فریم اور ڈیزائن نمونے
                شامل کریں۔ AI مستقبل کے ڈیزائن بناتے وقت فعال نمونوں کو بطور
                Reference استعمال کرے گا۔
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-center">
              <p className="text-3xl font-black">{items.length}</p>
              <p className="text-xs text-emerald-100">Design References</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                نیا ڈیزائن شامل کریں
              </h2>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  ڈیزائن کا نام
                </span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500"
                  placeholder="مثلاً: خطیب اسلام خطاطی"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  قسم
                </span>
                <select
                  value={form.assetType}
                  onChange={(e) =>
                    setForm({ ...form, assetType: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                >
                  {TYPES.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  PNG / JPG / WebP
                </span>
                <input
                  id="ai-reference-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] || null)
                  }
                  className="w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3 text-sm"
                />
              </label>

              {selectedFile && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  {selectedFile.name} —{" "}
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Tags
                </span>
                <input
                  value={form.tags}
                  onChange={(e) =>
                    setForm({ ...form, tags: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="اسلامی, نستعلیق, جلسہ, سبز, سنہری"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Design Style
                </span>
                <textarea
                  value={form.styleDescription}
                  onChange={(e) =>
                    setForm({ ...form, styleDescription: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="مثلاً: روایتی پاکستانی اسلامی اشتہار، مرکزی سرخ دائرہ، سنہری آرائش، سفید پس منظر..."
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  AI کے لیے خصوصی ہدایت
                </span>
                <textarea
                  value={form.aiInstructions}
                  onChange={(e) =>
                    setForm({ ...form, aiInstructions: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="مثلاً: مرکزی عنوان کے لیے اس خطاطی کے وزن اور کشیدہ انداز سے رہنمائی لیں۔"
                />
              </label>

              <button
                type="button"
                onClick={upload}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    AI Library میں شامل کریں
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Design Reference Library
                </h2>
                <p className="text-sm text-slate-500">
                  Active نمونے AI generation میں استعمال ہوسکتے ہیں۔
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadItems();
                    }}
                    className="w-48 rounded-xl border border-slate-300 py-2 pl-3 pr-9 text-sm"
                    placeholder="تلاش..."
                  />
                </div>

                <button
                  onClick={loadItems}
                  className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center text-slate-400">
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-600">
                  ابھی کوئی Reference موجود نہیں
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <article
                    key={item._id}
                    className={`overflow-hidden rounded-2xl border ${
                      item.isActive
                        ? "border-emerald-200"
                        : "border-slate-200 opacity-60"
                    } bg-white`}
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-contain"
                      />

                      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">
                        {item.assetType}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-slate-900">
                        {item.title}
                      </h3>

                      {item.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.slice(0, 6).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.aiInstructions && (
                        <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                          {item.aiInstructions}
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => toggle(item)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {item.isActive ? "Active" : "Disabled"}
                        </button>

                        <button
                          onClick={() => remove(item)}
                          className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
