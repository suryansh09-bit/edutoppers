import { NextRequest } from "next/server";

const PROXY_BASE = "https://apiserverpro.vercel.app";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429 && i < retries - 1) {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const batchId = body.batchId;

    if (!batchId) {
      return Response.json(
        { error: "batchId is required" },
        { status: 400 }
      );
    }

    const res = await fetchWithRetry(
      `${PROXY_BASE}/api/pw/live`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.message || data.error || "Failed to fetch live classes", data: [] },
        { status: res.status }
      );
    }

    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch live classes";
    return Response.json({ error: msg, data: [] }, { status: 500 });
  }
}
