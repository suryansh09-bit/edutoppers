import { NextRequest } from "next/server";
import { decryptJson } from "@/lib/decrypt";

const PROXY_BASE = "https://apiserverpro.vercel.app";

/** Fetch with a timeout, returns null on any failure */
async function tryFetch(
  url: string,
  timeoutMs = 12000
): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch with decryption support */
async function tryDecryptedFetch(
  url: string,
  timeoutMs = 12000
): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
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

/** Extract a URL string from many possible response shapes */
function extractUrl(data: Record<string, unknown>): {
  url: string | null;
  type: string | null;
} {
  // Check top-level url
  if (typeof data.url === "string" && data.url) {
    return { url: data.url, type: typeof data.type === "string" ? data.type : null };
  }
  // Check data.url (object shape)
  const d = data.data as Record<string, unknown> | undefined;
  if (d && typeof d.url === "string" && d.url) {
    return {
      url: d.url,
      type: typeof d.type === "string" ? d.type : null,
    };
  }
  if (d && typeof d.video_url === "string" && d.video_url) {
    return { url: d.video_url, type: null };
  }
  if (d && typeof d.signedUrl === "string" && d.signedUrl) {
    return { url: d.signedUrl, type: null };
  }
  // Array shape
  if (Array.isArray(data.data)) {
    const items = data.data as { url?: string; type?: string }[];
    if (items[0]?.url) {
      return { url: items[0].url, type: items[0].type || null };
    }
  }
  return { url: null, type: null };
}

/** Wrap an HLS URL through our server-side proxy so auth headers are forwarded */
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
      { success: false, error: "Missing required params: childId, batchId" },
      { status: 400 }
    );
  }

  try {
    let videoUrl: string | null = null;
    let videoType: string | null = null;

    // ── Helper to assign result ────────────────────────────────────────────
    function assign(data: Record<string, unknown> | null): boolean {
      if (!data?.success) return false;
      const { url, type } = extractUrl(data);
      if (url) {
        videoUrl = url;
        videoType = type;
        return true;
      }
      return false;
    }

    // ── Step 1: get-urls with subjectId ────────────────────────────────────
    if (!videoUrl && subjectId) {
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

    // ── Step 2: get-url (batchId + subjectId + childId) ───────────────────
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${childId}&batchId=${batchId}&subjectId=${subjectId}`
      );
      assign(data);
    }

    // ── Step 3: get-url (batchId + childId only) ──────────────────────────
    if (!videoUrl) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${childId}&batchId=${batchId}`
      );
      assign(data);
    }

    // ── Step 4: get-url with video_id / subject_slug format ───────────────
    if (!videoUrl && subjectSlug) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?video_id=${childId}&batch_id=${batchId}&subject_slug=${encodeURIComponent(subjectSlug)}`
      );
      assign(data);
    }

    // ── Step 5: get-url with id param ─────────────────────────────────────
    if (!videoUrl) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?id=${childId}&batchId=${batchId}`
      );
      assign(data);
    }

    // ── Step 6: /video (encrypted) ────────────────────────────────────────
    if (!videoUrl && subjectId) {
      const data = await tryDecryptedFetch(
        `${PROXY_BASE}/api/pw/video?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`
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

    // ── Step 7: videoplay ─────────────────────────────────────────────────
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/videoplay?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`
      );
      if (data?.success) {
        const d = data.data as { video_url?: string; url?: string; type?: string } | undefined;
        const items = data.data as { url?: string; type?: string }[] | undefined;
        if (d?.video_url) {
          videoUrl = d.video_url;
        } else if (d?.url) {
          if (d.type === "youtube") {
            return Response.json({ success: true, type: "youtube", videoUrl: d.url });
          }
          videoUrl = d.url;
        } else if (Array.isArray(items) && items[0]?.url) {
          if (items[0].type === "youtube") {
            return Response.json({ success: true, type: "youtube", videoUrl: items[0].url });
          }
          videoUrl = items[0].url;
        }
      }
    }

    // ── Step 8: content endpoint ──────────────────────────────────────────
    if (!videoUrl && subjectId) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/content?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`
      );
      assign(data);
    }

    // ── Step 9: play endpoint (some versions use this) ────────────────────
    if (!videoUrl) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/play?childId=${childId}&batchId=${batchId}${subjectId ? `&subjectId=${subjectId}` : ""}`
      );
      assign(data);
    }

    // ── Step 10: Retry step 1-3 with a small delay (handles transient failures) ─
    if (!videoUrl) {
      await new Promise((r) => setTimeout(r, 600));
      if (subjectId) {
        const data = await tryFetch(
          `${PROXY_BASE}/api/pw/get-url?childId=${childId}&batchId=${batchId}&subjectId=${subjectId}`,
          15000
        );
        assign(data);
      }
    }
    if (!videoUrl) {
      const data = await tryFetch(
        `${PROXY_BASE}/api/pw/get-url?childId=${childId}&batchId=${batchId}`,
        15000
      );
      assign(data);
    }

    // ── Fail ──────────────────────────────────────────────────────────────
    if (!videoUrl) {
      return Response.json({
        success: false,
        error: "Could not resolve video URL. Please try again or this video may not be available.",
      });
    }

    // ── YouTube ───────────────────────────────────────────────────────────
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      return Response.json({ success: true, type: "youtube", videoUrl });
    }

    // ── MPD → DRM or HLS fallback ─────────────────────────────────────────
    const isMpd = videoUrl.includes(".mpd");
    const hlsUrl = videoUrl.replace(/\.mpd(\?|$)/, ".m3u8$1");

    if (isMpd || videoType === "DASH") {
      const kidData = await tryFetch(
        `${PROXY_BASE}/api/pw/kid?mpdUrl=${encodeURIComponent(videoUrl)}`
      );

      if (kidData?.success && kidData.kid) {
        const kid = kidData.kid as string;

        // Try OTP with different parameter combinations
        let otpKey: string | null = null;

        // Attempt 1: all params
        const otpParams1 = new URLSearchParams({ kid });
        if (subjectSlug) otpParams1.set("subject_slug", subjectSlug);
        if (batchId) otpParams1.set("batch_id", batchId);
        if (subjectId) otpParams1.set("subject_id", subjectId);
        const otp1 = await tryFetch(`${PROXY_BASE}/api/pw/otp?${otpParams1.toString()}`);
        if (otp1?.success && otp1.key) otpKey = otp1.key as string;

        // Attempt 2: kid only (simpler request)
        if (!otpKey) {
          const otp2 = await tryFetch(`${PROXY_BASE}/api/pw/otp?kid=${kid}`);
          if (otp2?.success && otp2.key) otpKey = otp2.key as string;
        }

        // Attempt 3: retry after a short delay (transient failures)
        if (!otpKey) {
          await new Promise((r) => setTimeout(r, 800));
          const otp3 = await tryFetch(`${PROXY_BASE}/api/pw/otp?${otpParams1.toString()}`, 15000);
          if (otp3?.success && otp3.key) otpKey = otp3.key as string;
        }

        if (otpKey) {
          return Response.json({
            success: true,
            type: "drm",
            mpdUrl: videoUrl,
            hlsUrl: proxyHls(hlsUrl),
            rawHlsUrl: hlsUrl,
            kid,
            key: otpKey,
          });
        }

        // Key not available → still pass kid+mpdUrl so player can try Shaka with Widevine EME
        return Response.json({
          success: true,
          type: "drm_no_key",
          mpdUrl: videoUrl,
          hlsUrl: proxyHls(hlsUrl),
          rawHlsUrl: hlsUrl,
          kid,
          videoUrl: proxyHls(hlsUrl),
        });
      }

      // KID extraction failed → proxy the HLS
      return Response.json({
        success: true,
        type: "hls",
        videoUrl: proxyHls(hlsUrl),
        hlsUrl: proxyHls(hlsUrl),
        rawHlsUrl: hlsUrl,
        mpdUrl: videoUrl,
      });
    }

    // ── Plain HLS ─────────────────────────────────────────────────────────
    const isHls = videoUrl.includes(".m3u8") || videoUrl.includes(".m3u");
    if (isHls) {
      return Response.json({
        success: true,
        type: "hls",
        hlsUrl: proxyHls(videoUrl),
        rawHlsUrl: videoUrl,
        videoUrl: proxyHls(videoUrl),
      });
    }

    // ── MP4 / direct ──────────────────────────────────────────────────────
    return Response.json({ success: true, type: "mp4", videoUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get video URL";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
