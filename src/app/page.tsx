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
    <main>
      <Header />
      <div className="px-4 sm:px-6 py-8 max-w-[1400px] mx-auto">
        {error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">&#9888;</div>
            <p className="text-red-400 text-lg">{error}</p>
          </div>
        ) : (
          <BatchGrid batches={batches} />
        )}
      </div>
    </main>
  );
}
