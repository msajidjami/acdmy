"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  WandSparkles,
  Image as ImageIcon,
  Loader2,
  Download,
  CheckCircle2,
} from "lucide-react";

type Reference = {
  _id: string;
  title: string;
  assetType: string;
  imageUrl: string;
  tags: string[];
};

export default function AIDesignStudioClient() {
  const [prompt, setPrompt] = useState("");
  const [references, setReferences] = useState<Reference[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/admin/ai-designs?active=true")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.success) setReferences(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoadingRefs(false));
  }, []);

  function toggleReference(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length >= 4
        ? current
        : [...current, id]
    );
  }

  async function generate() {
    if (prompt.trim().length < 8) {
      alert("اشتہار کی تفصیل لکھیں۔");
      return;
    }

    setGenerating(true);
    setResult("");

    try {
      const response = await fetch("/api/ai-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          referenceIds: selected,
          aspectRatio: "3:4",
          imageSize: "2K",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Generation failed.");
      }

      setResult(data.imageUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <section className="border-b border-white/10 bg-gradient-to-br from-emerald-950 via-slate-950 to-black">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
            <Sparkles className="h-4 w-4" />
            ILMORA786 AI Studio
          </div>

          <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
            اپنا خیال لکھیں،
            <span className="text-emerald-400"> اسلامی اشتہار بنائیں</span>
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            اردو، عربی یا Roman Urdu میں اپنی ضرورت بیان کریں۔ ILMORA AI
            اسلامی ڈیزائن کی مناسبت سے مکمل اشتہار تیار کرے گا۔
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2">
              <WandSparkles className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold">Advertisement Prompt</h2>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={9}
              className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
              placeholder={`مثلاً:

جامعہ اسلامیہ خلفاء راشدین کے سالانہ جلسہ دستار بندی کے لیے ایک پروفیشنل اسلامی اشتہار بنائیں۔ مرکزی عنوان نمایاں ہو، سبز، سرخ اور سنہری رنگ استعمال ہوں، روایتی پاکستانی اسلامی خطاطی، خوبصورت آرائشی فریم اور نفیس پس منظر ہو۔ تاریخ، وقت، مقام اور مہمان خصوصی کی معلومات واضح حصوں میں رکھی جائیں۔`}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "اسلامی جلسہ",
                "قرآن اکیڈمی داخلہ",
                "ختم قرآن",
                "دستار بندی",
                "جمعہ پروگرام",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() =>
                    setPrompt(
                      `${example} کے لیے ایک خوبصورت، روایتی پاکستانی اسلامی اشتہار بنائیں۔ سبز، سنہری اور کریم رنگ، نفیس اسلامی فریم، خوبصورت اردو خطاطی اور واضح معلوماتی لے آؤٹ استعمال کریں۔`
                    )
                  }
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                >
                  {example}
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={generating}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI اشتہار تیار کر رہا ہے...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  اشتہار تیار کریں
                </>
              )}
            </button>

            {result && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-emerald-400/20 bg-black/30">
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    اشتہار تیار ہے
                  </div>

                  <a
                    href={result}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
                  >
                    <Download className="h-4 w-4" />
                    Open
                  </a>
                </div>

                <img
                  src={result}
                  alt="Generated Islamic advertisement"
                  className="mx-auto block max-h-[900px] w-full object-contain"
                />
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4">
              <h2 className="font-bold">Design References</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                زیادہ سے زیادہ 4 نمونے منتخب کریں۔ Admin کی Design Knowledge
                Library سے نمونے یہاں آ سکتے ہیں۔
              </p>
            </div>

            {loadingRefs ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading...
              </div>
            ) : references.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  ابھی کوئی فعال Reference موجود نہیں۔
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {references.map((reference) => {
                  const active = selected.includes(reference._id);

                  return (
                    <button
                      key={reference._id}
                      onClick={() => toggleReference(reference._id)}
                      className={`w-full overflow-hidden rounded-2xl border text-right transition ${
                        active
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-white/10 bg-black/20 hover:border-white/20"
                      }`}
                    >
                      <div className="flex gap-3 p-2">
                        <img
                          src={reference.imageUrl}
                          alt={reference.title}
                          className="h-20 w-16 rounded-xl bg-white object-contain"
                        />

                        <div className="min-w-0 flex-1 py-1">
                          <p className="truncate text-sm font-bold">
                            {reference.title}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {reference.assetType}
                          </p>

                          {active && (
                            <span className="mt-2 inline-flex rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-black text-slate-950">
                              SELECTED
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
