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
          <Link href={`/batch/${batchId}`} className="hover:text-indigo-600 transition-colors font-semibold truncate max-w-[140px]">
            {batchName || "Batch"}
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-600 font-semibold truncate max-w-[180px]">{subjectName}</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{subjectName}</h1>
            {!error && (
              <p className="text-slate-400 text-sm mt-1.5">
                <span className="font-bold text-indigo-600">{topics.length}</span> lesson{topics.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
          <Link
            href={`/batch/${batchId}`}
            className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 self-start sm:self-center flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Batch
          </Link>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-28 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-slate-800 font-bold text-lg mb-2">Failed to load topics</h3>
            <p className="text-red-400 font-medium text-sm">{error}</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-28 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-slate-800 font-bold text-lg mb-1">No lessons yet</h3>
            <p className="text-slate-400 text-sm">Content will be added soon. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up">
            {topics.map((topic, idx) => (
              <Link
                key={topic._id}
                href={`/batch/${batchId}/subject/${subjectId}/topic/${topic._id}?subjectSlug=${encodeURIComponent(subjectSlug)}&topicSlug=${encodeURIComponent(topic.slug)}`}
                className="group block animate-fade-up"
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <div className="card rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    {/* Number badge */}
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 font-black text-indigo-600 text-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-900 font-bold text-[15px] mb-3 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
                        {topic.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          {topic.videos} Videos
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {topic.notes} Notes
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {topic.exercises} DPP
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-all flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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
