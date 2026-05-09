"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/nav-bar";
import {
  Hotel,
  GraduationCap,
  Stethoscope,
  UtensilsCrossed,
  School,
  HeartPulse,
  Landmark,
  Building2,
  LayoutGrid,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

interface OrgRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
}

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  hotel: {
    label: "فنادق",
    icon: <Hotel className="w-6 h-6" />,
    color: "from-amber-500 to-orange-600",
  },
  university: {
    label: "جامعات",
    icon: <GraduationCap className="w-6 h-6" />,
    color: "from-blue-500 to-indigo-600",
  },
  hospital: {
    label: "مستشفيات",
    icon: <Stethoscope className="w-6 h-6" />,
    color: "from-red-500 to-rose-600",
  },
  restaurant: {
    label: "مطاعم",
    icon: <UtensilsCrossed className="w-6 h-6" />,
    color: "from-emerald-500 to-green-600",
  },
  school: {
    label: "مدارس",
    icon: <School className="w-6 h-6" />,
    color: "from-cyan-500 to-teal-600",
  },
  clinic: {
    label: "عيادات",
    icon: <HeartPulse className="w-6 h-6" />,
    color: "from-pink-500 to-fuchsia-600",
  },
  government: {
    label: "جهات حكومية",
    icon: <Landmark className="w-6 h-6" />,
    color: "from-slate-500 to-gray-600",
  },
  company: {
    label: "شركات",
    icon: <Building2 className="w-6 h-6" />,
    color: "from-violet-500 to-purple-600",
  },
  general: {
    label: "أخرى",
    icon: <LayoutGrid className="w-6 h-6" />,
    color: "from-indigo-500 to-purple-600",
  },
};

export default function DirectoryPage() {
  const [orgs, setOrgs] = useState<OrgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((data) => setOrgs(Array.isArray(data) ? data : []))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(orgs.map((o) => o.category || "general")));

  const filteredOrgs = selectedCategory
    ? orgs.filter((o) => (o.category || "general") === selectedCategory)
    : orgs;

  function getCategoryInfo(cat: string) {
    return CATEGORY_MAP[cat] || CATEGORY_MAP.general;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">دليل المؤسسات</h1>
          <p className="text-slate-400">
            تصفح المؤسسات المتاحة وابدأ محادثة مع المساعد الذكي
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">لا توجد مؤسسات مسجلة حالياً.</p>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !selectedCategory
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                }`}
              >
                الكل ({orgs.length})
              </button>
              {categories.map((cat) => {
                const info = getCategoryInfo(cat);
                const count = orgs.filter(
                  (o) => (o.category || "general") === cat
                ).length;
                return (
                  <button
                    key={cat}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat ? null : cat)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                    }`}
                  >
                    {info.icon && (
                      <span className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">
                        {info.icon}
                      </span>
                    )}
                    {info.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Category Cards (when no filter) */}
            <AnimatePresence mode="wait">
              {!selectedCategory && categories.length > 1 && (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10"
                >
                  {categories.map((cat) => {
                    const info = getCategoryInfo(cat);
                    const count = orgs.filter(
                      (o) => (o.category || "general") === cat
                    ).length;
                    return (
                      <motion.button
                        key={cat}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(cat)}
                        className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center hover:border-slate-700 transition-colors group"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-white mx-auto mb-3 group-hover:scale-110 transition-transform`}
                        >
                          {info.icon}
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {info.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {count} مؤسسة
                        </p>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Organization List */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory || "all"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredOrgs.map((org) => {
                  const catInfo = getCategoryInfo(org.category || "general");
                  return (
                    <motion.div
                      key={org.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${catInfo.color} flex items-center justify-center text-white flex-shrink-0`}
                        >
                          {catInfo.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {org.name}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {catInfo.label}
                          </span>
                        </div>
                      </div>
                      {org.description && (
                        <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                          {org.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-auto">
                        <Link
                          href={`/chat/${org.slug}`}
                          className="flex-1 text-center text-xs py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          بدء محادثة
                        </Link>
                        <Link
                          href={`/chat/${org.slug}`}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {filteredOrgs.length === 0 && selectedCategory && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">
                  لا توجد مؤسسات في هذا التصنيف.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
