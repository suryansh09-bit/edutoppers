"use client";

import { useSearchParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";

export default function WatchClient() {
  const params = useSearchParams();
  const router = useRouter();

  const batchId = params.get("batchId") || "";
  const subjectId = params.get("subjectId") || "";
  const childId = params.get("childId") || "";
  const subjectSlug = params.get("subjectSlug") || "";
  const title = params.get("title") || "Video";

  if (!batchId || !subjectId || !childId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "rgba(2,4,12,0.98)" }}>
        <div className="text-center">
          <p className="text-white/50 mb-4">Invalid video link.</p>
          <button onClick={() => { try { window.close(); } catch {} setTimeout(() => router.back(), 150); }}
            className="px-4 py-2 bg-indigo-600 rounded-xl text-white text-sm font-bold">
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  function handleClose() {
    // Tab was opened via window.open — close it; fallback to history if that fails
    try { window.close(); } catch {}
    // If window.close() didn't work (e.g. same-origin restriction), go back
    setTimeout(() => { router.back(); }, 150);
  }

  return (
    <VideoPlayer
      batchId={batchId}
      subjectId={subjectId}
      childId={childId}
      subjectSlug={subjectSlug}
      title={title}
      onClose={handleClose}
      fullPage
    />
  );
}
