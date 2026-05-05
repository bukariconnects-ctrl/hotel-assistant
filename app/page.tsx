"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/nav-bar";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Answers",
    desc: "Upload your hotel documents and let AI handle guest questions 24/7 — based on your actual policies and services.",
  },
  {
    icon: "🌍",
    title: "Multilingual Support",
    desc: "Guests can chat in any language. The AI responds in their language automatically — Arabic, English, French, and more.",
  },
  {
    icon: "⚡",
    title: "5-Minute Setup",
    desc: "Register, create your hotel, upload a PDF — your AI assistant is live. No coding, no integrations.",
  },
  {
    icon: "🔒",
    title: "Data Isolation",
    desc: "Each hotel's knowledge base is completely separate. Your data is never shared or mixed with other hotels.",
  },
  {
    icon: "📊",
    title: "Smart Retrieval (RAG)",
    desc: "Powered by vector search and Gemini AI. Only the most relevant information is used to craft each answer.",
  },
  {
    icon: "🏨",
    title: "Multi-Hotel Ready",
    desc: "Manage multiple properties from a single account. Each hotel gets its own slug, chat page, and knowledge base.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["1 Hotel", "5 Documents", "100 Chats/day", "Community Support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "5 Hotels",
      "Unlimited Documents",
      "Unlimited Chats",
      "Priority Support",
      "Custom Branding",
    ],
    cta: "Coming Soon",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited Hotels",
      "Dedicated Infrastructure",
      "SLA & On-boarding",
      "API Access",
      "White Label",
    ],
    cta: "Contact Us",
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-block text-xs font-semibold tracking-wider uppercase text-indigo-400 bg-indigo-950 border border-indigo-800 px-3 py-1 rounded-full mb-6">
              AI-Powered Hotel Concierge
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Your Hotel&apos;s{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI Assistant
            </span>
            <br />
            That Never Sleeps
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Upload your hotel documents. Get a smart, multilingual AI chatbot
            that answers guest questions instantly — based on your actual
            policies, menus, and services.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-colors shadow-lg shadow-indigo-600/20"
            >
              Register Your Hotel
            </Link>
            <Link
              href="/hotels"
              className="px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition-colors"
            >
              Browse Guest Chats
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl font-bold text-white">
              Everything your hotel needs
            </h2>
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">
              A complete AI concierge solution — set up in minutes, not months.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="rounded-xl bg-slate-900 border border-slate-800 p-6 hover:border-indigo-800 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl font-bold text-white">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-slate-400">
              Start free. Upgrade when you grow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`rounded-xl border p-8 flex flex-col ${
                  plan.highlight
                    ? "bg-slate-800 border-indigo-600 ring-1 ring-indigo-600 shadow-xl shadow-indigo-600/10"
                    : "bg-slate-900 border-slate-800"
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
              >
                <h3 className="text-lg font-semibold text-white">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-slate-400 text-sm">
                      {plan.period}
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <span className="text-indigo-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Free" ? "/register" : "#"}
                  className={`mt-8 text-center py-3 rounded-lg font-medium text-sm transition-colors ${
                    plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.h2
            className="text-3xl font-bold text-white"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            Ready to elevate your guest experience?
          </motion.h2>
          <motion.p
            className="mt-4 text-slate-400"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            Join hotels worldwide using AI to provide instant, accurate answers
            to every guest question.
          </motion.p>
          <motion.div
            className="mt-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
          >
            <Link
              href="/register"
              className="inline-block px-10 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-colors shadow-lg shadow-indigo-600/20"
            >
              Get Started for Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
              H
            </div>
            <span className="text-sm font-semibold text-slate-400">
              HotelAI
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {new Date().getFullYear()} HotelAI. Powered by Gemini &
            Supabase.
          </p>
        </div>
      </footer>
    </div>
  );
}
