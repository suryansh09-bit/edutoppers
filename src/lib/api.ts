const PROXY_BASE = "https://apiserverpro.vercel.app";
const PW_API_BASE = "https://api.penpencil.co";

const PW_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Referer: "https://www.pw.live/",
  "Client-Id": "system-admin",
  Randomid: "pw-app-request",
};

export async function fetchEncryptedBatches(): Promise<string> {
  const res = await fetch(`${PROXY_BASE}/api/pw/batches`, {
    next: { revalidate: 300 },
  });
  const data = await res.json();
  return data.data;
}

export async function fetchEncryptedTopics(
  batchId: string,
  subjectId: string
): Promise<string> {
  const res = await fetch(
    `${PROXY_BASE}/api/pw/topics?BatchId=${batchId}&SubjectId=${subjectId}`,
    { next: { revalidate: 300 } }
  );
  const data = await res.json();
  return data.data;
}

export async function fetchEncryptedDataContent(
  batchId: string,
  subjectSlug: string,
  topicSlug: string
): Promise<string> {
  const res = await fetch(
    `${PROXY_BASE}/api/pw/datacontent?batchId=${batchId}&subjectSlug=${subjectSlug}&topicSlug=${topicSlug}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return data.data;
}

export async function fetchEncryptedVideo(
  batchId: string,
  subjectId: string,
  childId: string
): Promise<string> {
  const res = await fetch(
    `${PROXY_BASE}/api/pw/video?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return data.data;
}

export async function fetchEncryptedLiveClasses(
  batchId: string
): Promise<string> {
  const res = await fetch(`${PROXY_BASE}/api/pw/live`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ searchParams: { BatchId: batchId } }),
    cache: "no-store",
  });
  const data = await res.json();
  return data.data;
}

export async function fetchBatchDetails(batchId: string) {
  const res = await fetch(`${PW_API_BASE}/v3/batches/${batchId}/details`, {
    headers: PW_HEADERS,
    next: { revalidate: 300 },
  });
  return res.json();
}

export async function fetchVideoPlay(
  batchId: string,
  subjectId: string,
  childId: string
) {
  const res = await fetch(
    `${PROXY_BASE}/api/pw/videoplay?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`,
    { cache: "no-store" }
  );
  return res.json();
}

export async function fetchGetUrl(params: {
  videoId?: string;
  batchId?: string;
  subjectSlug?: string;
  childId?: string;
}) {
  const sp = new URLSearchParams();
  if (params.videoId) sp.set("video_id", params.videoId);
  if (params.batchId) sp.set("batch_id", params.batchId);
  if (params.subjectSlug) sp.set("subject_slug", params.subjectSlug);
  if (params.childId) sp.set("childId", params.childId);
  if (params.batchId && params.childId) sp.set("batchId", params.batchId);

  const res = await fetch(
    `${PROXY_BASE}/api/pw/get-url?${sp.toString()}`,
    { cache: "no-store" }
  );
  return res.json();
}

export async function fetchKid(mpdUrl: string) {
  const res = await fetch(
    `${PROXY_BASE}/api/pw/kid?mpdUrl=${encodeURIComponent(mpdUrl)}`,
    { cache: "no-store" }
  );
  return res.json();
}

export async function fetchOtp(
  kid: string,
  subjectSlug: string,
  batchId: string,
  subjectId: string
) {
  const sp = new URLSearchParams({
    kid,
    subject_slug: subjectSlug,
    batch_id: batchId,
    subject_id: subjectId,
  });
  const res = await fetch(
    `${PROXY_BASE}/api/pw/otp?${sp.toString()}`,
    { cache: "no-store" }
  );
  return res.json();
}

export async function fetchAttachmentsUrl(
  batchId: string,
  subjectId: string,
  contentId: string
) {
  const res = await fetch(
    `${PROXY_BASE}/api/pw/attachments-url?BatchId=${batchId}&SubjectId=${subjectId}&ContentId=${contentId}`,
    { cache: "no-store" }
  );
  return res.json();
}
