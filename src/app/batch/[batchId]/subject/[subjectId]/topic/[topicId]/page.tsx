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
  let subjectSlug = sp.subjectSlug || "";
  let topicSlug = sp.topicSlug || "";

  try {
    const [detailsRes, encryptedTopics] = await Promise.all([
      fetchBatchDetails(batchId),
      fetchEncryptedTopics(batchId, subjectId),
    ]);

    if (detailsRes.success) {
      const subject = detailsRes.data.subjects.find(
        (s: Subject) => s._id === subjectId
      );
      if (subject) {
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-accent-purple rounded-full" />
            <h1 className="text-xl sm:text-2xl font-bold text-white line-clamp-1">
              {topicName}
            </h1>
          </div>
          <Link
            href={`/batch/${batchId}/subject/${subjectId}`}
            className="btn-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform flex-shrink-0"
          >
            &larr; Back to Lessons
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
