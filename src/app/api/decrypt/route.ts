import { NextRequest } from "next/server";
import { decryptJson } from "@/lib/decrypt";

const PROXY_BASE = "https://apiserverpro.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return Response.json({ error: "endpoint required" }, { status: 400 });
  }

  try {
    const url = `${PROXY_BASE}${endpoint}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.data && typeof data.data === "string" && data.data.includes(":")) {
      const decrypted = decryptJson(data.data);
      return Response.json(decrypted);
    }

    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Decrypt failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return Response.json({ error: "endpoint required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const url = `${PROXY_BASE}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.data && typeof data.data === "string" && data.data.includes(":")) {
      const decrypted = decryptJson(data.data);
      return Response.json(decrypted);
    }

    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Decrypt failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
