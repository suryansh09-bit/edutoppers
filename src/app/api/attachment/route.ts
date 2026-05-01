import { NextRequest } from "next/server";

const PROXY_BASE = "https://apiserverpro.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const batchId = searchParams.get("batchId") || searchParams.get("BatchId");
  const subjectId =
    searchParams.get("subjectId") || searchParams.get("SubjectId");
  const contentId =
    searchParams.get("contentId") || searchParams.get("ContentId");

  if (!batchId || !subjectId || !contentId) {
    return Response.json(
      { error: "Missing required params: batchId, subjectId, contentId" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${PROXY_BASE}/api/pw/attachments-url?BatchId=${batchId}&SubjectId=${subjectId}&ContentId=${contentId}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get attachment URL";
    return Response.json({ error: msg }, { status: 500 });
  }
}
