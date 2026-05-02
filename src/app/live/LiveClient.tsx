"use client";

import { useSearchParams, useRouter } from "next/navigation";
import LiveVideoPlayer from "@/components/LiveVideoPlayer";

export default function LiveClient() {
  const params = useSearchParams();
  const router = useRouter();

  const videoId = params.get("videoId") || "";
  const batchId = params.get("batchId") || "";
  const subjectId = params.get("subjectId") || "";
  const subjectSlug = params.get("subjectSlug") || "";
  const title = params.get("title") || "Live Class";
  const isLive = params.get("isLive") === "1";
  const directUrl = params.get("directUrl") || undefined;
  const urlType = params.get("urlType") || undefined;

  if (!videoId || !batchId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "rgba(2,4,12,0.98)" }}>
        <div className="text-center">
          <p className="text-white/50 mb-4">Invalid class link.</p>
          <button onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 rounded-xl text-white text-sm font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveVideoPlayer
      videoId={videoId}
      batchId={batchId}
      subjectId={subjectId}
      subjectSlug={subjectSlug}
      title={title}
      isLive={isLive}
      directUrl={directUrl}
      urlType={urlType}
      onClose={() => router.back()}
      fullPage
    />
  );
}
