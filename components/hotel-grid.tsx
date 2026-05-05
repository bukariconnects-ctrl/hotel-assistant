"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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

export default function HotelGrid({ hotels }: { hotels: HotelCard[] }) {
  if (hotels.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🏨</div>
        <p className="text-slate-400">لا توجد فنادق مسجلة بعد.</p>
        <Link
          href="/register"
          className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300"
        >
          كن أول من يسجل فندقه ←
        </Link>
      </div>
    );
  }

  return (
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
            {hotel.description || "مساعد فندقي ذكي جاهز لمساعدتك."}
          </p>

          <Link
            href={`/chat/${hotel.slug}`}
            className="text-center py-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/30 hover:border-indigo-600 text-indigo-400 hover:text-white text-sm font-medium transition-all"
          >
            محادثة المساعد الذكي ←
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
