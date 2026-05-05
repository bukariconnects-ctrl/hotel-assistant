"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Settings,
  Save,
  Loader2,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const supabase = getSupabaseBrowserClient();

interface HotelInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  welcome_message: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  status: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    async function loadHotel() {
      try {
        const res = await fetch("/api/admin/hotels");
        if (res.status === 401) {
          router.push("/login?redirect=/admin/settings");
          return;
        }
        const hotels = await res.json();
        if (Array.isArray(hotels) && hotels.length > 0) {
          const h = hotels[0] as HotelInfo;
          setHotel(h);
          setName(h.name);
          setDescription(h.description ?? "");
          setWelcomeMessage(h.welcome_message ?? "");
          setContactPhone(h.contact_phone ?? "");
          setWebsite(h.website ?? "");
          setLocation(h.location ?? "");
        } else {
          router.push("/admin/onboarding");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadHotel();
  }, [router]);

  async function handleSave() {
    if (!hotel || !name.trim()) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/hotels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: hotel.id,
          name: name.trim(),
          description: description.trim() || null,
          welcomeMessage: welcomeMessage.trim() || null,
          contactPhone: contactPhone.trim() || null,
          website: website.trim() || null,
          location: location.trim() || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setHotel({ ...hotel, ...updated });
        setToast({ type: "success", message: "تم حفظ الإعدادات بنجاح." });
      } else {
        const err = await res.json();
        setToast({ type: "error", message: err.error || "فشل في الحفظ." });
      }
    } catch {
      setToast({ type: "error", message: "خطأ في الشبكة." });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!hotel) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                H
              </div>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">{hotel.name}</h1>
              <p className="text-xs text-slate-400">/chat/{hotel.slug} · الإعدادات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              لوحة التحكم
            </Link>
            <Link
              href={`/chat/${hotel.slug}`}
              target="_blank"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              فتح المحادثة
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">إعدادات الفندق</h2>
          </div>

          <div className="space-y-5">
            {/* Hotel Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                اسم الفندق
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثل: فندق القصر الكبير"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                الوصف
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر لفندقك..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500 resize-none"
              />
            </div>

            {/* Welcome Message */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                رسالة الترحيب
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="مثل: مرحباً بك في فندق القصر! كيف يمكنني مساعدتك؟"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500 resize-none"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                ستظهر هذه الرسالة للضيوف عند فتح المحادثة لأول مرة. اتركها فارغة للترحيب الافتراضي.
              </p>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                هاتف التواصل
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +966 12 345 6789"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                الموقع الإلكتروني
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="مثل: https://www.myhotel.com"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                الموقع
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثل: الرياض، المملكة العربية السعودية"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
              />
            </div>

            {/* Slug (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                الرابط
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">/chat/</span>
                <input
                  type="text"
                  value={hotel.slug}
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                لا يمكن تغيير الرابط بعد الإنشاء.
              </p>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ الإعدادات
                </>
              )}
            </button>

            {/* Toast */}
            {toast && (
              <div
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${
                  toast.type === "success"
                    ? "bg-green-950 border-green-800 text-green-300"
                    : "bg-red-950 border-red-800 text-red-300"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {toast.message}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
