import Link from "next/link";
import Header from "@/components/Header";
import BatchTabs from "@/components/BatchTabs";
import { fetchBatchDetails } from "@/lib/api";
import type { BatchDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  let batchDetail: BatchDetail | null = null;
  let error = "";

  try {
    const res = await fetchBatchDetails(batchId);
    if (res.success) {
      batchDetail = res.data;
    } else {
      error = "Failed to load batch details";
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch batch details";
  }

  if (error || !batchDetail) {
    return (
      <main className="page-bg min-h-screen">
        <Header />
        <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">
          <div className="text-center py-32 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-slate-800 font-extrabold text-2xl mb-2">Batch Not Found</h2>
            <p className="text-red-400 font-medium mb-7">{error || "The batch you are looking for doesn't exist."}</p>
            <Link href="/" className="btn-primary px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-bg min-h-screen">
      <Header />
      <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 animate-fade-up">
          <Link href="/" className="hover:text-indigo-600 transition-colors font-semibold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-500 font-medium truncate max-w-[280px]">{batchDetail.name}</span>
        </div>

        {/* Header card */}
        <div className="relative rounded-3xl overflow-hidden mb-8 hero-bg animate-fade-up">
          <div className="orb w-64 h-64 bg-white/10 -top-16 -right-16" />
          <div className="orb w-40 h-40 bg-violet-300/20 bottom-0 left-1/4" />

          <div className="relative z-10 px-7 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-bold border border-white/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {batchDetail.status?.toUpperCase() || "ACTIVE"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight mb-2">
                {batchDetail.name}
              </h1>
              {batchDetail.byName && (
                <p className="text-white/65 text-sm font-medium">{batchDetail.byName}</p>
              )}
            </div>

            <Link
              href="/"
              className="self-start sm:self-center flex-shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all border border-white/25"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <BatchTabs batchDetail={batchDetail} />
        </div>
      </div>
    </main>
  );
}
