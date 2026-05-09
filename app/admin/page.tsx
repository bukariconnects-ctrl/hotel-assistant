"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  FileText,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Loader2,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  Settings,
  X,
  Database,
  Layers,
  MessagesSquare,
} from "lucide-react";

const supabase = getSupabaseBrowserClient();

const CATEGORIES = ["Policy", "Menu", "Services", "Guide", "General"] as const;
type Category = (typeof CATEGORIES)[number];

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  status: string;
}

interface DocRecord {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  category: string | null;
  created_at: string;
}

interface UploadResult {
  success: boolean;
  documentId?: string;
  fileName?: string;
  chunksProcessed?: number;
  totalCharacters?: number;
  error?: string;
}

interface UploadStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
}

const INITIAL_STEPS: UploadStep[] = [
  { label: "التحقق من الملف والفندق", status: "pending" },
  { label: "استخراج النص من PDF", status: "pending" },
  { label: "تقسيم وتوليد التضمينات", status: "pending" },
  { label: "الحفظ في قاعدة البيانات", status: "pending" },
];

export default function AdminPage() {
  const router = useRouter();
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<Category>("General");
  const [steps, setSteps] = useState<UploadStep[]>(INITIAL_STEPS);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Documents table state
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<DocRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState<{ totalDocuments: number; totalSections: number; totalChatSessions: number } | null>(null);

  // Recent Activity
  const [recentSessions, setRecentSessions] = useState<Array<{
    id: string;
    guest_name: string | null;
    updated_at: string;
    message_count: number;
  }>>([]);

  // Insights
  const [insights, setInsights] = useState<{
    topics: string[];
    summary: string;
    totalAnalyzed: number;
  } | null>(null);

  const fetchDocuments = useCallback(async (orgId: string) => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/admin/documents?orgId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  const fetchStats = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/admin/stats?orgId=${orgId}`);
      if (res.ok) setStats(await res.json());
    } catch {
      // ignore
    }
  }, []);

  const fetchRecentActivity = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/admin/chats?orgId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data.slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchInsights = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/admin/stats/insights?orgId=${orgId}`);
      if (res.ok) setInsights(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/admin/organizations");
        if (res.status === 401) {
          router.push("/login?redirect=/admin");
          return;
        }
        const orgs = await res.json();
        if (Array.isArray(orgs) && orgs.length > 0) {
          setOrg(orgs[0]);
          fetchDocuments(orgs[0].id);
          fetchStats(orgs[0].id);
          fetchRecentActivity(orgs[0].id);
          fetchInsights(orgs[0].id);
        } else {
          router.push("/admin/onboarding");
          return;
        }
      } catch {
        // Network error
      } finally {
        setLoadingOrg(false);
      }
    }
    loadOrg();
  }, [router, fetchDocuments, fetchStats, fetchRecentActivity, fetchInsights]);

  function resetState() {
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));
    setResult(null);
  }

  function handleFileChange(file: File | null) {
    if (file && file.type !== "application/pdf") {
      alert("يتم دعم ملفات PDF فقط.");
      return;
    }
    setSelectedFile(file);
    resetState();
  }

  function setStepStatus(index: number, status: UploadStep["status"]) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleUpload() {
    if (!selectedFile || !org) return;

    setIsUploading(true);
    resetState();

    try {
      setStepStatus(0, "active");
      await new Promise((r) => setTimeout(r, 300));
      setStepStatus(0, "done");

      setStepStatus(1, "active");
      await new Promise((r) => setTimeout(r, 300));
      setStepStatus(1, "done");

      setStepStatus(2, "active");
      setStepStatus(3, "active");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("orgId", org.id);
      formData.append("category", category);

      const response = await fetch("/api/admin/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResult = await response.json();

      if (!response.ok || !data.success) {
        setStepStatus(2, "error");
        setStepStatus(3, "error");
        setResult({ success: false, error: data.error ?? "Upload failed" });
      } else {
        setStepStatus(2, "done");
        setStepStatus(3, "done");
        setResult(data);
        setSelectedFile(null);
        fetchDocuments(org.id);
      }
    } catch (err) {
      setStepStatus(2, "error");
      setStepStatus(3, "error");
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleToggleStatus(doc: DocRecord) {
    if (!org) return;
    const newStatus = doc.status === "ready" ? "inactive" : "ready";
    setTogglingId(doc.id);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus } : d))
        );
      }
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !org) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/documents/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loadingOrg) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!org) return null;

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
              <h1 className="text-lg font-semibold text-white">{org.name}</h1>
              <p className="text-xs text-slate-400">
                /chat/{org.slug} · Dashboard
              </p>
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
              href="/admin/chats"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              المحادثات
            </Link>
            <Link
              href="/admin/settings"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              الإعدادات
            </Link>
            <Link
              href={`/chat/${org.slug}`}
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

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* ─── Stats Overview ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Database className="w-5 h-5 text-indigo-400" />}
            label="إجمالي المستندات"
            value={stats?.totalDocuments}
          />
          <StatCard
            icon={<Layers className="w-5 h-5 text-emerald-400" />}
            label="إجمالي الأقسام"
            value={stats?.totalSections}
          />
          <StatCard
            icon={<MessagesSquare className="w-5 h-5 text-amber-400" />}
            label="جلسات المحادثة"
            value={stats?.totalChatSessions}
          />
        </section>

        {/* ─── Recent Activity + Insights row ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">النشاط الأخير</h3>
              </div>
              <Link
                href="/admin/chats"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                عرض الكل ←
              </Link>
            </div>
            {recentSessions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                لا توجد جلسات محادثة بعد.
              </p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {s.guest_name || "ضيف"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(s.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                      {s.message_count} رسالة
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">رؤى الضيوف</h3>
            </div>
            {!insights ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
              </div>
            ) : insights.topics.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                {insights.summary}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {insights.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {insights.summary}
                </p>
                <p className="text-[10px] text-slate-600">
                  بناءً على {insights.totalAnalyzed} رسالة حديثة من الضيوف
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Upload Section ─── */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">رفع مستند</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            ارفع ملف PDF لاستخراج النص وتوليد التضمينات وإضافته إلى قاعدة معرفة فندقك.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left — Form */}
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  التصنيف
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  disabled={isUploading}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* File drop zone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  ملف PDF
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileChange(e.dataTransfer.files[0] ?? null);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-indigo-500 bg-indigo-950"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] ?? null)
                    }
                  />
                  {selectedFile ? (
                    <div className="space-y-1">
                      <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-indigo-300">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB — انقر للتغيير
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        اسحب وأفلت ملف PDF هنا
                      </p>
                      <p className="text-xs text-slate-600">أو انقر للتصفح</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    رفع ومعالجة
                  </>
                )}
              </button>
            </div>

            {/* Right — Progress & Result */}
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">
                  حالة المعالجة
                </p>
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <StepIcon status={step.status} />
                      <span
                        className={`text-sm ${
                          step.status === "done"
                            ? "text-green-400"
                            : step.status === "active"
                            ? "text-indigo-300"
                            : step.status === "error"
                            ? "text-red-400"
                            : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {result && (
                <div
                  className={`rounded-lg p-4 border text-sm ${
                    result.success
                      ? "bg-green-950 border-green-800 text-green-300"
                      : "bg-red-950 border-red-800 text-red-300"
                  }`}
                >
                  {result.success ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-green-200">✓ تمت المعالجة بنجاح</p>
                      <p>الملف: {result.fileName}</p>
                      <p>الأجزاء المضمنة: {result.chunksProcessed}</p>
                      <p>الأحرف المعالجة: {result.totalCharacters?.toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold text-red-200">✗ خطأ</p>
                      <p>{result.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Knowledge Base Table ─── */}
        <section className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">قاعدة المعرفة</h2>
              <span className="text-xs text-slate-500 ml-1">
                {documents.length} مستند
              </span>
            </div>
          </div>

          {loadingDocs ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-slate-800 rounded" />
                    <div className="h-3 w-24 bg-slate-800 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-slate-800 rounded-full" />
                  <div className="h-8 w-20 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400">لم يتم رفع مستندات بعد.</p>
              <p className="text-xs text-slate-600 mt-1">
                ارفع ملف PDF أعلاه لبناء قاعدة معرفة فندقك.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                    <th className="px-6 py-3 text-right font-medium">الملف</th>
                    <th className="px-4 py-3 text-right font-medium">التصنيف</th>
                    <th className="px-4 py-3 text-right font-medium">تاريخ الرفع</th>
                    <th className="px-4 py-3 text-right font-medium">الحالة</th>
                    <th className="px-4 py-3 text-left font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* File */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate max-w-[240px]">
                              {doc.file_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(doc.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {doc.category || "General"}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(doc.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {(doc.status === "ready" || doc.status === "inactive") && (
                            <button
                              onClick={() => handleToggleStatus(doc)}
                              disabled={togglingId === doc.id}
                              title={doc.status === "ready" ? "Deactivate" : "Activate"}
                              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                            >
                              {togglingId === doc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : doc.status === "ready" ? (
                                <ToggleRight className="w-4 h-4 text-green-400" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            title="Delete document"
                            className="p-2 rounded-lg hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ─── Delete Confirmation Dialog ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">حذف المستند</h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-2">
              هل أنت متأكد من حذف هذا المستند؟ سيتم حذف جميع
              التضمينات المرتبطة نهائياً ولا يمكن التراجع.
            </p>
            <p className="text-sm font-medium text-slate-200 bg-slate-800 rounded-lg px-3 py-2 mb-5 truncate">
              {deleteTarget.file_name}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        {value === undefined ? (
          <div className="h-7 w-12 bg-slate-800 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    ready: { bg: "bg-green-950 border-green-800", text: "text-green-400", label: "نشط" },
    inactive: { bg: "bg-slate-800 border-slate-700", text: "text-slate-400", label: "غير نشط" },
    processing: { bg: "bg-amber-950 border-amber-800", text: "text-amber-400", label: "قيد المعالجة" },
    error: { bg: "bg-red-950 border-red-800", text: "text-red-400", label: "خطأ" },
    pending: { bg: "bg-slate-800 border-slate-700", text: "text-slate-500", label: "معلق" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ready" ? "bg-green-400" : status === "processing" ? "bg-amber-400 animate-pulse" : status === "error" ? "bg-red-400" : "bg-slate-500"}`} />
      {s.label}
    </span>
  );
}

function StepIcon({ status }: { status: UploadStep["status"] }) {
  if (status === "done")
    return (
      <span className="w-5 h-5 rounded-full bg-green-900 border border-green-600 flex items-center justify-center text-green-400 text-xs flex-shrink-0">
        ✓
      </span>
    );
  if (status === "error")
    return (
      <span className="w-5 h-5 rounded-full bg-red-900 border border-red-600 flex items-center justify-center text-red-400 text-xs flex-shrink-0">
        ✗
      </span>
    );
  if (status === "active")
    return (
      <span className="w-5 h-5 rounded-full bg-indigo-900 border border-indigo-500 flex items-center justify-center flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
      </span>
    );
  return (
    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0" />
  );
}
