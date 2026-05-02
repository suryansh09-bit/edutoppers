"use client";

import { useEffect } from "react";

export default function SiteGuard() {
  useEffect(() => {
    // ── Disable right-click context menu ──────────────────────────────────
    const noCtx = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", noCtx);

    // ── Block common devtools keyboard shortcuts ──────────────────────────
    const noKeys = (e: KeyboardEvent) => {
      const key = e.key?.toUpperCase();
      // F12
      if (e.key === "F12") { e.preventDefault(); return false; }
      // Ctrl/Cmd + Shift + I / J / C / U / K / S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C", "K"].includes(key)) {
        e.preventDefault(); return false;
      }
      // Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && key === "U") { e.preventDefault(); return false; }
      // Ctrl+S (save page)
      if ((e.ctrlKey || e.metaKey) && key === "S") { e.preventDefault(); return false; }
    };
    document.addEventListener("keydown", noKeys, true);

    // ── Detect devtools open via size difference ──────────────────────────
    let devtoolsOpen = false;
    const threshold = 160;
    const checkDevtools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if ((widthDiff || heightDiff) && !devtoolsOpen) {
        devtoolsOpen = true;
        // Blur the page content subtly — non-destructive
        document.body.style.filter = "blur(8px)";
        document.body.style.pointerEvents = "none";
      } else if (!widthDiff && !heightDiff && devtoolsOpen) {
        devtoolsOpen = false;
        document.body.style.filter = "";
        document.body.style.pointerEvents = "";
      }
    };
    const dtInterval = setInterval(checkDevtools, 1000);

    // ── Disable text selection on non-input elements ──────────────────────
    const noSelect = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
    };
    document.addEventListener("selectstart", noSelect);

    // ── Disable drag ──────────────────────────────────────────────────────
    const noDrag = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragstart", noDrag);

    // ── Console warning ───────────────────────────────────────────────────
    console.clear();
    console.log("%c⚠ WARNING", "color: red; font-size: 32px; font-weight: bold;");
    console.log("%cThis is a browser feature for developers only. Do not paste code here — it may compromise your account and privacy.", "color: #ff4444; font-size: 14px;");

    return () => {
      document.removeEventListener("contextmenu", noCtx);
      document.removeEventListener("keydown", noKeys, true);
      document.removeEventListener("selectstart", noSelect);
      document.removeEventListener("dragstart", noDrag);
      clearInterval(dtInterval);
    };
  }, []);

  return null;
}
