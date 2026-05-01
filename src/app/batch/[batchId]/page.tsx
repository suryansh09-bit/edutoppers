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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">&#9888;</div>
            <p className="text-red-400 text-lg mb-4">{error || "Batch not found"}</p>
            <Link href="/" className="btn-purple text-white px-6 py-2 rounded-lg">
              Back to Batches
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-accent-purple rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {batchDetail.name}
            </h1>
            <span className="flex items-center gap-1 text-accent-green text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-accent-green" />
              {batchDetail.status?.toUpperCase() || "ACTIVE"}
            </span>
          </div>
          <Link
            href="/"
            className="btn-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
          >
            &larr; Back
          </Link>
        </div>

        {batchDetail.byName && (
          <div className="bg-bg-card border border-border-color rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
            <span className="text-accent-blue text-lg">&#9432;</span>
            <span className="text-white font-medium uppercase text-sm tracking-wide">
              {batchDetail.byName}
            </span>
          </div>
        )}

        <BatchTabs batchDetail={batchDetail} />
      </div>
    </main>
  );
}
