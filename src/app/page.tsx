import Header from "@/components/Header";
import BatchGrid from "@/components/BatchGrid";
import { fetchEncryptedBatches } from "@/lib/api";
import { decryptJson } from "@/lib/decrypt";
import type { BatchesResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let batches: BatchesResponse["data"] = [];
  let error = "";

  try {
    const encrypted = await fetchEncryptedBatches();
    const result = decryptJson<BatchesResponse>(encrypted);
    batches = result.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch batches";
  }

  return (
    <main className="page-bg min-h-screen">
      <Header />
      <div className="px-4 sm:px-6 pt-7 pb-16 max-w-[1400px] mx-auto">
        {error ? (
          <div className="text-center py-32 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-slate-800 font-extrabold text-xl mb-2">Unable to load courses</h2>
            <p className="text-red-400 font-medium text-sm">{error}</p>
          </div>
        ) : (
          <BatchGrid batches={batches} />
        )}
      </div>
    </main>
  );
}
