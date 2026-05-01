import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/hls-proxy?url=<encoded-m3u8-url>
 *
 * Server-side HLS proxy that:
 * 1. Fetches the M3U8 playlist from the signed URL
 * 2. Rewrites all relative and absolute URIs inside the playlist to go
 *    through this proxy (so auth query params are always forwarded)
 * 3. Returns the rewritten playlist with correct Content-Type
 *
 * This solves the "levelLoadError" caused by CloudFront/PW signed URLs
 * where sub-playlists and segments are at relative paths that lose the
 * Signature / Key-Pair-Id / Policy / URLPrefix / Expires params.
 */
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
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EduToppers/1.0)",
        Accept: "*/*",
        Referer: "https://www.pw.live/",
        Origin: "https://www.pw.live",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status} ${res.statusText}`, {
        status: res.status,
      });
    }

    const contentType = res.headers.get("content-type") || "";

    // If it's not an HLS playlist, stream it straight through (e.g. TS segments, key files)
    if (!contentType.includes("mpegurl") && !contentType.includes("text/plain") &&
        !targetUrl.includes(".m3u8") && !targetUrl.includes(".m3u")) {
      const body = await res.arrayBuffer();
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    }

    const playlistText = await res.text();

    // Extract the base URL and query string from the signed URL
    const urlObj = new URL(targetUrl);
    const authQuery = urlObj.search; // e.g. "?Signature=...&Key-Pair-Id=...&Policy=..."
    // Base path without the filename, used to resolve relative URLs
    const basePath = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf("/") + 1);

    // Rewrite the playlist content
    const rewritten = rewriteM3u8(playlistText, basePath, authQuery);

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy error";
    return new NextResponse(msg, { status: 500 });
  }
}

/**
 * Rewrites all URIs inside an M3U8 playlist to go through /api/hls-proxy.
 * Handles:
 *   - Relative paths:  hls/720/main.m3u8  →  /api/hls-proxy?url=<full-url-with-auth>
 *   - Absolute paths:  /path/to/seg.ts    →  /api/hls-proxy?url=<origin+path+auth>
 *   - Full URLs:       https://cdn/...     →  /api/hls-proxy?url=<url> (auth appended if missing)
 *   - URI= attributes in EXT-X-KEY tags
 */
function rewriteM3u8(playlist: string, basePath: string, authQuery: string): string {
  const lines = playlist.split("\n");
  const result: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // EXT-X-KEY URI rewrite
    if (line.startsWith("#EXT-X-KEY") && line.includes('URI="')) {
      result.push(rewriteTagUri(line, basePath, authQuery));
      continue;
    }

    // EXT-X-MAP URI rewrite
    if (line.startsWith("#EXT-X-MAP") && line.includes('URI="')) {
      result.push(rewriteTagUri(line, basePath, authQuery));
      continue;
    }

    // Skip other tag lines
    if (line.startsWith("#") || line.trim() === "") {
      result.push(line);
      continue;
    }

    // It's a URI line (segment or sub-playlist)
    result.push(rewriteUri(line, basePath, authQuery));
  }

  return result.join("\n");
}

function rewriteUri(uri: string, basePath: string, authQuery: string): string {
  if (!uri || uri.trim() === "") return uri;
  uri = uri.trim();

  let fullUrl: string;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    // Already absolute — append auth if missing
    fullUrl = appendAuth(uri, authQuery);
  } else if (uri.startsWith("/")) {
    // Absolute path
    const baseOrigin = new URL(basePath).origin;
    fullUrl = appendAuth(baseOrigin + uri, authQuery);
  } else {
    // Relative path
    fullUrl = appendAuth(basePath + uri, authQuery);
  }

  return `/api/hls-proxy?url=${encodeURIComponent(fullUrl)}`;
}

function rewriteTagUri(tag: string, basePath: string, authQuery: string): string {
  return tag.replace(/URI="([^"]+)"/, (_match: string, uri: string) => {
    const rewritten = rewriteUri(uri, basePath, authQuery);
    return `URI="${rewritten}"`;
  });
}

function appendAuth(url: string, authQuery: string): string {
  if (!authQuery || authQuery === "?" || authQuery === "") return url;
  if (url.includes("?")) {
    // Check if auth params already present
    if (url.includes("Signature=") || url.includes("Key-Pair-Id=") || url.includes("URLPrefix=")) {
      return url;
    }
    return url + "&" + authQuery.slice(1);
  }
  return url + authQuery;
}
