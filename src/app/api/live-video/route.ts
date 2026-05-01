import { NextRequest } from "next/server";
import { decryptJson } from "@/lib/decrypt";

const PROXY_BASE = "https://apiserverpro.vercel.app";

async function tryFetch(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function tryDecryptedFetch(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data && typeof json.data === "string" && json.data.includes(":")) {
      return decryptJson(json.data) as Record<string, unknown>;
    }
    return json;
  } catch {
    return null;
  }
}

/** Wrap an HLS URL in our server-side proxy to forward auth tokens on every segment request */
function proxyHls(hlsUrl: string): string {
  return `/api/hls-proxy?url=${encodeURIComponent(hlsUrl)}`;
}

/**
 * GET /api/live-video
 *
 * Resolves a live / recorded-live class video URL.
 *
 * Query params (mirroring deltastudy.site/pw/aws/play structure):
 *   video_id     / videoId / childId   – schedule or video ID (required)
 *   batch_id     / batchId             – batch ID (required)
 *   subject_id   / subjectId           – subject ID (optional but improves resolution)
 *   subject_slug / subjectSlug         – subject slug (optional)
 *   schedule_id  / scheduleId          – schedule ID (defaults to video_id)
 *   direct_url                         – pass a raw CloudFront/CDN URL directly
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const videoId =
    searchParams.get("video_id") ||
    searchParams.get("videoId") ||
    searchParams.get("childId");
  const batchId =
    searchParams.get("batch_id") ||
    searchParams.get("batchId");
  const subjectId =
    searchParams.get("subject_id") ||
    searchParams.get("subjectId") || "";
  const subjectSlug =
    searchParams.get("subject_slug") ||
    searchParams.get("subjectSlug") || "";
  const scheduleId =
    searchParams.get("schedule_id") ||
    searchParams.get("scheduleId") ||
    videoId;

  // Support passing a raw signed URL directly (for live classes that already have the URL)
  const directUrl = searchParams.get("direct_url");
  if (directUrl) {
    return resolveUrl(directUrl, batchId || "", subjectId, subjectSlug);
  }

  if (!videoId || !batchId) {
    return Response.json(
      { success: false, error: "Missing required params: video_id (or childId), batch_id (or batchId)" },
      { status: 400 }
    );
  }

  try {
    let videoUrl: string | null = null;
    let videoType: string | null = null;

    // Step 1: get-url with childId + batchId + subjectId  (most reliable for recorded classes)
    if (subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${videoId}&batchId=${batchId}&subjectId=${subjectId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) { videoUrl = items[0].url; videoType = items[0].type || null; }
      } else if (data?.success && (data as { url?: string }).url) {
        videoUrl = (data as { url?: string }).url!;
      }
    }

    // Step 2: get-urls (batch + subject + child)
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-urls?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) { videoUrl = items[0].url; videoType = items[0].type || null; }
      }
    }

    // Step 3: get-url with video_id + batch_id + subject_slug (schedule format)
    if (!videoUrl && subjectSlug) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?video_id=${videoId}&batch_id=${batchId}&subject_slug=${encodeURIComponent(subjectSlug)}`
      );
      if (data?.success) {
        const url =
          (data as { url?: string }).url ||
          ((data as { data?: { url?: string }[] }).data as { url?: string }[] | undefined)?.[0]?.url;
        if (url) videoUrl = url;
      }
    }

    // Step 4: get-url by childId + batchId (no subjectId)
    if (!videoUrl) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${videoId}&batchId=${batchId}`
      );
      if (data?.success) {
        const url =
          (data as { url?: string }).url ||
          ((data as { data?: { url?: string }[] }).data as { url?: string }[] | undefined)?.[0]?.url;
        if (url) videoUrl = url;
      }
    }

    // Step 5: videoplay (schedule/live endpoint)
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/videoplay?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success) {
        const d = data.data as { video_url?: string; url?: string; type?: string } | undefined;
        const items = data.data as { url?: string; type?: string }[] | undefined;
        if (d?.video_url) videoUrl = d.video_url;
        else if (d?.url) { videoUrl = d.url; videoType = (d as { type?: string }).type || null; }
        else if (Array.isArray(items) && items[0]?.url) { videoUrl = items[0].url; videoType = items[0].type || null; }
      }
    }

    // Step 6: encrypted video endpoint
    if (!videoUrl && subjectId) {
      const data = await tryDecryptedFetch(
        `${PROXY_BASE}/api/pw/video?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success) {
        const d = data.data as { url?: string; signedUrl?: string; type?: string } | undefined;
        if (d?.url) {
          if (d.url.includes("youtube.com") || d.url.includes("youtu.be")) {
            return Response.json({ success: true, type: "youtube", videoUrl: d.url });
          }
          videoUrl = d.signedUrl ? d.url + d.signedUrl : d.url;
          videoType = d.type || null;
        }
      }
    }

    // Step 7: try scheduleId if different from videoId
    if (!videoUrl && scheduleId && scheduleId !== videoId && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${scheduleId}&batchId=${batchId}&subjectId=${subjectId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) { videoUrl = items[0].url; videoType = items[0].type || null; }
      }
    }

    if (!videoUrl) {
      return Response.json({
        success: false,
        error: "Video URL not available. The recording may not be ready yet.",
      });
    }

    return resolveUrl(videoUrl, batchId, subjectId, subjectSlug, videoType);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get live video URL";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * Given a raw video URL, determine the type, handle DRM if needed,
 * and wrap HLS in the proxy so auth tokens survive sub-playlist loads.
 */
async function resolveUrl(
  rawUrl: string,
  batchId: string,
  subjectId: string,
  subjectSlug: string,
  hint?: string | null
): Promise<Response> {
  // YouTube
  if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
    return Response.json({ success: true, type: "youtube", videoUrl: rawUrl });
  }

  const isMpd = rawUrl.includes(".mpd");
  const isHls = rawUrl.includes(".m3u8") || rawUrl.includes(".m3u");
  const hlsUrl = isMpd ? rawUrl.replace(/\.mpd(\?|$)/, ".m3u8$1") : rawUrl;

  // DRM (MPD)
  if (isMpd || hint === "DASH") {
    const kidData = await tryFetchLocal(
      `https://apiserverpro.vercel.app/api/pw/kid?mpdUrl=${encodeURIComponent(rawUrl)}`
    );
    if (kidData?.success && kidData.kid) {
      // Try OTP with all available context
      const otpParams = new URLSearchParams({ kid: kidData.kid as string });
      if (subjectSlug) otpParams.set("subject_slug", subjectSlug);
      if (batchId) otpParams.set("batch_id", batchId);
      if (subjectId) otpParams.set("subject_id", subjectId);
      const otpData = await tryFetchLocal(
        `https://apiserverpro.vercel.app/api/pw/otp?${otpParams.toString()}`
      );
      if (otpData?.success && otpData.key) {
        // Also provide proxied HLS as fallback
        return Response.json({
          success: true,
          type: "drm",
          mpdUrl: rawUrl,
          hlsUrl: proxyHls(hlsUrl),  // proxied fallback
          kid: kidData.kid as string,
          key: otpData.key as string,
        });
      }
    }
    // DRM key unavailable — fall back to proxied HLS
    return Response.json({
      success: true,
      type: "hls",
      videoUrl: proxyHls(hlsUrl),
      mpdUrl: rawUrl,
    });
  }

  // Plain HLS — proxy it to forward auth on every segment request
  if (isHls) {
    return Response.json({
      success: true,
      type: "hls",
      videoUrl: proxyHls(rawUrl),
    });
  }

  // MP4 or other direct URL
  return Response.json({
    success: true,
    type: "mp4",
    videoUrl: rawUrl,
  });
}

async function tryFetchLocal(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
