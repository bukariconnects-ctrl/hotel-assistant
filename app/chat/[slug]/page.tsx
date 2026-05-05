"use client";

import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface HotelData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  welcome_message: string | null;
}

export default function GuestChatPage() {
  const params = useParams();
  const slug = params.slug as string;
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: { slug, sessionId: sessionIdRef.current },
      onResponse(response) {
        const sid = response.headers.get("x-session-id");
        if (sid) sessionIdRef.current = sid;
      },
    });

  useEffect(() => {
    fetch(`/api/hotel/by-slug/${slug}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.id) setHotel(d);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-100 px-4">
        <div className="text-5xl mb-4">🏨</div>
        <h1 className="text-xl font-semibold mb-2">Hotel Not Found</h1>
        <p className="text-sm text-slate-400 mb-6 text-center max-w-xs">
          We couldn&apos;t find a hotel with the slug &quot;{slug}&quot;.
        </p>
        <Link
          href="/hotels"
          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Browse Hotels
        </Link>
      </div>
    );
  }

  const hotelName = hotel?.name || "";
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 shadow-lg">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          AI
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {hotelName || "Hotel Assistant"}
          </p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Online
          </p>
        </div>
        <Link
          href="/hotels"
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
        >
          Directory
        </Link>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pb-16">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl">
              🏨
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">
                {hotel?.welcome_message
                  ? hotel.welcome_message
                  : hotelName
                  ? `مرحباً بك في ${hotelName}`
                  : "Welcome"}
              </p>
              <p className="text-sm text-slate-400 max-w-xs">
                I&apos;m your AI assistant. Ask me anything about the hotel — services, amenities, policies, and more.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                "What amenities are available?",
                "What are the check-in times?",
                "Do you have a restaurant?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    handleInputChange({
                      target: { value: suggestion },
                    } as React.ChangeEvent<HTMLInputElement>);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs flex-shrink-0">
              AI
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}

        {error && (() => {
          const isQuota = error.message?.includes("QUOTA_EXCEEDED");
          return (
            <div className={`mx-auto max-w-sm rounded-lg text-sm px-4 py-3 text-center ${
              isQuota
                ? "bg-amber-950 border border-amber-700 text-amber-300"
                : "bg-red-950 border border-red-800 text-red-300"
            }`}>
              {isQuota
                ? "⏳ تجاوزت حد الطلبات المجانية، يرجى المحاولة بعد قليل."
                : "Something went wrong. Please try again."}
            </div>
          );
        })()}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 max-w-3xl mx-auto"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about the hotel…"
            disabled={isLoading}
            autoComplete="off"
            className="flex-1 resize-none rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 flex-shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white flex items-center justify-center transition-colors"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-2">
          Powered by Gemini · Answers based on hotel documents
        </p>
      </div>
    </div>
  );
}

function parseSources(text: string): { body: string; sources: string[] } {
  const match = text.match(/\[Sources?:\s*(.+?)\]\s*$/);
  if (!match) return { body: text, sources: [] };
  const body = text.slice(0, match.index).trimEnd();
  const sources = match[1]
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { body, sources };
}

function MessageBubble({
  role,
  content,
}: {
  role: string;
  content: string;
}) {
  const isUser = role === "user";
  const { body, sources } = isUser
    ? { body: content, sources: [] }
    : parseSources(content);

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs flex-shrink-0 mb-0.5">
          AI
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words transition-all animate-fade-in ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-slate-800 text-slate-100 rounded-bl-sm"
        }`}
      >
        {body}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-700/50">
            {sources.map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-500"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}
