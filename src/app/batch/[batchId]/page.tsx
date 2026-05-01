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
      <main>
        <Header />
        <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-red-500 font-semibold text-lg mb-5">{error || "Batch not found"}</p>
            <Link href="/" className="btn-purple text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">
        {/* Breadcrumb + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Link href="/" className="hover:text-indigo-600 transition-colors font-medium">Home</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-600 font-medium truncate max-w-[200px]">{batchDetail.name}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{batchDetail.name}</h1>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {batchDetail.status?.toUpperCase() || "ACTIVE"}
              </span>
            </div>
            {batchDetail.byName && (
              <p className="text-slate-500 text-sm mt-1.5 font-medium">{batchDetail.byName}</p>
            )}
          </div>
          <Link
            href="/"
            className="btn-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 self-start sm:self-center flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        <BatchTabs batchDetail={batchDetail} />
      </div>
    </main>
  );
}
