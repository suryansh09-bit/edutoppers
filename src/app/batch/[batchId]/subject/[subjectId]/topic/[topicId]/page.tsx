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
  let subjectSlug = sp.subjectSlug || "";
  let topicSlug = sp.topicSlug || "";

  try {
    const [detailsRes, encryptedTopics] = await Promise.all([
      fetchBatchDetails(batchId),
      fetchEncryptedTopics(batchId, subjectId),
    ]);

    if (detailsRes.success) {
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
    <main>
      <Header />
      <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2 flex-wrap">
              <Link href="/" className="hover:text-indigo-600 transition-colors font-medium">Home</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <Link href={`/batch/${batchId}/subject/${subjectId}`} className="hover:text-indigo-600 transition-colors font-medium truncate max-w-[100px]">{subjectName || "Subject"}</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-slate-600 font-medium truncate max-w-[140px]">{topicName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug line-clamp-2">{topicName}</h1>
          </div>
          <Link
            href={`/batch/${batchId}/subject/${subjectId}`}
            className="btn-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 self-start sm:self-center flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Lessons
          </Link>
        </div>

        <TopicContent
          batchId={batchId}
          subjectId={subjectId}
          topicId={topicId}
          topicName={topicName}
          subjectSlug={subjectSlug}
          topicSlug={topicSlug}
        />
      </div>
    </main>
  );
}
