import { NextRequest, NextResponse } from "next/server";

const TURNSTILE_SECRET = "0x4AAAAAADHS5HnIzeSZTPFa1AUuSJXxFl8";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const formData = new FormData();
    formData.append("secret", TURNSTILE_SECRET);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const cfRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });

    const cfData = await cfRes.json();

    if (cfData.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, "error-codes": cfData["error-codes"] ?? [] },
      { status: 403 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
