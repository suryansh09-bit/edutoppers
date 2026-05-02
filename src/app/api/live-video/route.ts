import { NextRequest } from "next/server";
import { decryptJson } from "@/lib/decrypt";

const PROXY_BASE = "https://apiserverpro.vercel.app";

async function tryFetch(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
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

/** Wrap an HLS URL in our server-side proxy to forward auth tokens on every request */
function proxyHls(hlsUrl: string): string {
  return `/api/hls-proxy?url=${encodeURIComponent(hlsUrl)}`;
}

/**
 * GET /api/live-video
 *
 * Resolves a live / recorded-live class video URL.
 *
 * Query params:
 *   video_id     – schedule _id (required, always the schedule/class _id)
 *   batch_id     – batch ID (required)
 *   subject_id   – subject ID (optional but improves resolution)
 *   subject_slug – subject slug (optional)
 *   direct_url   – pass a raw signed stream URL directly (used for currently-live classes)
 *   url_type     – hint (awsVideo, penpencilvdo, youtube, etc.)
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
  const urlType =
    searchParams.get("url_type") ||
    searchParams.get("urlType") || "";

  // Direct URL (used only for currently-live streams, e.g. YouTube live)
  const directUrl = searchParams.get("direct_url");
  if (directUrl) {
    return resolveUrl(directUrl, batchId || "", subjectId, subjectSlug, urlType);
  }

  if (!videoId || !batchId) {
    return Response.json(
      { success: false, error: "Missing required params: video_id, batch_id" },
      { status: 400 }
    );
  }

  try {
    let signedUrl: string | null = null;
    let videoType: string | null = null;

    // ── Step 1: get-url with schedule _id + subjectId (PRIMARY — always works for live recordings) ──
    // This is the proven approach: childId = schedule._id returns signed HLS m3u8 URL
    if (subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${videoId}&batchId=${batchId}&subjectId=${subjectId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) {
          signedUrl = items[0].url;
          videoType = items[0].type || null;
        }
      } else if (data?.success && typeof (data as { url?: string }).url === "string") {
        signedUrl = (data as { url: string }).url;
      }
    }

    // ── Step 2: get-url with schedule _id + batchId only (no subjectId) ──
    if (!signedUrl) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${videoId}&batchId=${batchId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) {
          signedUrl = items[0].url;
          videoType = items[0].type || null;
        }
      } else if (data?.success && typeof (data as { url?: string }).url === "string") {
        signedUrl = (data as { url: string }).url;
      }
    }

    // ── Step 3: get-urls endpoint (alternative) ──
    if (!signedUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-urls?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) {
          signedUrl = items[0].url;
          videoType = items[0].type || null;
        }
      }
    }

    // ── Step 4: videoplay endpoint ──
    if (!signedUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/videoplay?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success) {
        const d = data.data as { video_url?: string; url?: string; type?: string } | undefined;
        const items = data.data as { url?: string; type?: string }[] | undefined;
        if (d?.video_url) {
          signedUrl = d.video_url;
        } else if (d?.url) {
          signedUrl = d.url;
          videoType = (d as { type?: string }).type || null;
        } else if (Array.isArray(items) && items[0]?.url) {
          signedUrl = items[0].url;
          videoType = items[0].type || null;
        }
      }
    }

    // ── Step 5: video endpoint (encrypted) ──
    if (!signedUrl && subjectId) {
      const data = await tryDecryptedFetch(
        `${PROXY_BASE}/api/pw/video?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success) {
        const d = data.data as { url?: string; signedUrl?: string; type?: string } | undefined;
        if (d?.url) {
          if (d.url.includes("youtube.com") || d.url.includes("youtu.be")) {
            return Response.json({ success: true, type: "youtube", videoUrl: d.url });
          }
          signedUrl = d.signedUrl ? d.url + d.signedUrl : d.url;
          videoType = d.type || null;
        }
      }
    }

    // ── Step 6: get-url with subjectSlug format ──
    if (!signedUrl && subjectSlug) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?video_id=${videoId}&batch_id=${batchId}&subject_slug=${encodeURIComponent(subjectSlug)}`
      );
      if (data?.success) {
        const url =
          (data as { url?: string }).url ||
          ((data as { data?: { url?: string }[] }).data as { url?: string }[] | undefined)?.[0]?.url;
        if (url) signedUrl = url;
      }
    }

    if (!signedUrl) {
      return Response.json({
        success: false,
        error: "Recording not available yet. Please try again later.",
      });
    }

    return resolveUrl(signedUrl, batchId, subjectId, subjectSlug, videoType || urlType);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get live video URL";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * Given a signed/raw video URL, determine the type and return the playable form.
 * HLS URLs are wrapped in the proxy so auth tokens survive sub-playlist loads.
 */
async function resolveUrl(
  rawUrl: string,
  batchId: string,
  subjectId: string,
  subjectSlug: string,
  hint?: string | null
): Promise<Response> {
  if (!rawUrl) {
    return Response.json({ success: false, error: "Empty URL" });
  }

  // YouTube
  if (
    rawUrl.includes("youtube.com") ||
    rawUrl.includes("youtu.be") ||
    hint === "youtube" ||
    hint === "ytStream"
  ) {
    return Response.json({ success: true, type: "youtube", videoUrl: rawUrl });
  }

  const isHls =
    rawUrl.includes(".m3u8") ||
    rawUrl.includes(".m3u") ||
    rawUrl.includes("index.m3u") ||
    hint === "hls" ||
    hint === "awsVideo";

  const isMpd = rawUrl.includes(".mpd");

  // HLS stream (most common for recorded live classes — signed CloudFront m3u8)
  if (isHls) {
    const proxied = proxyHls(rawUrl);
    return Response.json({
      success: true,
      type: "hls",
      hlsUrl: proxied,
      rawHlsUrl: rawUrl,
      videoUrl: proxied,
    });
  }

  // MPD (DASH) — attempt DRM key resolution, fallback to proxied HLS
  if (isMpd || hint === "DASH" || hint === "dash") {
    const hlsUrl = rawUrl.replace(/\.mpd(\?|$)/, ".m3u8$1");

    // Try to get DRM keys
    const kidData = await tryFetchLocal(
      `${PROXY_BASE}/api/pw/kid?mpdUrl=${encodeURIComponent(rawUrl)}`
    );
    if (kidData?.success && kidData.kid) {
      const otpParams = new URLSearchParams({ kid: kidData.kid as string });
      if (subjectSlug) otpParams.set("subject_slug", subjectSlug);
      if (batchId) otpParams.set("batch_id", batchId);
      if (subjectId) otpParams.set("subject_id", subjectId);
      const otpData = await tryFetchLocal(
        `${PROXY_BASE}/api/pw/otp?${otpParams.toString()}`
      );
      if (otpData?.success && otpData.key) {
        return Response.json({
          success: true,
          type: "drm",
          mpdUrl: rawUrl,
          hlsUrl: proxyHls(hlsUrl),
          rawHlsUrl: hlsUrl,
          kid: kidData.kid as string,
          key: otpData.key as string,
        });
      }
    }

    // DRM key unavailable — use proxied HLS fallback
    const proxiedFallback = proxyHls(hlsUrl);
    return Response.json({
      success: true,
      type: "hls",
      hlsUrl: proxiedFallback,
      rawHlsUrl: hlsUrl,
      videoUrl: proxiedFallback,
      mpdUrl: rawUrl,
    });
  }

  // penpencil or other CDN — try as HLS if it might be a stream
  if (rawUrl.includes("penpencil") || hint === "penpencilvdo" || hint === "penpencil") {
    const proxiedPencil = proxyHls(rawUrl);
    return Response.json({
      success: true,
      type: "hls",
      hlsUrl: proxiedPencil,
      rawHlsUrl: rawUrl,
      videoUrl: proxiedPencil,
    });
  }

  // MP4 or direct URL
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
