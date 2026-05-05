"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  MessageSquare,
  Search,
  Eye,
  X,
  Loader2,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Bot,
} from "lucide-react";

const supabase = getSupabaseBrowserClient();

interface HotelInfo {
  id: string;
  name: string;
  slug: string;
}

interface SessionRow {
  id: string;
  guest_name: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface TranscriptMessage {
  id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [search, setSearch] = useState("");

  // Transcript modal
  const [viewingSession, setViewingSession] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptMeta, setTranscriptMeta] = useState<{
    guest_name: string | null;
    created_at: string;
  } | null>(null);

  const fetchSessions = useCallback(async (hotelId: string) => {
    try {
      const res = await fetch(`/api/admin/chats?hotelId=${hotelId}`);
      if (res.ok) setSessions(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/admin/hotels");
        if (res.status === 401) {
          router.push("/login?redirect=/admin/chats");
          return;
        }
        const hotels = await res.json();
        if (Array.isArray(hotels) && hotels.length > 0) {
          setHotel(hotels[0]);
          await fetchSessions(hotels[0].id);
        } else {
          router.push("/admin/onboarding");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, fetchSessions]);

  async function openTranscript(sessionId: string) {
    setViewingSession(sessionId);
    setTranscriptLoading(true);
    setTranscript([]);
    setTranscriptMeta(null);
    try {
      const res = await fetch(`/api/admin/chats/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setTranscript(data.messages);
        setTranscriptMeta(data.session);
      }
    } catch {
      // ignore
    } finally {
      setTranscriptLoading(false);
    }
  }

  const filtered = sessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.guest_name ?? "Guest").toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

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
              <p className="text-xs text-slate-400">سجل المحادثات</p>
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
              href="/admin/settings"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              الإعدادات
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">
                جلسات المحادثة
              </h2>
              <span className="text-xs text-slate-500 ml-1">
                {sessions.length} إجمالي
              </span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم الضيف..."
                className="pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500 w-64"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {sessions.length === 0
                  ? "لا توجد جلسات محادثة بعد. ستظهر محادثات الضيوف هنا."
                  : "لا توجد جلسات تطابق بحثك."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="pb-3 text-xs font-medium text-slate-500 tracking-wider">
                      الضيف
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 tracking-wider">
                      بدأت
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 tracking-wider">
                      آخر نشاط
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 tracking-wider text-center">
                      الرسائل
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 tracking-wider text-left">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-slate-200 font-medium">
                            {s.guest_name || "ضيف"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {new Date(s.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {new Date(s.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {s.message_count}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openTranscript(s.id)}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/30 text-indigo-400 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Transcript Modal */}
      {viewingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white">
                  سجل المحادثة
                </h3>
                {transcriptMeta && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {transcriptMeta.guest_name || "ضيف"} ·{" "}
                    {new Date(transcriptMeta.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingSession(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {transcriptLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : transcript.length === 0 ? (
                <p className="text-center py-16 text-slate-500 text-sm">
                  لا توجد رسائل في هذه الجلسة.
                </p>
              ) : (
                transcript.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                      }`}
                    >
                      {m.role === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-100 rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
