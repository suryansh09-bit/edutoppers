import Link from "next/link";
import Header from "@/components/Header";
import { fetchEncryptedTopics, fetchBatchDetails } from "@/lib/api";
import { decryptJson } from "@/lib/decrypt";
import type { TopicsResponse, Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ batchId: string; subjectId: string }>;
}) {
  const { batchId, subjectId } = await params;

  let topics: TopicsResponse["data"] = [];
  let subjectName = "Subject";
  let subjectSlug = "";
  let error = "";

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
        subjectName = subject.subject;
        subjectSlug = subject.slug || "";
      }
    }

    const result = decryptJson<TopicsResponse>(encryptedTopics);
    if (result.success) {
      topics = result.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch topics";
  }

  return (
    <main>
      <Header />
      <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-accent-purple rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {subjectName} - Lessons
            </h1>
          </div>
          <Link
            href={`/batch/${batchId}`}
            className="btn-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
          >
            &larr; Back to Batch
          </Link>
        </div>

        {error ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">&#9888;</div>
            <p className="text-red-400 text-lg">{error}</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-50">&#128218;</div>
            <p className="text-text-secondary text-lg">
              No lessons available yet
            </p>
          </div>
        ) : (
          <>
            <p className="text-text-secondary text-sm mb-6">
              Showing {topics.length} lessons
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {topics.map((topic) => (
                <Link
                  key={topic._id}
                  href={`/batch/${batchId}/subject/${subjectId}/topic/${topic._id}?subjectSlug=${encodeURIComponent(subjectSlug)}&topicSlug=${encodeURIComponent(topic.slug)}`}
                >
                  <div className="card-gradient rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base mb-3">
                          {topic.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-accent-blue">
                            <span>&#127909;</span> {topic.videos} Videos
                          </span>
                          <span className="flex items-center gap-1.5 text-accent-green">
                            <span>&#128196;</span> {topic.notes} Notes
                          </span>
                          <span className="flex items-center gap-1.5 text-accent-purple">
                            <span>&#10133;</span> {topic.exercises} Exercises
                          </span>
                        </div>
                      </div>
                      <span className="w-3 h-3 rounded-full bg-accent-green flex-shrink-0 ml-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
