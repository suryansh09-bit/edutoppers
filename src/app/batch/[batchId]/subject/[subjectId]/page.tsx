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
  let batchName = "";
  let subjectSlug = "";
  let error = "";

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2 flex-wrap">
              <Link href="/" className="hover:text-indigo-600 transition-colors font-medium">Home</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <Link href={`/batch/${batchId}`} className="hover:text-indigo-600 transition-colors font-medium truncate max-w-[120px]">{batchName || "Batch"}</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-slate-600 font-medium">{subjectName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{subjectName}</h1>
            {!error && <p className="text-slate-500 text-sm mt-1">{topics.length} lessons available</p>}
          </div>
          <Link
            href={`/batch/${batchId}`}
            className="btn-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 self-start sm:self-center flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Batch
          </Link>
        </div>

        {error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-red-500 font-semibold mb-4">{error}</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-slate-700 font-semibold text-lg mb-1">No lessons yet</h3>
            <p className="text-slate-400 text-sm">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up">
            {topics.map((topic, idx) => (
              <Link
                key={topic._id}
                href={`/batch/${batchId}/subject/${subjectId}/topic/${topic._id}?subjectSlug=${encodeURIComponent(subjectSlug)}&topicSlug=${encodeURIComponent(topic.slug)}`}
                className="group block"
              >
                <div className="card-gradient rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    {/* Number */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 font-black text-indigo-600 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-900 font-bold text-base mb-3 group-hover:text-indigo-700 transition-colors leading-snug">
                        {topic.name}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          {topic.videos} Videos
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {topic.notes} Notes
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          {topic.exercises} Exercises
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
