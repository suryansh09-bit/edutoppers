import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/hls-proxy?url=<encoded-m3u8-url>
 *
 * Server-side HLS proxy that:
 * 1. Fetches the M3U8 playlist from the signed URL with proper PW headers
 * 2. Rewrites all relative and absolute URIs inside the playlist to go
 *    through this proxy (so auth query params are always forwarded)
 * 3. Returns the rewritten playlist with correct Content-Type
 *
 * This solves the "levelLoadError" caused by CloudFront/PW signed URLs
 * where sub-playlists and segments are at relative paths that lose the
 * Signature / Key-Pair-Id / Policy / URLPrefix / Expires params.
 */

const PW_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.pw.live/",
  Origin: "https://www.pw.live",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const encodedUrl = searchParams.get("url");

  if (!encodedUrl) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(encodedUrl);
  } catch {
    return new NextResponse("Invalid url param", { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: PW_HEADERS,
      cache: "no-store",
    });

    if (!res.ok) {
      // Return a meaningful error body
      const errText = await res.text().catch(() => "");
      return new NextResponse(
        `Upstream error: ${res.status} ${res.statusText}${errText ? "\n" + errText.slice(0, 200) : ""}`,
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    const isPlaylist =
      contentType.includes("mpegurl") ||
      contentType.includes("x-mpegurl") ||
      contentType.includes("text/plain") ||
      targetUrl.includes(".m3u8") ||
      targetUrl.includes(".m3u");

    // If it's not an HLS playlist, stream it straight through (TS segments, key files, etc.)
    if (!isPlaylist) {
      const body = await res.arrayBuffer();
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Cache-Control": "no-store",
        },
      });
    }

    const playlistText = await res.text();

    // Extract base URL info from the signed URL
    const urlObj = new URL(targetUrl);
    // Preserve the full query string (CloudFront auth tokens)
    const authQuery = urlObj.search; // e.g. "?Signature=...&Key-Pair-Id=...&Policy=..."
    // Base path without the filename, used to resolve relative URLs
    const basePath =
      urlObj.origin +
      urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf("/") + 1);

    // Rewrite the playlist content
    const rewritten = rewriteM3u8(playlistText, basePath, authQuery, urlObj.origin);

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy error";
    return new NextResponse(msg, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
    },
  });
}

/**
 * Rewrites all URIs inside an M3U8 playlist to go through /api/hls-proxy.
 * Handles:
 *   - Relative paths:  hls/720/main.m3u8  →  /api/hls-proxy?url=<full-url-with-auth>
 *   - Absolute paths:  /path/to/seg.ts    →  /api/hls-proxy?url=<origin+path+auth>
 *   - Full URLs:       https://cdn/...     →  /api/hls-proxy?url=<url> (auth appended if missing)
 *   - URI= attributes in EXT-X-KEY and EXT-X-MAP tags
 *   - EXT-X-STREAM-INF and EXT-X-MEDIA URIs in master playlists
 */
function rewriteM3u8(
  playlist: string,
  basePath: string,
  authQuery: string,
  origin: string
): string {
  const lines = playlist.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // EXT-X-KEY URI rewrite (encryption key files)
    if (line.startsWith("#EXT-X-KEY") && line.includes('URI="')) {
      result.push(rewriteTagUri(line, basePath, authQuery, origin));
      continue;
    }

    // EXT-X-MAP URI rewrite (initialization segment)
    if (line.startsWith("#EXT-X-MAP") && line.includes('URI="')) {
      result.push(rewriteTagUri(line, basePath, authQuery, origin));
      continue;
    }

    // EXT-X-MEDIA URI rewrite (alternative audio/subtitle tracks)
    if (line.startsWith("#EXT-X-MEDIA") && line.includes('URI="')) {
      result.push(rewriteTagUri(line, basePath, authQuery, origin));
      continue;
    }

    // Skip other tag lines (but not blank lines which may precede URIs)
    if (line.startsWith("#")) {
      result.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      result.push(line);
      continue;
    }

    // It's a URI line (segment or sub-playlist)
    result.push(rewriteUri(line, basePath, authQuery, origin));
  }

  return result.join("\n");
}

function rewriteUri(
  uri: string,
  basePath: string,
  authQuery: string,
  origin: string
): string {
  if (!uri || uri.trim() === "") return uri;
  uri = uri.trim();

  let fullUrl: string;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    // Already absolute — append auth if missing
    fullUrl = appendAuth(uri, authQuery);
  } else if (uri.startsWith("//")) {
    // Protocol-relative
    fullUrl = appendAuth("https:" + uri, authQuery);
  } else if (uri.startsWith("/")) {
    // Absolute path — use origin from the signed URL
    fullUrl = appendAuth(origin + uri, authQuery);
  } else {
    // Relative path — resolve against basePath
    fullUrl = appendAuth(basePath + uri, authQuery);
  }

  return `/api/hls-proxy?url=${encodeURIComponent(fullUrl)}`;
}

function rewriteTagUri(
  tag: string,
  basePath: string,
  authQuery: string,
  origin: string
): string {
  return tag.replace(/URI="([^"]+)"/g, (_match: string, uri: string) => {
    const rewritten = rewriteUri(uri, basePath, authQuery, origin);
    return `URI="${rewritten}"`;
  });
}

function appendAuth(url: string, authQuery: string): string {
  if (!authQuery || authQuery === "?" || authQuery === "") return url;

  // Parse the URL to check if auth params are already present
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // If any CloudFront / PW auth params already exist, don't duplicate
    if (
      params.has("Signature") ||
      params.has("Key-Pair-Id") ||
      params.has("URLPrefix") ||
      params.has("Expires") ||
      params.has("Policy") ||
      params.has("X-Amz-Signature")
    ) {
      return url;
    }

    // Append auth query string
    const separator = url.includes("?") ? "&" : "?";
    return url + separator + authQuery.replace(/^\?/, "");
  } catch {
    // URL parsing failed — fall back to string manipulation
    if (url.includes("Signature=") || url.includes("Key-Pair-Id=") || url.includes("URLPrefix=")) {
      return url;
    }
    const separator = url.includes("?") ? "&" : "?";
    return url + separator + authQuery.replace(/^\?/, "");
  }
}
