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

/**
 * GET /api/live-video
 * Resolves a live class video URL for playback.
 *
 * Query params:
 *   video_id       - The schedule/video ID (required)
 *   batch_id       - The batch ID (required)
 *   subject_slug   - Subject slug
 *   subject_id     - Subject ID
 *   schedule_id    - Schedule ID (same as video_id usually)
 *
 * Mirrors the structure at:
 *   https://deltastudy.site/pw/aws/play?video_id=...&subject_slug=...&batch_id=...&schedule_id=...&subject_id=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const videoId = searchParams.get("video_id") || searchParams.get("videoId") || searchParams.get("childId");
  const batchId = searchParams.get("batch_id") || searchParams.get("batchId");
  const subjectSlug = searchParams.get("subject_slug") || searchParams.get("subjectSlug") || "";
  const subjectId = searchParams.get("subject_id") || searchParams.get("subjectId") || "";
  const scheduleId = searchParams.get("schedule_id") || searchParams.get("scheduleId") || videoId;

  if (!videoId || !batchId) {
    return Response.json(
      { success: false, error: "Missing required params: video_id (or childId), batch_id (or batchId)" },
      { status: 400 }
    );
  }

  try {
    let videoUrl: string | null = null;
    let videoType: string | null = null;

    // Step 1: Try get-urls with subject info
    if (subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-urls?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) {
          videoUrl = items[0].url;
          videoType = items[0].type || null;
        }
      }
    }

    // Step 2: get-url with video_id + batch_id + subject_slug (PW schedule format)
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

    // Step 3: get-url by childId + batchId
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

    // Step 4: live schedule video endpoint
    if (!videoUrl && scheduleId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/live-video?batchId=${batchId}&scheduleId=${scheduleId}`
      );
      if (data?.success) {
        const d = data.data as { url?: string; videoUrl?: string; type?: string } | undefined;
        if (d?.videoUrl) { videoUrl = d.videoUrl; videoType = d.type || null; }
        else if (d?.url) { videoUrl = d.url; videoType = d.type || null; }
      }
    }

    // Step 5: video endpoint (encrypted)
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

    // Step 6: videoplay endpoint
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/videoplay?batchId=${batchId}&subjectId=${subjectId}&childId=${videoId}`
      );
      if (data?.success) {
        const d = data.data as { video_url?: string; url?: string; type?: string } | undefined;
        const items = data.data as { url?: string; type?: string }[] | undefined;
        if (d?.video_url) videoUrl = d.video_url;
        else if (d?.url) {
          if (d.type === "youtube") return Response.json({ success: true, type: "youtube", videoUrl: d.url });
          videoUrl = d.url;
        } else if (Array.isArray(items) && items[0]?.url) {
          if (items[0].type === "youtube") return Response.json({ success: true, type: "youtube", videoUrl: items[0].url });
          videoUrl = items[0].url;
        }
      }
    }

    if (!videoUrl) {
      return Response.json({
        success: false,
        error: "Could not resolve video URL. The recording may not be available yet.",
      });
    }

    // YouTube check
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      return Response.json({ success: true, type: "youtube", videoUrl });
    }

    // DRM / HLS detection
    const isMpd = videoUrl.includes(".mpd");
    const hlsUrl = videoUrl.replace(/\.mpd/i, ".m3u8");

    if (isMpd || videoType === "DASH") {
      const kidData = await tryFetch(
        `${PROXY_BASE}/api/pw/kid?mpdUrl=${encodeURIComponent(videoUrl)}`
      );
      if (kidData?.success && kidData.kid) {
        const otpData = await tryFetch(
          `${PROXY_BASE}/api/pw/otp?kid=${kidData.kid}`
        );
        if (otpData?.success && otpData.key) {
          return Response.json({
            success: true,
            type: "drm",
            mpdUrl: videoUrl,
            hlsUrl,
            kid: kidData.kid as string,
            key: otpData.key as string,
          });
        }
      }
      // Fallback to HLS
      return Response.json({ success: true, type: "hls", videoUrl: hlsUrl, mpdUrl: videoUrl });
    }

    const isHls = videoUrl.includes(".m3u8");
    return Response.json({
      success: true,
      type: isHls ? "hls" : "mp4",
      videoUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get live video URL";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
