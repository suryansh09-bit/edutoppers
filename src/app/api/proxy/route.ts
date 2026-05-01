import { NextRequest } from "next/server";

const PW_API_BASE = "https://api.penpencil.co";
const PROXY_BASE = "https://apiserverpro.vercel.app";

const PW_HEADERS: Record<string, string> = {
  Referer: "https://www.pw.live/",
  "Client-Id": "system-admin",
  Randomid: "pw-app-request",
  Accept: "application/json",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const endpoint = searchParams.get("endpoint");
  const source = searchParams.get("source") || "pw";

  if (!endpoint) {
    return Response.json({ error: "endpoint required" }, { status: 400 });
  }

  try {
    let url: string;
    let headers: Record<string, string>;

    if (source === "proxy") {
      url = `${PROXY_BASE}${endpoint}`;
      headers = {};
    } else {
      url = `${PW_API_BASE}${endpoint}`;
      headers = PW_HEADERS;
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}
