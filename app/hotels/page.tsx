"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/nav-bar";

interface HotelCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function HotelsPage() {
  const [hotels, setHotels] = useState<HotelCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotels?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setHotels(data);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();

    const onFocus = () => fetchHotels();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchHotels();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchHotels]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <h1 className="text-3xl font-bold text-white">Hotel Directory</h1>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            Browse hotels with AI-powered guest assistants. Click to start
            chatting instantly.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-slate-500 text-sm">Loading hotels...</div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏨</div>
            <p className="text-slate-400">No hotels registered yet.</p>
            <Link
              href="/register"
              className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Be the first to register your hotel →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel, i) => (
              <motion.div
                key={hotel.id}
                className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col hover:border-indigo-800 transition-colors group"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 1}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-800/30 flex items-center justify-center text-2xl flex-shrink-0">
                    🏨
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      /{hotel.slug}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-6 line-clamp-3">
                  {hotel.description || "An AI-powered hotel assistant ready to help you."}
                </p>

                <Link
                  href={`/chat/${hotel.slug}`}
                  className="text-center py-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/30 hover:border-indigo-600 text-indigo-400 hover:text-white text-sm font-medium transition-all"
                >
                  Chat with AI →
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
