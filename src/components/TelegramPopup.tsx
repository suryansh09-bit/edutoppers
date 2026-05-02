"use client";

import { useEffect, useState } from "react";

const CHANNEL_URL = "https://t.me/+4BMk346dLn1hZDU9";
const STORAGE_KEY = "et_tg_dismissed";

export default function TelegramPopup() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Show after 2s if not dismissed in this session
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, 350);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-end sm:items-center justify-center p-4 ${closing ? "opacity-0" : "opacity-100"}`}
      style={{
        zIndex: 99999,
        background: "rgba(2, 4, 12, 0.75)",
        backdropFilter: "blur(6px)",
        transition: "opacity 0.35s ease",
        pointerEvents: "auto",
        filter: "none",
        WebkitFilter: "none",
      }}
      onClick={dismiss}
    >
      <div
        className={`relative w-full max-w-md ${closing ? "scale-95 translate-y-4 opacity-0" : "scale-100 translate-y-0 opacity-100"}`}
        style={{
          transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
          pointerEvents: "auto",
          filter: "none",
          WebkitFilter: "none",
          userSelect: "text",
          WebkitUserSelect: "text",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #0d1117 0%, #111827 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
            pointerEvents: "auto",
            filter: "none",
            WebkitFilter: "none",
          }}
        >

          {/* Top banner */}
          <div className="relative px-6 pt-6 pb-4 text-center overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%)" }}>
            {/* Glow */}
            <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 70%)" }} />
            {/* Telegram icon */}
            <div className="relative inline-flex w-16 h-16 rounded-2xl bg-white/20 items-center justify-center mb-3 shadow-lg">
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.47c-.148.668-.54.83-1.093.516l-3.017-2.222-1.457 1.4c-.16.16-.296.296-.607.296l.215-3.06 5.56-5.016c.242-.215-.053-.334-.374-.12L7.084 14.43l-2.95-.923c-.641-.2-.655-.64.134-.948l11.52-4.44c.534-.196 1.002.13.774.13z" />
              </svg>
            </div>
            <h2 className="relative text-white font-extrabold text-xl leading-tight">Join Our Telegram</h2>
            <p className="relative text-white/75 text-sm mt-1">Stay connected for updates</p>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Warning notice */}
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-5">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <p className="text-amber-300 font-bold text-sm mb-0.5">Website may be banned anytime</p>
                <p className="text-white/45 text-xs leading-relaxed">
                  This website can go down without notice. Join our Telegram to get instant updates on the new link, announcements, and more.
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[
                { icon: "🔗", text: "New site links instantly" },
                { icon: "📢", text: "Latest updates & news" },
                { icon: "💬", text: "Community support" },
                { icon: "🚀", text: "Feature announcements" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-white/65 text-xs font-semibold">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-extrabold text-white text-sm transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", boxShadow: "0 8px 24px rgba(14, 165, 233, 0.35)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.47c-.148.668-.54.83-1.093.516l-3.017-2.222-1.457 1.4c-.16.16-.296.296-.607.296l.215-3.06 5.56-5.016c.242-.215-.053-.334-.374-.12L7.084 14.43l-2.95-.923c-.641-.2-.655-.64.134-.948l11.52-4.44c.534-.196 1.002.13.774.13z" />
              </svg>
              Join Telegram Channel
            </a>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="w-full mt-2.5 py-2.5 text-white/35 hover:text-white/60 text-xs font-semibold transition-colors"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
