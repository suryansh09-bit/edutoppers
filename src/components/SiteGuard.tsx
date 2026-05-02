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
      if (e.key === "F12") { e.preventDefault(); return false; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C", "K"].includes(key)) {
        e.preventDefault(); return false;
      }
      if ((e.ctrlKey || e.metaKey) && key === "U") { e.preventDefault(); return false; }
      if ((e.ctrlKey || e.metaKey) && key === "S") { e.preventDefault(); return false; }
    };
    document.addEventListener("keydown", noKeys, true);

    // ── Disable drag ──────────────────────────────────────────────────────
    const noDrag = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragstart", noDrag);

    // ── Console warning ───────────────────────────────────────────────────
    setTimeout(() => {
      console.clear();
      console.log("%c⚠ STOP!", "color: red; font-size: 40px; font-weight: bold;");
      console.log(
        "%cThis is a browser feature intended for developers only. If someone told you to paste code here, they are trying to compromise your account.",
        "color: #ff4444; font-size: 14px; line-height: 1.6;"
      );
    }, 500);

    return () => {
      document.removeEventListener("contextmenu", noCtx);
      document.removeEventListener("keydown", noKeys, true);
      document.removeEventListener("dragstart", noDrag);
    };
  }, []);

  return null;
}
