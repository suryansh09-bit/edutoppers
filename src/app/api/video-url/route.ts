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

async function tryDecryptedFetch(
  url: string
): Promise<Record<string, unknown> | null> {
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

/** Wrap an HLS URL in our server-side proxy so auth tokens survive sub-playlist loads */
function proxyHls(hlsUrl: string): string {
  return `/api/hls-proxy?url=${encodeURIComponent(hlsUrl)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const childId = searchParams.get("childId");
  const batchId = searchParams.get("batchId");
  const subjectId = searchParams.get("subjectId");
  const subjectSlug = searchParams.get("subjectSlug") || "";

  if (!childId || !batchId) {
    return Response.json(
      { error: "Missing required params: childId, batchId" },
      { status: 400 }
    );
  }

  try {
    let videoUrl: string | null = null;
    let videoType: string | null = null;

    // Step 1: get-urls (batchId + subjectId + childId)
    if (subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-urls?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`
      );
      if (data?.success && Array.isArray(data.data)) {
        const items = data.data as { url?: string; type?: string }[];
        if (items[0]?.url) {
          videoUrl = items[0].url;
          videoType = items[0].type || null;
        }
      }
    }

    // Step 2: get-url (childId + batchId + subjectId)
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${childId}&batchId=${batchId}&subjectId=${subjectId}`
      );
      if (data?.success) {
        const url =
          (data as { url?: string }).url ||
          (
            (data as { data?: { url?: string }[] }).data as
              | { url?: string }[]
              | undefined
          )?.[0]?.url;
        if (url) videoUrl = url;
      }
    }

    // Step 3: get-url (childId + batchId, no subject)
    if (!videoUrl) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${childId}&batchId=${batchId}`
      );
      if (data?.success) {
        const url =
          (data as { url?: string }).url ||
          (
            (data as { data?: { url?: string }[] }).data as
              | { url?: string }[]
              | undefined
          )?.[0]?.url;
        if (url) videoUrl = url;
      }
    }

    // Step 4: get-url with video_id format
    if (!videoUrl && subjectSlug) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?video_id=${childId}&batch_id=${batchId}&subject_slug=${encodeURIComponent(subjectSlug)}`
      );
      if (data?.success) {
        const url =
          (data as { url?: string }).url ||
          (
            (data as { data?: { url?: string }[] }).data as
              | { url?: string }[]
              | undefined
          )?.[0]?.url;
        if (url) videoUrl = url;
      }
    }

    // Step 5: video endpoint (encrypted)
    if (!videoUrl && subjectId) {
      const data = await tryDecryptedFetch(
        `${PROXY_BASE}/api/pw/video?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`
      );
      if (data?.success) {
        const d = data.data as
          | { url?: string; signedUrl?: string; type?: string }
          | undefined;
        if (d?.url) {
          if (d.url.includes("youtube.com") || d.url.includes("youtu.be")) {
            return Response.json({
              success: true,
              type: "youtube",
              videoUrl: d.url,
            });
          }
          videoUrl = d.signedUrl ? d.url + d.signedUrl : d.url;
          videoType = d.type || null;
        }
      }
    }

    // Step 6: videoplay
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/videoplay?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`
      );
      if (data?.success) {
        const d = data.data as
          | { video_url?: string; url?: string; type?: string }
          | undefined;
        const items = data.data as { url?: string; type?: string }[] | undefined;
        if (d?.video_url) {
          videoUrl = d.video_url;
        } else if (d?.url) {
          if ((d as { type?: string }).type === "youtube") {
            return Response.json({
              success: true,
              type: "youtube",
              videoUrl: d.url,
            });
          }
          videoUrl = d.url;
        } else if (Array.isArray(items) && items[0]?.url) {
          if (items[0].type === "youtube") {
            return Response.json({
              success: true,
              type: "youtube",
              videoUrl: items[0].url,
            });
          }
          videoUrl = items[0].url;
        }
      }
    }

    if (!videoUrl) {
      return Response.json({
        success: false,
        error: "Could not resolve video URL. The video may not be available yet.",
      });
    }

    // Check for YouTube
    if (
      videoUrl.includes("youtube.com") ||
      videoUrl.includes("youtu.be")
    ) {
      return Response.json({
        success: true,
        type: "youtube",
        videoUrl,
      });
    }

    // Check if MPD / HLS
    const isMpd = videoUrl.includes(".mpd");
    const hlsUrl = videoUrl.replace(/\.mpd(\?|$)/, ".m3u8$1");

    if (isMpd || videoType === "DASH") {
      // Extract KID for DRM decryption
      const kidData = await tryFetch(
        `${PROXY_BASE}/api/pw/kid?mpdUrl=${encodeURIComponent(videoUrl)}`
      );

      if (kidData?.success && kidData.kid) {
        const otpParams = new URLSearchParams({ kid: kidData.kid as string });
        if (subjectSlug) otpParams.set("subject_slug", subjectSlug);
        if (batchId) otpParams.set("batch_id", batchId);
        if (subjectId) otpParams.set("subject_id", subjectId);
        const otpData = await tryFetch(
          `${PROXY_BASE}/api/pw/otp?${otpParams.toString()}`
        );

        if (otpData?.success && otpData.key) {
          return Response.json({
            success: true,
            type: "drm",
            mpdUrl: videoUrl,
            hlsUrl: proxyHls(hlsUrl),
            kid: kidData.kid as string,
            key: otpData.key as string,
          });
        }
      }

      // If KID/OTP fails, proxy the HLS
      return Response.json({
        success: true,
        type: "hls",
        videoUrl: proxyHls(hlsUrl),
        mpdUrl: videoUrl,
      });
    }

    // Plain HLS — proxy to forward auth tokens on segment requests
    const isHls = videoUrl.includes(".m3u8") || videoUrl.includes(".m3u");
    if (isHls) {
      return Response.json({
        success: true,
        type: "hls",
        videoUrl: proxyHls(videoUrl),
      });
    }

    // MP4 / direct
    return Response.json({
      success: true,
      type: "mp4",
      videoUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get video URL";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
