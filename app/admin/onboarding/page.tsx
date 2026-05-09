"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const CATEGORIES = [
    { value: "hotel", label: "فندق" },
    { value: "hospital", label: "مستشفى" },
    { value: "university", label: "جامعة" },
    { value: "restaurant", label: "مطعم" },
    { value: "school", label: "مدرسة" },
    { value: "clinic", label: "عيادة" },
    { value: "government", label: "جهة حكومية" },
    { value: "company", label: "شركة" },
    { value: "general", label: "أخرى" },
  ];

  function handleSlugChange(value: string) {
    const sanitized = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(sanitized);

    if (sanitized && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(sanitized)) {
      setSlugError("استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط");
    } else {
      setSlugError(null);
    }
  }

  function autoGenerateSlug(orgName: string) {
    const auto = orgName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(auto);
    setSlugError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !slug.trim()) {
      setError("اسم المؤسسة والرابط مطلوبان");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          description: description.trim() || undefined,
          category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "فشل في إنشاء المؤسسة");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("خطأ في الشبكة. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <span className="text-xl font-bold text-white">مؤسسة ذكية</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">إعداد مؤسستك</h1>
          <p className="text-sm text-slate-400 mt-1">
            أنشئ ملف مؤسستك لبدء استخدام المساعد الذكي
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              نوع المؤسسة <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              اسم المؤسسة <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) autoGenerateSlug(e.target.value);
              }}
              required
              placeholder="مثال: جامعة تعز، مستشفى الأمل..."
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              رابط URL <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-3 rounded-l-lg bg-slate-900 border border-r-0 border-slate-700 text-slate-500 text-sm">
                /chat/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                placeholder="grand-plaza"
                className="flex-1 px-4 py-3 rounded-r-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {slugError && (
              <p className="text-xs text-red-400 mt-1">{slugError}</p>
            )}
            {slug && !slugError && (
              <p className="text-xs text-slate-500 mt-1">
                رابط المحادثة: <span className="text-indigo-400">/chat/{slug}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              الوصف <span className="text-slate-600">(اختياري)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر عن مؤسستك..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!slugError}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold transition-colors"
          >
            {loading ? "جاري إنشاء المؤسسة..." : "إنشاء المؤسسة والمتابعة"}
          </button>
        </form>
      </div>
    </div>
  );
}
