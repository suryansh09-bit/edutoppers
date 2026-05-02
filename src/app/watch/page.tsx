"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import VideoPlayer from "@/components/VideoPlayer";

function WatchContent() {
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
          <button onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 rounded-xl text-white text-sm font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer
      batchId={batchId}
      subjectId={subjectId}
      childId={childId}
      subjectSlug={subjectSlug}
      title={title}
      onClose={() => router.back()}
      fullPage
    />
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "rgba(2,4,12,0.98)" }}>
        <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
