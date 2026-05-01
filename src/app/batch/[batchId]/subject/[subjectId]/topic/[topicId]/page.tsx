import Link from "next/link";
import Header from "@/components/Header";
import TopicContent from "@/components/TopicContent";
import { fetchEncryptedTopics, fetchBatchDetails } from "@/lib/api";
import { decryptJson } from "@/lib/decrypt";
import type { TopicsResponse, Topic, Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string; subjectId: string; topicId: string }>;
  searchParams: Promise<{ subjectSlug?: string; topicSlug?: string }>;
}) {
  const { batchId, subjectId, topicId } = await params;
  const sp = await searchParams;

  let topicName = "Topic";
  let subjectName = "";
  let batchName = "";
  let subjectSlug = sp.subjectSlug || "";
  let topicSlug = sp.topicSlug || "";

  try {
    const [detailsRes, encryptedTopics] = await Promise.all([
      fetchBatchDetails(batchId),
      fetchEncryptedTopics(batchId, subjectId),
    ]);

    if (detailsRes.success) {
      batchName = detailsRes.data.name || "";
      const subject = detailsRes.data.subjects.find((s: Subject) => s._id === subjectId);
      if (subject) {
        subjectName = subject.subject;
        if (!subjectSlug) subjectSlug = subject.slug || "";
      }
    }

    const topicsResult = decryptJson<TopicsResponse>(encryptedTopics);
    if (topicsResult.success) {
      const topic = topicsResult.data.find((t: Topic) => t._id === topicId);
      if (topic) {
        topicName = topic.name;
        if (!topicSlug) topicSlug = topic.slug || "";
      }
    }
  } catch {
    // Use defaults
  }

  return (
    <main className="page-bg min-h-screen">
      <Header />
      <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap animate-fade-up">
          <Link href="/" className="hover:text-indigo-600 transition-colors font-semibold flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/batch/${batchId}`} className="hover:text-indigo-600 transition-colors font-semibold truncate max-w-[100px]">
            {batchName || "Batch"}
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/batch/${batchId}/subject/${subjectId}`} className="hover:text-indigo-600 transition-colors font-semibold truncate max-w-[110px]">
            {subjectName || "Subject"}
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-600 font-semibold truncate max-w-[150px]">{topicName}</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-8 animate-fade-up">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug line-clamp-2 tracking-tight">
              {topicName}
            </h1>
            {subjectName && (
              <p className="text-slate-400 text-sm mt-1.5 font-medium">
                <span className="text-indigo-600 font-semibold">{subjectName}</span> &middot; Study Materials
              </p>
            )}
          </div>
          <Link
            href={`/batch/${batchId}/subject/${subjectId}`}
            className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 self-start flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lessons
          </Link>
        </div>

        {/* Topic content */}
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <TopicContent
            batchId={batchId}
            subjectId={subjectId}
            topicId={topicId}
            topicName={topicName}
            subjectSlug={subjectSlug}
            topicSlug={topicSlug}
          />
        </div>
      </div>
    </main>
  );
}
